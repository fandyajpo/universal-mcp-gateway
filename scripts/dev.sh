#!/usr/bin/env bash
set -euo pipefail

echo "Starting development environment..."
echo ""

# Check node version
NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Error: Node.js >= 20 required. Current: $(node -v)"
  exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "Error: pnpm is not installed. Install with: npm install -g pnpm"
  exit 1
fi

# Install dependencies if needed
if [ ! -f "node_modules/.pnpm-lock-hash" ]; then
  echo "Installing dependencies..."
  pnpm install
  touch node_modules/.pnpm-lock-hash
fi

echo "Starting TurboRepo dev server..."
echo "  Web:    http://localhost:3000"
echo "  Admin:  http://localhost:3001"
echo "  Docs:   http://localhost:3002"
echo "  Landing: http://localhost:3003"
echo ""

pnpm dev
