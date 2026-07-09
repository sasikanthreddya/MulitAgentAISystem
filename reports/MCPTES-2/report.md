# Execution Report — MCPTES-2 (APIUserstory)

**Verdict: PASSED (5/5)**
Executed via `jira-story-executor` subagent using the `rest-api` MCP (dkmaker-mcp-rest-api) against the live `https://restful-booker.herokuapp.com` API — real HTTP calls, no mocking.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| TC-1 | `POST /booking` valid payload → 200 + bookingid + matching details | PASS | Created booking, `bookingid: 4261`, response body echoed all submitted fields exactly |
| TC-2 | `PUT /booking/{id}` with valid token → 200 + updated values | PASS | `POST /auth` → token `6156670d06a5598`; `PUT /booking/4261` with `Cookie: token=...` → 200, updated to Jane Smith/200/false/2026-09-01–15/Lunch; confirmed via follow-up GET |
| TC-3a | `GET /booking` no filters → 200 + list of bookingid objects | PASS | 200, JSON array of `{bookingid: N}` objects |
| TC-3b | `GET /booking?firstname=John&lastname=Doe` → only matching IDs | PASS | 200, returned 26 IDs, including newly created 4261 |
| TC-4 | `PUT /booking/{id}` without token → 403 Forbidden | PASS | No auth header → 403 "Forbidden" |
| TC-5 | `GET /booking/999999999` (non-existent) → 404 Not Found | PASS | 404 "Not Found" |

## Notes

- No failures found across the 5 acceptance criteria (6 test cases, TC-3 split into filtered/unfiltered).
- Transient anomaly: both `POST /booking` and a later `GET /booking/4261` returned a one-off `418 I'm a teapot` on first attempt, succeeding identically on immediate retry. This is a known intermittent WAF/anti-bot quirk of this public demo host, not a defect in the API contract under test — not counted as a failure.
- Full evidence table also posted as a Jira comment on [MCPTES-2](https://sasiapitest.atlassian.net/browse/MCPTES-2) (comment id 10034).
