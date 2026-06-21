#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RUN_SMOKE_TEST=0
for arg in "$@"; do
  case "$arg" in
    --smoke-test) RUN_SMOKE_TEST=1 ;;
    -h | --help)
      echo "Usage: $0 [--smoke-test]"
      echo "  Installs dependencies, builds dist/mcp.cjs, and creates .cursor/mcp.json and .agents/mcp_config.json if missing."
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: $1 is required but not found." >&2
    exit 1
  fi
}

need_cmd node

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if (( NODE_MAJOR < 20 )); then
  echo "Error: Node.js 20+ is required (found $(node -v))." >&2
  exit 1
fi

install_deps() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    echo "Enabling pnpm via corepack..."
    corepack enable
    corepack prepare pnpm@10.33.4 --activate
    pnpm install
    return
  fi

  echo "pnpm not found — falling back to npm install"
  need_cmd npm
  npm install
}

echo "==> Installing playhq-mcp in $ROOT"
install_deps

if [[ ! -f .cursor/mcp.json ]]; then
  mkdir -p .cursor
  cp .cursor/mcp.json.example .cursor/mcp.json
  echo "==> Created .cursor/mcp.json from .cursor/mcp.json.example"
else
  echo "==> .cursor/mcp.json already exists — left unchanged"
fi

node "$ROOT/scripts/setup-antigravity.mjs"

if (( RUN_SMOKE_TEST )); then
  echo "==> Running smoke test..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm run smoke-test
  else
    npm run smoke-test
  fi
fi

cat <<EOF

Done.

Cursor: open this folder and reload MCP (Settings → Tools & MCP).
  Config: .cursor/mcp.json

Claude Desktop (macOS): edit
  ~/Library/Application Support/Claude/claude_desktop_config.json

Claude Desktop (Linux): edit
  ~/.config/Claude/claude_desktop_config.json

Use this command in Claude config:
  "command": "/bin/bash",
  "args": ["$ROOT/scripts/run-mcp.sh"]

Or run directly:
  node "$ROOT/dist/mcp.cjs"

Antigravity CLI: start agy from this repo and run /mcp to verify.
  Config: .agents/mcp_config.json
  Re-run: ./scripts/setup-antigravity.sh [--force]
  Global: ./scripts/setup-antigravity.sh --global

Migrating from Gemini CLI? Run: agy plugin import gemini

See README.md for full setup details.
EOF
