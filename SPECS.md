# Split Bill Phase 1 Specification

## 1. Objective and phase boundary

Phase 1 converts an authenticated user's receipt image into a persisted bill and
its line items. The result is displayed in a minimal Vue view.

This phase includes:

- Flyway schema for `bills` and `bill_items`.
- Reactive R2DBC entities and repositories.
- An adapter from the existing parsed receipt model to the bill model.
- Atomic persistence of a bill and all of its items.
- One authenticated multipart upload endpoint.
- One minimal frontend view, store action, route, and matching TypeScript types.

This phase explicitly excludes share links, participants, claims, live updates,
DuitNow QR display, and payment reconciliation. No tables or placeholder code
for those capabilities should be added.

## 2. Confirmed current architecture

### Backend

- Spring Boot 3.2.4, Kotlin 1.9.23, Java 21, and WebFlux.
- Request-path database access uses `r2dbc-postgresql` and Spring Data R2DBC.
- Repositories use `CoroutineCrudRepository`; service/controller APIs use
  suspending functions and `Flow`. These are reactive coroutine adapters and
  should remain the local convention rather than introducing JDBC or JPA.
- Flyway uses JDBC only at application startup for migrations. This does not put
  blocking JDBC on a request thread.
- Database migrations are sequential SQL files under
  `duit-api/src/main/resources/db/migration`. Phase 1 uses
  `V6__create_bills.sql` followed by `V7__add_currency_to_bills.sql`.
- Authenticated controllers receive the owner UUID through
  `@AuthenticationPrincipal userId: UUID`.
- API results use the existing `ApiResponse<T>` envelope.

### Existing receipt pipeline

The reusable entry point is
`com.duit.receipt.ocr.ExpenseOcrService.parse(imageBytes)`. Its pipeline is:

1. `GoogleVisionTextExtractor` performs text detection.
2. `CategoryRepository` reactively loads allowed category names.
3. A non-blocking `WebClient` call asks Gemini to structure the OCR text.
4. Jackson deserializes the response into `ParsedReceipt`.
5. `OcrMerchantMatcher` optionally canonicalizes the merchant name.

`ParsedReceipt.lineItems` already exposes:

- `qty: Int`
- `description: String`
- `unitPrice: BigDecimal`
- `lineTotal: BigDecimal`

Therefore, Phase 1 needs an adapter and validation, not a parser rewrite.

Google's `ImageAnnotatorClient` is a blocking client. The current extractor
isolates it with `withContext(Dispatchers.IO)`, so it does not block a Netty event
loop, but the Phase 1 acceptance criterion specifically requires bounded
elastic. During implementation, wrap only the synchronous client creation and
annotation call in `Mono.fromCallable`, run that publisher on
`Schedulers.boundedElastic()`, and await it from the suspending pipeline. Do not
wrap the R2DBC or WebClient stages, which are already non-blocking. Add a test or
BlockHound-equivalent verification around this boundary.

### Frontend

- Vue 3 Composition API with TypeScript, Pinia, Axios, and Vue Router.
- Axios uses `/api`; the Vite proxy strips `/api` before forwarding to the
  backend on port 8080.
- The existing receipt upload posts multipart field `file` to
  `/receipt/upload`. The bill upload should use the same mechanism.
- Existing API money values are not represented consistently across all DTOs.
  The bill contract below uses decimal strings to preserve `NUMERIC(12,4)`
  precision across JSON and JavaScript.

## 3. Required data model

The effective schema after V6 and the V7 currency retrofit is:

```sql
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    merchant_name TEXT,
    total_amount NUMERIC(12,4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'MYR',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC(12,4) NOT NULL,
    line_total NUMERIC(12,4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bills_owner_user_id ON bills(owner_user_id);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
```

Design decisions:

- `owner_user_id` deliberately has no cascading delete behavior because the
  prompt does not authorize changing user-deletion semantics.
- `bill_items.bill_id` cascades exactly as required.
- `quantity` is `NUMERIC` and maps to `BigDecimal`; it must not inherit the
  current OCR model's integer limitation at the database boundary.
- Money is always `NUMERIC(12,4)`/`BigDecimal`.
- Do not add a restrictive status check yet. Only `draft` exists in Phase 1,
  while later phases will define valid lifecycle transitions.
