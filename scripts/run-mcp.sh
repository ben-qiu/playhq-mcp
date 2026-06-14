#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Prefer an explicit Node binary; fall back to PATH.
NODE="${PLAYHQ_NODE:-node}"

exec "$NODE" "$ROOT/dist/mcp.cjs"
