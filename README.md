# playhq-mcp

**Strictly for development use only.** Not for production, public services, or end users.

> **Disclaimer — read before use**
>
> This is **not** an official PlayHQ product or MCP server. PlayHQ has **not** reviewed, endorsed, or authorized this project. The GraphQL operations bundled here were **not** officially disclosed or approved for third-party use; they were assembled for **local development and experimentation only**.
>
> Do **not** use this in production, as a public API, or as if it were supported by PlayHQ. You are solely responsible for compliance with PlayHQ’s terms of service and for any requests made with your credentials.

Community-maintained MCP server that talks to PlayHQ GraphQL endpoints. Runs **locally on your machine** via stdio — it does not host a public endpoint.

## Development use only

**This project is for developers exploring PlayHQ APIs on their own machine.** It is not a supported integration, not a product, and not intended for anyone other than the person who cloned and configured it locally.

Intended for **personal, local development** with MCP clients (Cursor, Claude Desktop, Antigravity CLI, Gemini CLI). **Do not use for:**

- Production or user-facing services
- Publishing, scraping, or redistributing PlayHQ data
- Bots, automations, or workflows that affect other users
- Representing itself as an official PlayHQ integration
- Any use beyond debugging or prototyping on **your own** PlayHQ account

This server:

- Runs as a child process on your computer
- Sends requests to PlayHQ public GraphQL endpoints (no login required)
- Does **not** expose an HTTP server or accept inbound connections

Do not commit personal MCP config to git.

## Prerequisites

