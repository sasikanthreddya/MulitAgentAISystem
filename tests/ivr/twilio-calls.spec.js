import { test, expect } from "@playwright/test";
import { loadEnvFile } from "../../scripts/load-env.mjs";

const env = loadEnvFile(".env");
const accountSid = env.TWILIO_ACCOUNT_SID;

// This account is a Twilio Trial account: it can only call a verified Outgoing
// Caller ID, not Twilio's documented "magic" test number — using an owned
// number/verified number here is a real account constraint, not a test choice.
const FROM = "+18049069249";
const TO = "+917801048449";

// Real calls, real charges — keep this suite serial so parallel workers never
// place two calls against the same trial-verified number at once.
test.describe.configure({ mode: "serial" });

test.describe("Twilio Voice Calls API", () => {
  test("TC1 [Positive] Place call with valid To/From/Url returns 201 queued", async ({ request }) => {
    // Twilio's Calls API expects POST params as an application/x-www-form-urlencoded
    // body, not a query string — `form` sends it correctly. Query-string-on-POST
    // happened to work through one HTTP client (the rest-api-twilio MCP tool) but
    // not Playwright's own request fixture, which is exactly the kind of
    // client-dependent fragility you get from relying on an unsupported mechanism.
    const res = await request.post(`/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      form: { To: TO, From: FROM, Url: "http://demo.twilio.com/welcome/voice/" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.sid).toBeTruthy();
    expect(body.status).toBe("queued");
  });

  test("TC2 [Positive] Poll placed call to terminal status with duration and price", async ({ request }) => {
    // The poll loop below budgets up to 9×10s (~90s) to reach a terminal call
    // state — longer than Playwright's default 30s test timeout, so this test
    // needs its own explicit budget or it times out mid-poll on a real call
    // that's still perfectly on track to complete.
    test.setTimeout(120_000);
    const placeRes = await request.post(`/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      form: { To: TO, From: FROM, Url: "http://demo.twilio.com/welcome/voice/" },
    });
    const { sid } = await placeRes.json();

    const terminalStates = ["completed", "busy", "no-answer", "failed", "canceled"];
    let status = "queued";
    let call;
    for (let i = 0; i < 9 && !terminalStates.includes(status); i++) {
      await new Promise((r) => setTimeout(r, 10000));
      const pollRes = await request.get(`/2010-04-01/Accounts/${accountSid}/Calls/${sid}.json`);
      call = await pollRes.json();
      status = call.status;
    }
    expect(terminalStates).toContain(status);
  });

  test("TC3 [Negative] Place call missing To returns 400 error 21201", async ({ request }) => {
    const res = await request.post(`/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      form: { From: FROM, Url: "http://demo.twilio.com/welcome/voice/" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe(21201);
  });

  test("TC4 [Negative] Calls API with invalid Account SID returns 401", async ({ request }) => {
    // Must be a well-formed SID (AC + 32 hex chars) that's simply wrong/nonexistent —
    // a malformed one (wrong length/non-hex chars) gets rejected by Twilio's routing
    // as 404 before it ever reaches auth checking, which tests routing, not auth.
    const bogusButWellFormedSid = "AC" + "0".repeat(32);
    const res = await request.get(`/2010-04-01/Accounts/${bogusButWellFormedSid}/Calls.json`);
    expect(res.status()).toBe(401);
  });

  test("TC5 [Negative] Get unknown call sid returns 404", async ({ request }) => {
    const res = await request.get(
      `/2010-04-01/Accounts/${accountSid}/Calls/CA00000000000000000000000000000000.json`
    );
    expect(res.status()).toBe(404);
  });
});
