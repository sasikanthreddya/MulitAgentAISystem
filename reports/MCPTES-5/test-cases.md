# Test Cases — MCPTES-5 (IVRStory)

Story: https://sasiapitest.atlassian.net/browse/MCPTES-5

These 5 Xray Test issues already existed from a prior run and were **reused**
(not duplicated) after re-confirming they still map 1:1 to the story's current
5 acceptance criteria: MCPTES-22, MCPTES-23, MCPTES-24, MCPTES-25, MCPTES-26 —
all linked to MCPTES-5 via the `Test` link type.

| ID | Xray Test | Type | Request | Expected Result |
|---|---|---|---|---|
| TC-1 | MCPTES-22 | Positive | `POST /2010-04-01/Accounts/{AccountSid}/Calls.json?To=%2B917801048449&From=%2B18049069249&Url=https%3A%2F%2Fdemo.twilio.com%2Fwelcome%2Fvoice%2F` | HTTP 201 with a call `sid` and `status` = `queued` |
| TC-2 | MCPTES-23 | Positive | `GET /2010-04-01/Accounts/{AccountSid}/Calls/{sid}.json` polled every ~15s (up to ~90s) using the `sid` from TC-1 | `status` reaches a terminal state (`completed`/`busy`/`no-answer`/`failed`/`canceled`); for `completed`, `duration` and `price` are non-null |
| TC-3 | MCPTES-24 | Negative | `POST /2010-04-01/Accounts/{AccountSid}/Calls.json?From=%2B18049069249&Url=...` with `To` omitted | HTTP 400 with Twilio error code `21201` ("No 'To' number is specified"), no call created |
| TC-4 | MCPTES-25 | Negative | `POST /2010-04-01/Accounts/AC00000000000000000000000000000000/Calls.json?To=...&From=...&Url=...` (obviously wrong Account SID in path, simulating invalid credentials) | HTTP 401 Unauthorized |
| TC-5 | MCPTES-26 | Negative | `GET /2010-04-01/Accounts/{AccountSid}/Calls/CA00000000000000000000000000000000.json` (well-formed but non-existent call sid) | HTTP 404 Not Found |

Note: `{AccountSid}` = the Account SID configured in `.env.twilio` (a Trial account), injected via Basic Auth by the `rest-api-twilio` MCP — now correctly routed to `https://api.twilio.com`. Not reproduced here — see `.env.twilio` locally (gitignored).

`To`/`From` used for TC-1..TC-3/TC-4: Twilio's documented magic test number
`+15005550006` is rejected on this Trial account with error `21210` ("source
phone number ... not yet verified"). Substituted real account resources:
- `From` = `+18049069249` (account's owned, voice-capable Twilio number)
- `To` = `+917801048449` (verified Outgoing Caller ID — the only number a
  Trial account may dial)

TC-3 omits `To` per its definition; TC-4/TC-5 reuse the same `To`/`From`
where applicable for realism.
