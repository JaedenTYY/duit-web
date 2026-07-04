# Release Notes

## 2026-07-04 — Split Bill Phase 1

This release establishes the complete authenticated receipt-to-bill path across
`duit-api` and `duit-web`.

### Added

- `V6__create_bills.sql` with `bills` and `bill_items`.
- `V7__add_currency_to_bills.sql`, matching the existing transaction currency
  definition: `CHAR(3) NOT NULL DEFAULT 'MYR'`.
- Pure `ReceiptToBillMapper` with monetary normalization, line-item arithmetic
  validation, merchant normalization, and supported-currency validation.
- Coroutine R2DBC repositories for bills and bill items.
- Transactional bill persistence that atomically saves a bill and all items.
- Authenticated multipart `POST /bills/from-receipt` backend endpoint, exposed
  to the frontend as `POST /api/bills/from-receipt`.
- Typed bill upload, OCR, and receipt-validation failures.
- Pinia bill store, shared TypeScript bill contracts, `/split-bill` route, and a
  minimal upload/results view.
- Testcontainers-backed TimescaleDB/pgvector integration-test foundation.

### Changed

- Moved the synchronous Google Vision SDK call onto Reactor
  `Schedulers.boundedElastic()`.
- Removed the circular frontend TypeScript project reference that caused
  TS6310.
- Reconciled frontend receipt types with the authoritative Kotlin
  `ParsedReceipt` response.
- Reused the existing frontend currency formatter for bill totals, unit prices,
  and line totals.
- Kept OCR and mapping outside the database transaction so external network
  calls do not hold an R2DBC connection.

### Verification

- `./gradlew test` passes against an automatically managed
  `timescale/timescaledb-ha:pg16.13-ts2.26.4` container.
- Flyway applies migrations through V7.
- Mapper tests cover multi-item, one-item, malformed-item, normalized currency,
  default currency, and unsupported-currency behavior.
- Integration tests verify persistence, nested API output, typed failures, and
  rollback when a child insert fails after an earlier insert succeeds.
- `npm run build` passes.
- The new bill request path contains no blocking calls outside the explicitly
  isolated Google Vision boundary.

### Manual acceptance remaining

A credential-backed receipt upload through `/split-bill` must still be run by
Jaeden to confirm Google Vision/Gemini output and browser-rendered currency
against a real receipt.

### Deliberately excluded

- Anonymous share links and QR sharing
- Guest participants and item claiming
- SSE/Redis live bill updates
- DuitNow QR display
- Payment marking and reconciliation

These remain Phase 2–5 work.
