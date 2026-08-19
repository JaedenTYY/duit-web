# Duit Web Architecture

The frontend is a Vue 3 modular application that treats backend state as the
source of truth. Pinia stores cache server state and reconcile it through the
HTTP/OpenAPI boundary.

The intended dependency direction is:

```text
views and components
  -> feature stores or composables
  -> generated API or approved feature API wrapper
  -> Orval mutator
  -> shared Axios transport
  -> HTTP
```

Components and views own presentation, form state, interaction, and emitted
events. They must not import raw Axios, the shared `api` transport, or direct
HTTP endpoint paths.

Feature stores and composables may call generated API functions. A thin feature
wrapper is allowed when it owns frontend-only behavior such as idempotency-key
lifetime, guest participant tokens, upload validation/progress, or local cache
reconciliation.

`src/lib/api.ts`, `src/lib/orvalMutator.ts`, `src/lib/authTransport.ts`, and
`src/lib/privacyTransport.ts` are the approved low-level transport files.
`authTransport` and `privacyTransport` exist because refresh, CSRF bootstrap,
privacy export, and Gmail disconnect have security/replay behavior that should
not be hidden inside feature components.

`src/api/generated/**` is generated from the backend OpenAPI contract and must
not be edited by hand. Generated code must not import stores, views, or
components.

Handwritten types are reserved for form state, UI view models, and presentation
state. API transport models already represented by the generated client should
derive from generated types or be used directly.

The backend remains authoritative for:

- monetary arithmetic and FX conversion;
- split-bill allocation and settlement state;
- transaction state transitions and optimistic concurrency;
- durable transaction idempotency;
- receipt, statement, and Gmail source identity.

Frontend financial helpers are for input validation and display only.