- Node.js 20+ ([nodejs.org](https://nodejs.org)) — add to PATH on Windows during install
- [pnpm](https://pnpm.io) (or adapt commands to npm)
- **macOS / Linux:** bash (included)
- **Windows:** use the `node` config below, or Git Bash if you prefer `run-mcp.sh`

## Setup

For **local development only**. Clone the repo first:

```bash
git clone https://github.com/ben-qiu/playhq-mcp.git
cd playhq-mcp
```

Then choose **one** of the following:

### Option A — install script (recommended)

Runs dependency install, builds `dist/mcp.cjs`, and creates `.cursor/mcp.json` if it does not exist yet.

| Platform | Command |
|----------|---------|
| macOS / Linux | `./scripts/install.sh` |
| Windows (PowerShell) | `.\scripts\install.ps1` |
| Windows (Command Prompt) | `scripts\install.cmd` |

Add a smoke test after install (optional):

| Platform | Command |
|----------|---------|
| macOS / Linux | `./scripts/install.sh --smoke-test` |
| Windows (PowerShell) | `.\scripts\install.ps1 -SmokeTest` |

The script creates `.cursor/mcp.json` and `.agents/mcp_config.json` if missing, and prints Claude Desktop config hints when it finishes.

### Option B — manual install

```bash
pnpm install              # builds dist/mcp.cjs via postinstall
pnpm run smoke-test       # optional — verify API connectivity
```

Then copy an MCP config example if you use Cursor:

```bash
# macOS / Linux / Git Bash
cp .cursor/mcp.json.example .cursor/mcp.json

# Windows (PowerShell)
copy .cursor\mcp.json.windows.example .cursor\mcp.json
```

Defaults (tenant, URLs, headers) live in `src/config.ts`. No `.env` file is required.

## Cursor

**Local dev setup only** — configure on your machine; do not commit `.cursor/mcp.json`.

1. Complete [Setup](#setup) (Option A creates `.cursor/mcp.json` for you).
2. If you used manual install, copy the example config:

   **macOS / Linux / Git Bash on Windows**

   ```bash
   cp .cursor/mcp.json.example .cursor/mcp.json
   ```

   **Windows (PowerShell or Command Prompt)**

   ```powershell
   copy .cursor\mcp.json.windows.example .cursor\mcp.json
   ```

   Or copy the macOS example if you use Git Bash.

3. Use the config for your platform (edit only if you need to override defaults — never commit this file):

   **macOS / Linux / Git Bash**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "/bin/bash",
         "args": ["${workspaceFolder}/scripts/run-mcp.sh"]
       }
     }
   }
   ```

   **Windows**

   Use `node` directly (simplest — requires Node.js on your PATH):

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "node",
         "args": ["${workspaceFolder}/dist/mcp.cjs"]
       }
     }
   }
   ```

   Or use the Windows launcher script:

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "cmd",
         "args": ["/c", "${workspaceFolder}\\scripts\\run-mcp.cmd"]
       }
     }
   }
   ```

   Example override for a different tenant (add inside the `playhq` object):

   ```json
   "env": { "PLAYHQ_TENANT": "your-tenant-slug" }
   ```

4. Open this folder in Cursor.
5. Reload MCP in **Settings → Tools & MCP**.

After code changes: `pnpm run build`, then reload MCP.

### Cursor troubleshooting

| Error | Fix |
|-------|-----|
| `Connection closed` | Do not use `pnpm run` as the MCP command — use `run-mcp.sh`, `run-mcp.cmd`, or `node dist/mcp.cjs` |
| Module / import errors | Run `pnpm run build` — MCP runs `dist/mcp.cjs` |
| `'bash' is not recognized` (Windows) | Use the Windows config above (`node` + `dist/mcp.cjs`) instead of `run-mcp.sh` |

## Claude Desktop

**Local dev setup only** — use an absolute path on your machine (Claude does not support `${workspaceFolder}`).

1. Complete [Setup](#setup) (Option A or Option B).
2. Edit Claude's MCP config:

   | Platform | Config file |
   |----------|-------------|
   | macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
   | Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

   **macOS / Linux**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "/bin/bash",
         "args": ["/absolute/path/to/playhq-mcp/scripts/run-mcp.sh"]
       }
     }
   }
   ```

   **Windows**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "node",
         "args": ["C:\\Users\\You\\path\\to\\playhq-mcp\\dist\\mcp.cjs"]
       }
     }
   }
   ```

   Use forward slashes if you prefer — Node accepts them on Windows: `"C:/Users/You/path/to/playhq-mcp/dist/mcp.cjs"`.

3. Fully quit Claude Desktop and reopen (macOS: Cmd+Q; Windows: exit from the system tray).
4. Check **Settings → Developer → MCP Logs** if the server fails to load.

## Gemini CLI

**Local dev setup only** — [Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) supports stdio MCP on your machine. (The Gemini web app does **not** support custom local MCP servers.) Google is transitioning Gemini CLI to [Antigravity CLI](#antigravity-cli); prefer Antigravity CLI for new setups.

1. Complete [Setup](#setup) (Option A or Option B).
2. Add the server to Gemini CLI — **one** of the following:

   **Option 1 — CLI command** (run from the repo root after [Setup](#setup)):

   ```bash
   gemini mcp add playhq node dist/mcp.cjs
   ```

   Or with an absolute path (works from any directory):

   ```bash
   gemini mcp add playhq node /absolute/path/to/playhq-mcp/dist/mcp.cjs
   ```

   **macOS / Linux** — alternatively via the shell launcher:

   ```bash
   gemini mcp add playhq /bin/bash /absolute/path/to/playhq-mcp/scripts/run-mcp.sh
   ```

   **Option 2 — edit `settings.json`**

   | Scope | Config file |
   |-------|-------------|
   | User-wide | `~/.gemini/settings.json` |
   | Project-only | `.gemini/settings.json` in this repo |

   **macOS / Linux**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "/bin/bash",
         "args": ["/absolute/path/to/playhq-mcp/scripts/run-mcp.sh"],
         "cwd": "/absolute/path/to/playhq-mcp"
       }
     }
   }
   ```

   **Windows**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "node",
         "args": ["C:/Users/You/path/to/playhq-mcp/dist/mcp.cjs"],
         "cwd": "C:/Users/You/path/to/playhq-mcp"
       }
     }
   }
   ```

   Use absolute paths. Override tenant if needed:

   ```json
   "env": { "PLAYHQ_TENANT": "your-tenant-slug" }
   ```

   To skip tool confirmation prompts during dev (use with care):

   ```json
   "trust": true
   ```

3. Restart Gemini CLI (or run `/mcp refresh` if available in your version).
4. List tools to verify: `gemini mcp list` or ask Gemini to use a PlayHQ tool (e.g. `list_organisations`).

After code changes: `pnpm run build`, then restart Gemini CLI or refresh MCP.

## Antigravity CLI

**Local dev setup only** — [Antigravity CLI](https://antigravity.google/docs/cli-using) (`agy`) supports stdio MCP on your machine. It is the successor to Gemini CLI; see [Migrating from Gemini CLI](https://antigravity.google/docs/gcli-migration) if you are upgrading.

1. Complete [Setup](#setup) (Option A creates `.agents/mcp_config.json` for you).
2. Add the server to Antigravity CLI — **one** of the following:

   **Option 1 — setup script (recommended)**

   Run from the repo root after [Setup](#setup):

   | Platform | Command |
   |----------|---------|
   | macOS / Linux | `./scripts/setup-antigravity.sh` |
   | Windows (PowerShell) | `.\scripts\setup-antigravity.ps1` |
   | Windows (Command Prompt) | `scripts\setup-antigravity.cmd` |
   | Any (via pnpm) | `pnpm run setup:antigravity` |

   This writes `.agents/mcp_config.json` with absolute paths for this machine. Use `--force` (or `-Force` on PowerShell) to update an existing file. Use `--global` (or `-Global`) to merge the `playhq` entry into `~/.gemini/config/mcp_config.json` instead.

   **Option 2 — manual project config**

   Create `.agents/mcp_config.json` in this repo (do not commit it — it contains machine-specific paths):

   **macOS / Linux**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "/bin/bash",
         "args": ["/absolute/path/to/playhq-mcp/scripts/run-mcp.sh"],
         "cwd": "/absolute/path/to/playhq-mcp"
       }
     }
   }
   ```

   **Windows**

   ```json
   {
     "mcpServers": {
       "playhq": {
         "command": "node",
         "args": ["C:/Users/You/path/to/playhq-mcp/dist/mcp.cjs"],
         "cwd": "C:/Users/You/path/to/playhq-mcp"
       }
     }
   }
   ```

   **Option 3 — manual global config**

   | Scope | Config file |
   |-------|-------------|
   | User-wide | `~/.gemini/config/mcp_config.json` |
   | Windows user-wide | `%USERPROFILE%\.gemini\config\mcp_config.json` |

   Use the same `playhq` entry as above inside `mcpServers`.

   **Migrating from Gemini CLI:** run `agy plugin import gemini` to convert extensions and MCP definitions, or move servers from `~/.gemini/settings.json` into `mcp_config.json` manually. Local stdio servers (`command` + `args`) need no schema changes; remote servers must use `serverUrl` instead of `url` or `httpUrl`.

   Override tenant if needed:

   ```json
   "env": { "PLAYHQ_TENANT": "your-tenant-slug" }
   ```

