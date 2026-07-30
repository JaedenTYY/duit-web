#!/usr/bin/env bash
set -euo pipefail

input="${1:?CycloneDX JSON input is required}"
output="${2:?CSV output path is required}"

mkdir -p "$(dirname "$output")"
jq -r '
  ["component","version","purl","licenses"],
  (.components[]? | [
    .name,
    (.version // ""),
    (.purl // ""),
    ((.licenses // []) | map(.license.id // .license.name // .expression) | join(" OR "))
  ])
  | @csv
' "$input" > "$output"
