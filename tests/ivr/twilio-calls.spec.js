import { test, expect } from "@playwright/test";
import { loadEnvFile } from "../../scripts/load-env.mjs";

const twilioEnv = loadEnvFile(".env.twilio");
const accountSid = twilioEnv.AUTH_BASIC_USERNAME;

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
    const res = await request.post(
      `/2010-04-01/Accounts/${accountSid}/Calls.json` +
        `?To=${encodeURIComponent(TO)}&From=${encodeURIComponent(FROM)}&Url=${encodeURIComponent("http://demo.twilio.com/welcome/voice/")}`
    );
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.sid).toBeTruthy();
    expect(body.status).toBe("queued");
  });

  test("TC2 [Positive] Poll placed call to terminal status with duration and price", async ({ request }) => {
    const placeRes = await request.post(
      `/2010-04-01/Accounts/${accountSid}/Calls.json` +
        `?To=${encodeURIComponent(TO)}&From=${encodeURIComponent(FROM)}&Url=${encodeURIComponent("http://demo.twilio.com/welcome/voice/")}`
    );
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
    const res = await request.post(
      `/2010-04-01/Accounts/${accountSid}/Calls.json` +
        `?From=${encodeURIComponent(FROM)}&Url=${encodeURIComponent("http://demo.twilio.com/welcome/voice/")}`
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe(21201);
  });

  test("TC4 [Negative] Calls API with invalid Account SID returns 401", async ({ request }) => {
    const res = await request.get(`/2010-04-01/Accounts/ACinvalid00000000000000000000000/Calls.json`);
    expect(res.status()).toBe(401);
  });

  test("TC5 [Negative] Get unknown call sid returns 404", async ({ request }) => {
    const res = await request.get(
      `/2010-04-01/Accounts/${accountSid}/Calls/CA00000000000000000000000000000000.json`
    );
    expect(res.status()).toBe(404);
  });
});