- Application code sets `updated_at` when updates are eventually introduced.
  No trigger is needed for this create-only phase.

## 4. Backend module and responsibilities

Create a top-level `com.duit.bill` package. `bill` is preferable to placing the
feature under `receipt`, because receipt extraction is an ingestion capability
while a bill is an independently owned domain aggregate. It is also clearer than
`billing`, which often means subscriptions or invoicing.

Keep the module small:

- `Bill.kt`: R2DBC `Bill` and `BillItem` entities.
- `BillRepository.kt`: `CoroutineCrudRepository<Bill, UUID>`.
- `BillItemRepository.kt`: `CoroutineCrudRepository<BillItem, UUID>`.
- `BillDtos.kt`: response DTOs and exact decimal serialization contract.
- `ReceiptToBillMapper.kt`: pure mapping and consistency validation.
- `BillService.kt`: OCR orchestration and transactional persistence.
- `BillController.kt`: authenticated multipart endpoint.

The mapper should remain pure: it receives `ParsedReceipt` and returns an
unpersisted bill aggregate. It must not call repositories or external services.

## 5. OCR-to-bill mapping and validation

Mapping:

| Parsed receipt field | Bill field |
| --- | --- |
| `merchant` | `merchantName` |
| `total` | `totalAmount` |
| `lineItems[].description` | `items[].name` |
| `lineItems[].qty` | `items[].quantity` |
| `lineItems[].unitPrice` | `items[].unitPrice` |
| `lineItems[].lineTotal` | `items[].lineTotal` |

Normalize all money fields to scale 4 with `RoundingMode.HALF_UP` before
persistence. Convert `qty` to `BigDecimal` without inventing a different value.

Reject the OCR result with a domain error before persistence when:

- There are no line items.
- A quantity is not positive.
- A unit price or line total is negative.
- `abs(quantity * unitPrice - lineTotal) > 0.01`.
- The total is negative.

The tolerance handles receipt rounding without silently rewriting OCR output.
The mapper must not derive a missing quantity or overwrite a mismatched line
total. Such correction is a parser/user-review concern outside this phase.

Known gap: although the current output structurally separates quantity, unit
price, and line total, Gemini infers them from OCR text and no current code
validates their arithmetic. Also, `ParsedReceipt.qty` is an `Int`, so fractional
receipt quantities cannot currently be represented. Phase 1 should preserve the
database's decimal quantity support but must not broaden the OCR parser model
without real receipt evidence requiring it.

## 6. Persistence transaction

`BillService.createFromReceipt` should be a suspending `@Transactional` method:

1. Call `ExpenseOcrService.parse(imageBytes)`.
2. Map and validate the `ParsedReceipt`.
3. Save the owner-scoped `Bill`.
4. Save every `BillItem` with the persisted bill ID using the coroutine
   repository/`Flow` API.
5. Return a DTO built from the persisted rows.

The bill and all items form one aggregate and must commit atomically. Any item
failure must roll back the bill insert. Postgres remains the source of truth;
the response must be based on persisted IDs and values.

Do not create a `receipt_extractions` row in this flow unless product
requirements later explicitly say a split receipt must also appear in the
passive transaction inbox. Reusing OCR parsing does not imply duplicating the
transaction-capture workflow.

## 7. API contract

Backend route:

```text
POST /bills/from-receipt
Content-Type: multipart/form-data
Authorization: Bearer <token>
field: file
```

Frontend development URL:

```text
POST /api/bills/from-receipt
```

The backend route intentionally omits `/api` because the existing Vite proxy
owns that prefix and strips it.

Success: `201 Created`

```json
{
  "data": {
    "id": "uuid",
    "ownerUserId": "uuid",
    "merchantName": "Example Merchant",
    "totalAmount": "42.5000",
    "status": "draft",
    "createdAt": "2026-07-04T00:00:00Z",
    "updatedAt": "2026-07-04T00:00:00Z",
    "items": [
      {
        "id": "uuid",
        "billId": "uuid",
        "name": "Nasi Lemak",
        "quantity": "2",
        "unitPrice": "10.0000",
        "lineTotal": "20.0000",
        "createdAt": "2026-07-04T00:00:00Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-04T00:00:00Z",
    "requestId": "uuid"
  }
}
```

