#!/usr/bin/env bash
# scripts/write-version.sh
set -eu

# timestamp UTC ISO
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
# Netlify fournit COMMIT_REF dans l'environnement de build
COMMIT="${COMMIT_REF:-local}"

# écriture atomique dans version.json
cat > version.json <<EOF
{"ts":"${TS}","commit":"${COMMIT}"}
EOF
