# Writes Antigravity CLI MCP config for playhq-mcp (PowerShell 5.1+).
param(
    [switch]$Force,
    [switch]$Global
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$Args = @()
if ($Force) { $Args += '--force' }
if ($Global) { $Args += '--global' }

& node (Join-Path $Root 'scripts/setup-antigravity.mjs') @Args