3. Start Antigravity CLI from this repo (for project config) or restart it after editing global config.
4. List tools to verify: run `/mcp` inside `agy`, or ask the agent to use a PlayHQ tool (e.g. `list_organisations`).

After code changes: `pnpm run build`, then restart Antigravity CLI.

### Antigravity CLI troubleshooting

| Error | Fix |
|-------|-----|
| Server not listed | Use `.agents/mcp_config.json` in the repo root, or `~/.gemini/config/mcp_config.json` globally — not `.antigravitycli/mcp_config.json` |
| Remote MCP fails silently | Rename `url` / `httpUrl` to `serverUrl` in `mcp_config.json` |
| Module / import errors | Run `pnpm run build` — MCP runs `dist/mcp.cjs` |

## Configuration

All defaults are in `src/config.ts`. Override only when needed via your MCP client `env` block:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PLAYHQ_GRAPHQL_URL` | `https://api.playhq.com/graphql` | Main API |
| `PLAYHQ_SEARCH_GRAPHQL_URL` | `https://search.playhq.com/graphql` | Search API |
| `PLAYHQ_TENANT` | `basketball-victoria` | Tenant header / slug |
| `PLAYHQ_ORIGIN` | `https://www.playhq.com` | Origin header |
| `PLAYHQ_USER_AGENT` | PlayHQ Android app UA | User-Agent header |
| `PLAYHQ_NODE` | `node` | Node binary for `run-mcp.sh` (optional) |

No auth token, session cookie, or `.env` file is required.

## Tools

These tools call **undocumented, unofficial** GraphQL operations. PlayHQ may change or block them at any time. **Development and debugging on your own account only** — not for production or bulk access.

| Tool | Description |
|------|-------------|
| `search_organisations` | Search clubs/associations |
| `profile_search` | Search profiles by full name |
| `get_profile` | Profile details, stats, milestones |
| `get_profile_teams` | Teams for a profile |
| `get_team` | Team details |
| `get_team_fixture` | Team fixture schedule |
| `get_form_guide_team_fixture` | Team form guide by round |
| `get_grade` | Grade metadata |
| `get_grade_fixtures` | Fixture rounds for a grade |
| `get_fixture_by_round` | Games and byes for a round |
| `get_grade_ladder` | Grade ladder |
| `get_game` | Game box score and player stats |
| `get_organisation` | Organisation details |
| `get_organisation_competitions` | Competitions and seasons |
| `get_season` | Season grades or club teams |
| `list_organisations` | Known org IDs (EDJBA, VJBL) |
| `get_outswing_version` | Tenant version config |

## Organisations

In PlayHQ, **`code` and `organisationID` are the same** 8-character hex ID.

| organisationId | Name |
|----------------|------|
| `0c8a84ea` | EDJBA |
| `08f42de2` | VJBL |

## Verify

```bash
pnpm run build
pnpm run smoke-test
```

Optional smoke-test overrides: `SMOKE_PROFILE_NAME`, `SMOKE_PROFILE_ID`.

## License

Non-commercial — see [LICENSE](LICENSE). Personal use on your own devices only; no commercial use and no redistribution. PlayHQ names and APIs are trademarks/service of their respective owners; this project is not affiliated with PlayHQ.