Errors:

- `400` for an absent/unsupported file or upload validation failure.
- `401` from the existing security chain for an unauthenticated request.
- `422` for OCR failure, empty parsed items, or arithmetic inconsistency.
- `500` for unexpected persistence failures, logged server-side without
  exposing credentials or raw provider responses.

Apply the existing 20 MB multipart memory limit unless a separate upload-limit
requirement is introduced. Do not log receipt image bytes or full raw OCR text.

## 8. Frontend checkpoint

Add:

- Shared `Bill` and `BillItem` interfaces in `src/types/index.ts`, matching the
  Kotlin response exactly and representing decimals as strings.
- `src/stores/bill.ts` with `uploading`, `bill`, `error`, and
  `createFromReceipt(file)`.
- `src/views/SplitBillView.vue` containing a file input/upload action and a
  simple semantic table for the returned items.
- A protected `/split-bill` route.

The Pinia store is only a cache of the server response. It does not generate IDs,
recalculate persisted totals, or become an independent source of truth.

Pre-existing contract drift must be handled separately or in the same carefully
reviewed implementation change: `src/types/index.ts` currently models receipt
fields as `merchantName` and omits `lineTotal`, while the backend returns
`merchant` and includes `lineTotal`. New bill code must not copy that mismatch.

## 9. Verification strategy

### Migration

1. Start a fresh database using the project's TimescaleDB Compose image.
2. Start the backend so Flyway applies V1-V7.
3. Verify both tables, foreign keys, `NUMERIC(12,4)` columns, defaults, and
   indexes.
4. Insert a bill/item in a rollback-safe test and verify deleting the bill
   cascades to its items.

The generic PostgreSQL Testcontainers dependency may not satisfy the existing
TimescaleDB/pgvector V1 migration. Use an integration image containing those
extensions or test against the project's fresh Compose database.

### Backend tests

- Mapper unit tests for valid mapping, scale normalization, empty items,
  negative values, and values outside/inside the `0.01` tolerance.
- Service transaction test proving item failure rolls back the bill.
- Controller test proving auth ownership, multipart field handling, `201`, and
  the response envelope.
- Blocking-boundary test/inspection proving Google Vision runs off the event
  loop and R2DBC/WebClient operations are not moved to a blocking scheduler.

### Real receipt acceptance

Use at least three non-sensitive receipt fixtures with different layouts:

1. Single-quantity item lines.
2. Explicit multi-quantity lines.
3. A receipt containing discounts/service charge/tax.

For every returned item, assert:

```text
abs(quantity * unitPrice - lineTotal) <= 0.01
```

Also verify merchant name, receipt total, and a non-empty item list against the
visible receipt. Provider-backed acceptance requires valid Google Vision and
Gemini credentials and should not run as an ordinary offline unit test.

### Frontend

- `vue-tsc` and Vite build pass.
- Store test verifies multipart field name `file` and response unwrapping.
- View test verifies the returned merchant, total, and every item row.
- Manual authenticated upload verifies the full frontend-to-backend path.

Prompt 1b established both quality gates:

- `tsconfig.node.json` is an independent composite project rather than extending
  the application config that references it. `npm run build` now passes.
- `./gradlew test` starts the project-compatible TimescaleDB image through
  Testcontainers, dynamically configures Flyway and R2DBC, verifies migration
  version 7, and cleans up automatically.

## 10. Definition of done

- [ ] V6 and V7 apply after V1-V5 on a fresh project-compatible database.
- [ ] Only `bills` and `bill_items` are introduced.
- [ ] All request-path persistence is R2DBC/coroutine-reactive.
- [ ] The blocking Vision client is explicitly isolated from Netty event loops.
- [ ] A mapper validates rather than guesses inconsistent OCR item values.
- [ ] Bill and items persist atomically for the authenticated owner.
- [ ] Multipart upload returns a persisted bill with non-empty items.
- [ ] Kotlin and TypeScript bill contracts match field-for-field.
- [ ] The minimal Vue view renders the returned bill and item table.
- [ ] Three varied real receipts pass the arithmetic and visible-value checks.
- [ ] No Phase 2-5 tables, endpoints, events, or UI are added.
