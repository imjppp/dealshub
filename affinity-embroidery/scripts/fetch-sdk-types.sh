#!/usr/bin/env bash
# Downloads Affinity's type declarations into types/ (not committed: it is Affinity's file).
set -e
cd "$(dirname "$0")/.."
mkdir -p types
curl -fsS -o types/affinity.d.ts https://sdk.affinity.studio/3.3.3/affinity.d.ts
echo "downloaded types/affinity.d.ts ($(wc -l < types/affinity.d.ts) lines)"
