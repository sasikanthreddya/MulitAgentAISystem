# AgenticAITesting

Agentic QA automation project, with two complementary layers:

1. **Jira-driven agents** (`.claude/agents/`) — a **two-step** flow: a test-case-writer agent turns a story's acceptance criteria into an Xray `Test` issue matrix, then a platform-specific executor agent discovers and runs those Test issues for real, rendering an Extent-style HTML report. No scripts to maintain for this layer; the story is the source of truth.
2. **Scripted regression suite** (`tests/`, `playwright.config.js`) — a checked-in Playwright Test project (parallel workers, retries, stable locators) for repeatable local/CI runs, independent of Jira. See the "Scripted test suite" section below.

Both layers render results through the same generator (`reporters/render-report.mjs`), so an Extent report looks identical whether it came from a live agent run or `npm test`.

**Rule of thumb**: reach for the scripted suite (`npm test`) for fast, repeatable execution and reporting. Reach for the Jira agents only when a story needs fresh acceptance-criteria discovery, Xray traceability, or a one-time real-system validation — each LLM-reasoned step is a real round-trip, so this path is inherently slower by design, not by oversight. A case validated once via the agents is worth manually porting into `tests/` so future runs use the fast path instead of re-invoking the agents.

See [SETUP.md](SETUP.md) for how a new team member gets this running after cloning.

## Agents

Test design and test execution are deliberately separate agents/steps — a story's Test issues get authored once, then any of the three executors can discover and run them. This split exists because letting each executor independently design its own test cases caused them to drift on conventions (e.g. one executor's Xray Tests lacking the Positive/Negative tag another relied on) — one writer, one convention, three consumers.

- **jira-test-case-writer** — reads a story's acceptance criteria, designs positive + negative test cases, creates an Xray `Test` issue per case (linked to the story via the `Test` link type) with a structured description (`Type`/`Preconditions`/`Steps`/`Expected Result`), and writes `reports/<KEY>/test-cases.md`. Does not execute anything. Run this first for any story with no Test issues linked yet.
- **ui-playwright-jira-tester** — UI stories. Discovers the story's linked Test issues and drives a real browser via Playwright for each. Retries a failed case up to 2 more times before recording a final Fail (browser flakiness).
- **api-restful-jira-tester** — API stories. Discovers the story's linked Test issues and drives the live REST endpoint via the `rest-api` MCP. No retries — a failed real API call is reported failed on the first attempt.
- **ivr-twilio-jira-tester** — IVR story. Discovers the story's linked Test issues and places/verifies real Twilio calls via the dedicated `rest-api-twilio` MCP. No retries (retrying would place another real, charged call). Real charges/ringing — invoke deliberately.

The three executors refuse to invent test cases if none are linked yet — they'll tell you to run `jira-test-case-writer` first rather than silently reverting to the old one-shot behavior. Each executor: discovers linked Test issues → executes every case for real → writes `reports/<ISSUE-KEY>/results.json` and runs `node scripts/generate-agent-report.mjs reports/<ISSUE-KEY>/results.json <ISSUE-KEY>` to render `target/extent-report/<ISSUE-KEY>/index.html` (charts, positive/negative breakdown, embedded failure screenshots for UI). No Jira comment is posted, the Xray Testing Board is not touched, and no `report.md` is written — the harness blocks subagents from writing report/summary files, so full evidence goes in the agent's chat response plus the Extent report instead.

Invoke by name, e.g. "use jira-test-case-writer on MCPTES-3" then "use ui-playwright-jira-tester to test MCPTES-3".

## Scripted test suite

A separate, independent Playwright Test project for repeatable runs without needing Jira:

- `tests/ui/`, `tests/api/`, `tests/ivr/` — spec files, one Playwright project each (see `playwright.config.js`).
- Retries: only the `ui` project retries (2x, browser flakiness). `api` and `ivr` run once — retrying a real API/IVR call risks masking a real bug or (for IVR) doubling real Twilio charges.
- `npm test` runs `ui`+`api` in parallel; `npm run test:ivr` is separate and must be invoked explicitly (real calls/charges); `npm run test:all` runs everything.
- **Sanity vs. regression, per type**: a handful of the most business-critical/representative cases are tagged `@sanity` (one core positive case per feature area, plus the full checkout flow). `npm run ui:sanity` / `npm run api:sanity` run only those tagged cases — fast, for a quick pre-merge check. `npm run ui:regression` / `npm run api:regression` run everything in that project (sanity cases are a subset, not mutually exclusive). Top-level `npm run sanity` combines both sanity subsets; `npm run regression` is unchanged (alias for `npm run test:all`, everything including IVR — places a real Twilio call, don't run it casually). IVR isn't split into its own sanity/regression subset — it stays the single explicit `npm run test:ivr` given the real per-run cost.
- New tests: tag a case `{ tag: "@sanity" }` as the second argument to `test(...)` if it belongs in the fast subset; otherwise it's regression-only by default.
- `scripts/clean-target.mjs` wipes `target/` and `test-results/` before every run (via the `pretest` script) so a report never mixes stale results with the current run.
- Report output: `target/extent-report/index.html`, generated by the custom reporter `reporters/extent-reporter.mjs`, which shares its HTML/chart rendering with the agents' report generator via `reporters/render-report.mjs`.

## MCP servers

Defined in [`.mcp.json`](.mcp.json) at the project root (git-tracked). Each server loads its credentials from one single `.env` file — `mcp-atlassian` via its native `--env-file` flag, both REST servers via [`scripts/run-with-env.mjs`](scripts/run-with-env.mjs) — so nothing depends on which app launched Claude Code or what's in its process environment. See `.env.example`.

| Server | Purpose | Notes |
|---|---|---|
| `mcp-atlassian` | Read/write Jira issues, Xray Test issues, issue links | Jira Cloud; use a **classic** (unscoped) API token; reads `.env` |
| `playwright` | Drive a real browser for UI acceptance criteria (`ui-playwright-jira-tester` only) | `@playwright/mcp`, no credentials needed |
| `rest-api` | Generic HTTP client for whatever API a story targets | Reads `.env`'s `REST_BASE_URL` directly; defaults to Restful-Booker, repoint locally, no code change |
| `rest-api-twilio` | Dedicated REST client, pinned to Twilio | Same `.env` file, but its `TWILIO_BASE_URL`/`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` keys are remapped to the generic `REST_BASE_URL`/`AUTH_BASIC_USERNAME`/`AUTH_BASIC_PASSWORD` names via `run-with-env.mjs --map`, since both REST servers are the same underlying tool and would otherwise collide on those names |

**Known quirk**: the REST MCP (`dkmaker-mcp-rest-api`) always JSON-encodes request bodies. APIs expecting `application/x-www-form-urlencoded` (Twilio, Restful-Booker's `PUT`) reject that — pass params as a URL query string on the endpoint instead, or use a one-time `Cookie`/`Authorization` header for dynamic tokens (see agent files for the exact pattern).

**Xray prerequisite**: the `Test` issue type and the `Test` issue-link type must be provisioned on a Jira project before `jira-test-case-writer` can create Test issues there. That's a one-time, UI-only wizard per project (no REST API exists for it) — see SETUP.md. (Marking Pass/Fail on the Xray Testing Board itself was tried and abandoned — see git history — in favor of the local Extent report, since it needs either Xray Cloud API credentials requiring site-admin access, or fragile browser automation of Jira's own UI.)
