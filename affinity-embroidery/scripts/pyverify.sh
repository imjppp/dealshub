#!/usr/bin/env bash
# Dev-only: verify JS writers against pyembroidery. Needs `pip install pyembroidery` (or PYLIB=<dir> pointing at a --target install).
set -e
cd "$(dirname "$0")/.."
OUT=${1:-test-output/fixtures}
node scripts/dump-fixtures.mjs "$OUT" >/dev/null
PYTHONPATH="${PYLIB:-}" python3 scripts/verify_pyembroidery.py "$OUT" --json "$OUT/verify-report.json"
