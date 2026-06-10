#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning build artifacts..."
pnpm turbo clean
rm -rf apps/*/.next apps/*/out
rm -rf packages/*/dist
rm -rf node_modules/.cache
rm -rf .turbo
echo "Done."
