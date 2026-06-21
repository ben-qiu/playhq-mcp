# Installs playhq-mcp on Windows (PowerShell 5.1+).
param(
    [switch]$SmokeTest
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

function Require-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "$Name is required but not found."
    }
}

Require-Command node

$NodeMajor = [int](node -p "Number(process.versions.node.split('.')[0])")
if ($NodeMajor -lt 20) {
    Write-Error "Node.js 20+ is required (found $(node -v))."
}

function Install-Dependencies {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install
        return
    }

    if (Get-Command corepack -ErrorAction SilentlyContinue) {
        Write-Host 'Enabling pnpm via corepack...'
        corepack enable
        corepack prepare pnpm@10.33.4 --activate
        pnpm install
        return
    }

    Write-Host 'pnpm not found — falling back to npm install'
    Require-Command npm
    npm install
}

Write-Host "==> Installing playhq-mcp in $Root"
Install-Dependencies

$McpConfig = Join-Path $Root '.cursor\mcp.json'
$McpExample = Join-Path $Root '.cursor\mcp.json.windows.example'
if (-not (Test-Path $McpConfig)) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Root '.cursor') | Out-Null
    Copy-Item $McpExample $McpConfig
    Write-Host '==> Created .cursor\mcp.json from .cursor\mcp.json.windows.example'
} else {
    Write-Host '==> .cursor\mcp.json already exists — left unchanged'
}

if ($SmokeTest) {
    Write-Host '==> Running smoke test...'
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm run smoke-test
    } else {
        npm run smoke-test
    }
}

$DistPath = Join-Path $Root 'dist\mcp.cjs'
$DistPathForward = $DistPath -replace '\\', '/'

Write-Host @"

Done.

Cursor: open this folder and reload MCP (Settings → Tools & MCP).
  Config: .cursor\mcp.json

Claude Desktop: edit
  $env:APPDATA\Claude\claude_desktop_config.json

Use this in Claude config:
  "command": "node",
  "args": ["$DistPathForward"]

Antigravity CLI (project): create .agents\mcp_config.json in this repo
Antigravity CLI (global): $env:USERPROFILE\.gemini\config\mcp_config.json

Use this in Antigravity MCP config:
  "command": "node",
  "args": ["$DistPathForward"],
  "cwd": "$($Root -replace '\\', '/')"

Migrating from Gemini CLI? Run: agy plugin import gemini

See README.md for full setup details.
"@
