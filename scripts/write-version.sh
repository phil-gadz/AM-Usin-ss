#!/usr/bin/env bash
# scripts/write-version.sh
# écrit version.json contenant ts (UTC iso) et commit ref
set -e
mkdir -p .netlify_build_meta
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# COMMIT_REF est fourni par Netlify lors du build
COM="${COMMIT_REF:-local}"
echo "{\"ts\":\"${TS}\",\"commit\":\"${COM}\"}" > version.json
# Optionnel : garder une copie dans .netlify_build_meta pour debug
echo "{\"ts\":\"${TS}\",\"commit\":\"${COM}\"}" > .netlify_build_meta/version.json
