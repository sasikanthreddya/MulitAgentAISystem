# Team Setup Guide

This project drives real systems (Jira, a browser, REST APIs, Twilio) through Claude Code subagents defined in `.claude/agents/`. MCP servers are project-scoped via [`.mcp.json`](.mcp.json) and load their own credentials from files in this repo — **no global Claude Desktop config, no OS environment variables, nothing to configure outside this folder.** Works identically whether it's opened by you, a teammate, in Claude Desktop, the Claude Code CLI, or a CI job.

## 1. Prerequisites (once per machine)

- **Node.js** (for `npx` — runs `@playwright/mcp`, `dkmaker-mcp-rest-api`, and the project's own env-loading wrapper script)
- **Python + [uv](https://docs.astral.sh/uv/getting-started/installation/)** (for `uvx` — runs `mcp-atlassian`): `pip install --user uv`, then make sure `uvx` is on `PATH`
- **Xray for Jira** installed on your Jira site, with its one-time per-project "Get Started" wizard (`.../plugins/servlet/ac/com.xpandit.plugins.xray/xray-get-started`) already run against whichever project you're testing. This provisions the `Test`/`Test Execution`/`Test Plan` issue types and the `Test` issue-link type. **UI-only, no REST API for it** — do this once per Jira project before running these agents against it.

## 2. Configure credentials (once per machine/checkout)

```
cp .env.example .env
cp .env.twilio.example .env.twilio
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `JIRA_URL` | Your Atlassian Cloud site, e.g. `https://yourcompany.atlassian.net` |
| `JIRA_USERNAME` | The Atlassian account email tied to your API token |
| `JIRA_API_TOKEN` | A **classic** (unscoped) token from https://id.atlassian.com/manage-profile/security/api-tokens — a scoped token missing `read:jira-work`/`write:jira-work` will silently return empty project lists |
| `REST_BASE_URL` | Base URL of whatever API-under-test a story targets (defaults to Restful-Booker) |

Fill in `.env.twilio`:

| Variable | Where to get it |
|---|---|
| `AUTH_BASIC_USERNAME` / `AUTH_BASIC_PASSWORD` | Twilio Console → Account → API keys & tokens (Account SID / Auth Token) |

That's it — **no shell exports, no `setx`, no restarting anything special.** `.mcp.json` points `mcp-atlassian` at `.env` via its own `--env-file` flag, and wraps the two `rest-api` servers with [`scripts/run-with-env.mjs`](scripts/run-with-env.mjs) (a small dependency-free Node script — `dotenv-cli` was tried first but is broken under `npx` on Windows, so this project rolled its own) pointed at `.env`/`.env.twilio` respectively. Each server loads its own file directly, independent of whatever process launched Claude Code.

## 3. Open the project

Open this folder (`E:\AgenticAITesting` or wherever it's cloned) as its own project/workspace in Claude Desktop, the Claude Code CLI, or VS Code. It auto-detects `.mcp.json` and prompts you to approve the 4 servers on first run: `mcp-atlassian`, `playwright`, `rest-api`, `rest-api-twilio`.

## 4. Run an agent

Test design and execution are two separate steps now — write the test cases once, then execute with whichever agent matches the story type:

1. **Write test cases** (once per story, or whenever acceptance criteria change): `use jira-test-case-writer on MCPTES-3`. Reads acceptance criteria from Jira, designs positive **and** negative cases, creates an Xray `Test` issue per case linked to the story, and writes `reports/<ISSUE-KEY>/test-cases.md`. Doesn't execute or touch any real system.
2. **Execute** with the agent matching the story type:
   - `use ui-playwright-jira-tester to test MCPTES-3` — UI story, drives a real browser
   - `use api-restful-jira-tester to test MCPTES-2` — API story, drives the REST endpoint under `REST_BASE_URL`
   - `use ivr-twilio-jira-tester to test MCPTES-5` — IVR story, places real Twilio calls (real charges/ringing — only invoke deliberately)

   Each executor discovers the Test issues already linked to the story (refuses to invent its own if none exist — run step 1 first), executes every case for real (no mocking, no retries except UI's 2x for browser flakiness), writes `reports/<ISSUE-KEY>/results.json`, and renders `target/extent-report/<ISSUE-KEY>/index.html` (an Extent-style HTML report with pass/fail and positive/negative charts). No Jira comment is posted and the Xray Testing Board is not touched — full evidence is in the chat response and the Extent report.

There's also a separate, independent Playwright Test suite (`tests/`, run via `npm test`) for fast repeatable regression without needing Jira at all — see [CLAUDE.md](CLAUDE.md) for when to use which.

## 5. Running headlessly (Jenkins / other CI)

Claude Code has a non-interactive CLI mode, so a pipeline stage can trigger an agent directly (assuming `jira-test-case-writer` has already been run once against the target story so there are Test issues to execute):

```bash
claude -p "use api-restful-jira-tester to test MCPTES-2"
```

For CI, **don't commit `.env`/`.env.twilio`** — instead inject `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`, `REST_BASE_URL`, `AUTH_BASIC_USERNAME`, `AUTH_BASIC_PASSWORD` as real environment variables from your CI credential store (e.g. Jenkins "Credentials" bound to env vars in the pipeline). `run-with-env.mjs` silently skips loading if the file doesn't exist, so the same `.mcp.json` works unmodified in CI with zero files present. Note the precedence is **file wins over inherited process env vars when both exist** (not the other way around) — this project's own machine hit a real incident where a stray OS-level `REST_BASE_URL` silently overrode `.env.twilio`'s value, so the loader was changed to make the checked-in file authoritative. In CI, since no `.env`/`.env.twilio` files are present at all, the injected env vars are simply all there is to load — this precedence only matters if you ever run with both a file and a conflicting env var present locally.

## 6. Committing

`reports/` is tracked in git (so the team sees test history). `.env` and `.env.twilio` are gitignored — never commit real credentials. If you add a new API target, just change `REST_BASE_URL` locally — no code changes needed.
