#!/usr/bin/env bash
set -euo pipefail

echo "=== Universal MCP Gateway Setup ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "  [FAIL] $1 is not installed"
    return 1
  fi
  echo "  [OK]   $1 $(eval "$1 --version 2>&1 | head -1")"
}

check_command node
check_command pnpm

# Copy env file
if [ ! -f ".env" ]; then
  echo ""
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "  [OK] .env created. Edit it with your configuration."
else
  echo "  [SKIP] .env already exists"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Run ./scripts/dev.sh to start development"
echo "  3. Open http://localhost:3000"
