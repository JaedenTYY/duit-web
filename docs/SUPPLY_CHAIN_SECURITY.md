# Supply-chain security

## Threat model

The frontend installs executable build and test tooling as well as browser
runtime packages. Threats include a compromised npm maintainer, typosquatting,
lockfile or registry tampering, malicious code-generation plugins, mutable
GitHub Actions, vulnerable browser bundles, leaked workflow credentials, and
dependency licences that do not fit the intended distribution.

## Supported toolchain and lock policy

- Node 22.23.0 (LTS line)
- npm 10.9.8
- Vue 3, Vite 8.1.5, TypeScript 5.9, Orval 8.23.0
- Trivy 0.70.0 in CI
- npm CycloneDX SBOM support

`.nvmrc` and `.node-version` define the local runtime. `engines` documents the
supported Node 22/npm 10 ranges, while `packageManager` pins npm exactly. CI
asserts both exact versions and always runs `npm ci`; it never regenerates the
lockfile.

`package-lock.json` is the reviewed resolution authority. Change
`package.json`, resolve with npm 10.9.8, inspect the dependency paths and
integrity diff, run `npm ci` from a clean tree, then run all gates. Integrity
fields are never edited manually. Dynamic non-lockfile installs are not part of
CI.

Orval's `tags-split` output is committed for reviewed API-contract changes.
`output.clean` removes only `src/api/generated` before generation; handwritten
mutators remain in `src/lib`. A narrow post-generation script normalizes only
trailing whitespace in generated TypeScript files because Orval 8.23.0 emits a
variable blank footer for some tag controllers. CI runs generation twice under
Node 22.23.0 and npm 10.9.8 and requires both passes to leave the committed
output unchanged. This prevents stale controller files and
append-on-regeneration drift.

## Vulnerability policy

- Critical production findings block.
- High production findings block unless a specific exception identifies the
  advisory, exposure, compensating control, owner, review date, and expiry.
- Build/test findings are triaged because CI executes them.
- `npm audit fix --force` is prohibited.
- Trivy does not use `ignore-unfixed`; blanket ignores are prohibited.
- An approved scanner exception must be advisory-specific and time-bounded.

Both complete and production-only npm audits currently report zero. The
sanitised 44-to-zero baseline and every advisory disposition are in
`docs/security/dependency-baseline/README.md`.

## CI controls

All actions are pinned to full commit SHAs with reviewed release comments.
Workflow permissions default to `contents: read`; only CodeQL has
`security-events: write`. Pull requests receive no deployment secrets and none
of these workflows deploy.

Required jobs enforce lint, type checking, 43 Vitest tests, generated-client
reproducibility, production build, and Playwright. Separate jobs enforce npm
audits, CycloneDX/Trivy dependency scanning, repository secret/configuration
scanning, and CodeQL JavaScript/TypeScript analysis. Reports are retained for a
bounded period and enforced scan steps do not use `continue-on-error`.

## SBOM and licence reporting

```bash
npm run sbom:prod
npm run sbom:all
./scripts/summarize-sbom-licenses.sh \
  build/reports/sbom/duit-web-all.cdx.json \
  build/reports/security/all-dependency-licenses.csv
```

The first CycloneDX JSON contains production packages; the second separately
identifies the complete development graph. npm creates from the committed
lockfile, and Trivy parsing provides an independent consumption check. Generated
SBOMs and reports are CI artifacts, not source-controlled release files.

MIT, BSD, Apache-2.0, ISC, CC0, Unlicense, and similarly permissive licences are
normally allowed. MPL and other reciprocal terms require distribution review.
Unknown or custom terms require manual review; strong copyleft that imposes
incompatible distribution obligations is prohibited without explicit legal
review.

One package, GSAP 3.15.0, has custom “no charge” terms rather than SPDX metadata.
It is actively maintained and its publisher states that commercial use is
allowed, but its terms remain a manual licence-review item before a commercial
distribution. No scanner metadata is silently rewritten to call it MIT.

## Dependency automation and provenance

Dependabot checks npm, GitHub Actions, and Docker weekly against
`deploy-azure-production`. Compatible development-tool patches/minors may be
grouped; security and major migrations remain reviewable and must pass CI.
There is no auto-merge.

Maintainers review repository ownership, package maintenance, release cadence,
provenance/signing signals where available, unexpected maintainer changes, and
typosquatting risk. A lower advisory count alone is not a reason to adopt an
obscure replacement.

## Incident response

If a dependency is suspected compromised: stop release work, identify affected
commits from the lockfile/SBOM, revoke any credentials reachable by builds,
remove or pin away from the package, rebuild on a clean runner, rescan, and
record impact. Do not reuse build output produced before the trust decision.

## Release checklist

1. Node/npm exact versions and `npm ci` succeed without lockfile changes.
2. Complete and production npm audits pass.
3. Lint, type check, Vitest, generated client, build, and Playwright pass.
4. Both SBOMs generate, parse, and produce a licence report.
5. Filesystem and CodeQL jobs pass.
6. No `.env`, token, local report, test output, or native signing material is
   committed or uploaded.
7. Any exception is specific, owned, dated, and unexpired.

## Known limitations

- Advisory and licence databases can lag or be wrong.
- npm integrity proves bytes, not publisher trust.
- GSAP's custom licence needs manual review for the eventual distribution
  model.
- CodeQL upload depends on GitHub code-scanning availability; the workflow
  result is authoritative.
- Android/iOS native SDK builds require their platform toolchains and signing
  setup and are not provided by the web CI runner.
- No signed build provenance or SLSA attestation is produced in this phase.
