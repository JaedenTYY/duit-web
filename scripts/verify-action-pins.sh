#!/usr/bin/env bash
set -euo pipefail

violations="$(
  grep -RhoE '^[[:space:]]*uses:[[:space:]]*[^[:space:]#]+' .github/workflows \
    | awk '{print $2}' \
    | grep -Ev '^(\./|docker://[^@]+@sha256:[0-9a-f]{64}$|[^@]+@[0-9a-f]{40}$)' \
    || true
)"

if [[ -n "$violations" ]]; then
  echo "GitHub Actions must be pinned to a full commit SHA:" >&2
  echo "$violations" >&2
  exit 1
fi
