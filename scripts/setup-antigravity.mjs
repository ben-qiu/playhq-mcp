#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const force = process.argv.includes('--force');
const globalScope = process.argv.includes('--global');

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(`Usage: node scripts/setup-antigravity.mjs [--force] [--global]

  Writes a playhq MCP server entry for Antigravity CLI.

  Default (project): .agents/mcp_config.json in this repo
  --global:          ~/.gemini/config/mcp_config.json (merges with existing servers)
  --force:           overwrite the playhq entry if the config file already exists

  Run from the repo root after install/build. Start agy in this repo, then /mcp to verify.
`);
  process.exit(0);
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function playhqEntry(root) {
  if (process.platform === 'win32') {
    const toForwardSlashes = (value) => value.replace(/\\/g, '/');
    return {
      command: 'node',
      args: [toForwardSlashes(path.join(root, 'dist', 'mcp.cjs'))],
      cwd: toForwardSlashes(root),
    };
  }

  return {
    command: '/bin/bash',
    args: [path.join(root, 'scripts', 'run-mcp.sh')],
    cwd: root,
  };
}

async function loadConfig(filePath) {
  if (!(await exists(filePath))) {
    return { mcpServers: {} };
  }

  try {
    const parsed = JSON.parse(await readFile(filePath, 'utf8'));
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
      return { ...parsed, mcpServers: {} };
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse ${filePath}: ${message}`);
  }
}

async function writeConfig(targetPath) {
  if ((await exists(targetPath)) && !force) {
    console.log(`==> ${targetPath} already exists — left unchanged (use --force to update playhq)`);
    return false;
  }

  const config = await loadConfig(targetPath);
  config.mcpServers.playhq = playhqEntry(ROOT);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`==> Wrote playhq MCP config to ${targetPath}`);
  return true;
}

async function main() {
  const distPath = path.join(ROOT, 'dist', 'mcp.cjs');
  if (!(await exists(distPath))) {
    console.error('Error: dist/mcp.cjs not found. Run pnpm install or pnpm run build first.');
    process.exit(1);
  }

  const targetPath = globalScope
    ? path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json')
    : path.join(ROOT, '.agents', 'mcp_config.json');

  await writeConfig(targetPath);

  if (globalScope) {
    console.log('\nAntigravity CLI: restart agy (or start a new session) and run /mcp to verify.');
  } else {
    console.log('\nAntigravity CLI: start agy from this repo and run /mcp to verify.');
    console.log(`  cd ${ROOT}`);
    console.log('  agy');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
