# Frontend dependency-security baseline

Baseline commit: `fb97728a7e1d2eba9a63bba68c37f88aae897866`

Scan date: 2026-07-29 using npm 10.9.8's advisory service. Raw audit JSON
remains temporary build evidence and is not committed.

## Initial and final counts

| Scope | Critical | High | Moderate | Low | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial complete lockfile | 11 | 30 | 3 | 0 | 44 |
| Initial production-only lockfile | 0 | 1 | 0 | 0 | 1 |
| Final complete lockfile | 0 | 0 | 0 | 0 | 0 |
| Final production-only lockfile | 0 | 0 | 0 | 0 | 0 |

The production finding was PostCSS `GHSA-r28c-9q8g-f849`. The remainder were
build, test, lint, or API-generation paths; they were still remediated because
those packages execute code in developer and CI environments.

## Advisory disposition

| Advisory | Affected path | Disposition |
| --- | --- | --- |
| `GHSA-h526-wf6g-67jv` | Orval core code generation | Upgraded Orval 6.31.0 to 8.23.0 |
| `GHSA-f456-rf33-4626` | Orval mock generator | Upgraded Orval; mock generator is not used |
| `GHSA-5xrq-8626-4rwp` | Vitest | Upgraded Vitest 1.6.1 to 4.1.10 |
| `GHSA-r28c-9q8g-f849` | PostCSS production dependency | Upgraded PostCSS 8.5.16 to 8.5.24 |
| `GHSA-fx2h-pf6j-xcff` | Vite chain | Kept supported Vite 8 and refreshed to 8.1.5 |
| `GHSA-4w7w-66w2-5vf9`, `GHSA-v6wh-96g9-6wx3` | Historical Vite transitive paths | Removed by lock refresh |
| `GHSA-67mh-4wv8-2f99` | esbuild | Removed by current Vite/Orval graph |
| `GHSA-r5fr-rjxr-66jc`, `GHSA-f23m-r3pf-42rh` | lodash through API tooling | Removed by Orval 8 graph |
| `GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg` | brace-expansion through lint/test tools | Removed through ESLint 10 and narrow test-utils overrides |
| `GHSA-v2hh-gcrm-f6hx` | fast-uri in validation tooling | Refreshed to fixed transitive release |
| `GHSA-r292-9mhp-454m` | tar in developer tooling | Refreshed to fixed transitive release |

The latest `@vue/test-utils` still requests `js-beautify` with older `glob` and
`editorconfig` ranges. The package-level override selects maintained
`glob 13.0.6` and `editorconfig 3.0.2`, both compatible with Node 22 and
verified by all 43 component tests. This override is reviewable in
`package.json`; it is not an advisory suppression.

## Direct changes

| Component | Before | After | Migration evidence |
| --- | --- | --- | --- |
| Node/npm | CI Node 20.x, unspecified npm | Node 22.23.0, npm 10.9.8 | `.nvmrc`, `.node-version`, engines, packageManager, CI assertions |
| Orval | 6.31.0 | 8.23.0 | Explicit Axios mode, valid bearer scheme, regenerated client |
| Vitest | 1.6.1 | 4.1.10 | Existing 43 tests pass |
| ESLint | 8.57.1 | 10.8.0 | Flat config migration; existing lint contract retained |
| TypeScript ESLint config | 13.0.0 | 14.9.0 | Flat Vue/TypeScript configuration |
| vue-tsc | 2.2.12 | 3.3.8 | Type checking passes |
| PostCSS | 8.5.16 | 8.5.24 | Production advisory removed |
| PrimeVue themes | deprecated `@primevue/themes` | `@primeuix/themes` 2.0.3 | PrimeVue 4-compatible maintained package |
| Capacitor | 8.4.1 | 8.4.2 | Patch maintenance |
| Playwright | 1.61.1 | 1.62.0 | Browser smoke tests pass |

No unresolved npm advisory or audit exception remains.
