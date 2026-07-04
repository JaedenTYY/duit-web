# Engineering Skills and Working Guide

This document records the project-specific capabilities and checks needed to
implement Split Bill Phase 1 safely. It is not a Codex skill package; project
instructions remain in `AGENTS.md`, and the functional contract is in
`SPECS.md`.

## 1. Kotlin coroutine and WebFlux design

Required capability:

- Write suspending controllers/services and `Flow`-based reads.
- Understand that Kotlin coroutine adapters preserve reactive behavior only
  when the underlying operation is non-blocking.
- Identify blocking SDKs and isolate only those calls from Netty event loops.

Phase 1 application:

- Follow the existing `suspend`/`CoroutineCrudRepository` style.
- Keep Google Vision's synchronous client on an explicit blocking scheduler.
- Keep R2DBC and WebClient calls on their normal reactive execution path.
- Never call `block()`, `Thread.sleep`, blocking JDBC, or JPA in the request
  pipeline.

Review evidence:

```bash
rg -n 'block\\(|Thread\\.sleep|JdbcTemplate|JpaRepository' \
  ../duit-api/src/main/kotlin
```

The search is a guard, not proof by itself; dependency and call-chain review is
still required.

## 2. R2DBC aggregate persistence

Required capability:

- Map Kotlin entities with Spring Data relational annotations.
- Use `BigDecimal` for quantity and money.
- Apply a reactive transaction across a parent insert and child inserts.
- Understand generated UUID handling and verify persisted IDs.

Phase 1 application:

- Save `Bill`, obtain its ID, then save `BillItem` rows.
- Keep both operations inside one suspending `@Transactional` service method.
- Add an integration test that forces a child insert failure and confirms the
  parent is rolled back.

## 3. PostgreSQL and Flyway migrations

Required capability:

- Write forward-only, deterministic Flyway SQL.
- Preserve exact decimal types and foreign-key behavior.
- Validate against TimescaleDB/pgvector-compatible PostgreSQL because earlier
  migrations create both extensions.

Phase 1 application:

- Use `V6__create_bills.sql` plus the Phase 1 currency retrofit
  `V7__add_currency_to_bills.sql`.
- Use `NUMERIC(12,4)` for monetary fields and `NUMERIC` for quantity.
- Index owner and parent foreign-key lookup columns.
- Verify `ON DELETE CASCADE` only from `bill_items` to `bills`.

Useful checks after migration:

```sql
\d+ bills
\d+ bill_items
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

## 4. OCR adapter and financial invariants

Required capability:

- Treat provider output as untrusted structured input.
- Distinguish mapping from parsing and persistence.
- Compare decimal arithmetic with an explicit tolerance.

Phase 1 application:

- Reuse `ExpenseOcrService`; do not duplicate Google Vision or Gemini calls.
- Map the receipt package's `LineItem` in a pure adapter.
- Preserve provider values and reject material inconsistencies instead of
  silently repairing them.
- Test `quantity * unitPrice` against `lineTotal` using `BigDecimal`, never
  `Double`.

## 5. API boundary and security

Required capability:

- Build authenticated WebFlux multipart endpoints.
- Derive ownership from the validated JWT principal, never from a client field.
- Keep Kotlin and TypeScript DTOs synchronized manually.
- Preserve decimal precision through JSON.

Phase 1 application:

- Accept multipart field `file`.
- Return `201 Created` with the existing `ApiResponse` envelope.
- Return money and decimal quantity as strings in API DTOs.
- Do not accept `ownerUserId`, status, or item IDs from the frontend.
- Avoid logging receipt bytes, OCR content, tokens, or provider credentials.

## 6. Vue 3, Pinia, and TypeScript

Required capability:

- Use Composition API and strongly typed store state/actions.
- Submit `FormData` through the shared Axios client.
- Model the server as source of truth.
- Render accessible tabular data without introducing speculative UI state.

Phase 1 application:

- Keep one bill store and one functional view.
- Store the server response directly after upload.
- Use shared `Bill`/`BillItem` interfaces; do not use `any`.
- Render exact server values and avoid client-side persistence assumptions.

Build gate:

```bash
npm run build
```

The TS6310 project-reference cycle was removed in Prompt 1b, so this command is
now an effective feature-specific type gate.

## 7. Testing and verification

Required capability:

- Separate pure unit tests, database integration tests, WebFlux slice tests, and
  credential-dependent OCR acceptance tests.
- Test transaction rollback and authenticated ownership, not only happy paths.
- Use varied real-world receipt formats for OCR claims.

Minimum Phase 1 evidence:

- Mapper unit tests cover every validation rule.
- Migration succeeds on a clean compatible database.
- Repository/service integration test proves atomicity.
- Endpoint test verifies multipart upload and response contract.
- Three real receipt checks demonstrate arithmetic consistency.
- Frontend build and view/store tests pass.

The `@SpringBootTest` now inherits the shared Testcontainers foundation. With
Docker 25+ running, `./gradlew test` provisions the compatible database, applies
Flyway through V7, and cleans up without manual PostgreSQL setup.

## 8. Scope discipline

Do not add:

- `bill_participants`
- `bill_item_claims`
- `bill_payments`
- share tokens or public routes
- SSE, WebSockets, or Redis bill events
- DuitNow QR behavior
- payment status/reconciliation behavior

Those features require separate concurrency, authorization, privacy, and
life-cycle decisions in later phases.
