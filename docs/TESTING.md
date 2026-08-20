# Test Quality Guide

Duit's frontend tests are intended to make green builds trustworthy, especially around generated API contracts, Pinia store behavior, and browser journeys.

## Suite Boundaries

- `npm run verify:api-contract` checks that the checked-in OpenAPI contract and provenance match the backend contract source.
- `npm run lint` enforces static code and architecture rules.
- `npm run type-check` keeps Vue and generated API model usage type-safe.
- `npm run test` runs Vitest unit, component, store, transport, API contract, and architecture tests.
- `npm run test:e2e` runs Playwright browser integration tests against mocked API responses. These are browser-level mocked-API journeys, not full backend E2E tests.

Use the repository-pinned Node/npm versions from the project configuration for final local verification. CI remains authoritative when local tooling is outside that range.

## Unexpected Error Policy

Vitest installs `src/test/consoleErrorGuard.ts`, which fails a test if `console.error` is called unexpectedly. Tests that intentionally exercise an error path should declare the expected error with `allowExpectedConsoleError(...)` instead of globally suppressing errors.

The goal is not to ban all warnings. It is to prevent production-like failures, hidden promise errors, or incomplete mocks from passing unnoticed.

## Generated API Fixtures

Store and component tests should mock generated Orval operations, not raw Axios. Fixtures should use generated model types where they represent API transport objects. Handwritten types are appropriate for form state and deliberate UI view models only.

Authoritative money mutation fields such as `amount` and `fxRate` must remain decimal strings in generated request types.

## Browser Integration Tests

Playwright tests should prefer roles, labels, and stable text over CSS selectors. Avoid arbitrary sleeps; wait for visible user-observable state or request effects instead.

Current high-value mocked-API journeys cover:

- login/session behavior;
- privacy lifecycle actions;
- receipt review and confirmation;
- owner/guest bill split lifecycle;
- statement import row selection.

Keep browser coverage small and focused. Backend arithmetic, provider correctness, and concurrency behavior belong in lower-level or integration tests.

## Disabled-Test Policy

Critical frontend tests must not be disabled with `describe.skip`, `it.skip`, or `test.skip`. The architecture spec scans first-party source and Playwright specs for those patterns.
