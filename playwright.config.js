import { defineConfig } from "@playwright/test";
import { loadEnvFile } from "./scripts/load-env.mjs";

// Loaded separately (not merged) — both files define REST_BASE_URL for their
// own unrelated target, and a merge would let .env.twilio's value clobber .env's.
const apiEnv = loadEnvFile(".env");
const twilioEnv = loadEnvFile(".env.twilio");

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  // No retries by default — only the UI project opts back in (browser flakiness
  // is the one case retrying is actually appropriate). Retrying a real API call
  // can mask a real backend bug, and retrying IVR places another real, charged
  // Twilio call, so both stay at zero rather than inheriting a global default.
  retries: 0,
  reporter: [["list"], ["./reporters/extent-reporter.mjs"]],
  use: {
    screenshot: "only-on-failure",
    // "retain-on-failure" records a trace during every single test and only
    // keeps it if that test fails — real overhead paid on every passing test.
    // "on-first-retry" only starts recording once a test is already retrying,
    // so the common case (pass on attempt 1) pays nothing, while a failure
    // that needs a retry still gets a trace to debug. api/ivr have 0 retries,
    // so this setting only ever has an effect on the ui project anyway.
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "ui",
      testDir: "tests/ui",
      retries: 2,
      use: { baseURL: "https://the-internet.herokuapp.com" },
    },
    {
      name: "api",
      testDir: "tests/api",
      use: {
        baseURL: apiEnv.REST_BASE_URL || "https://restful-booker.herokuapp.com",
      },
    },
    {
      name: "ivr",
      testDir: "tests/ivr",
      use: {
        baseURL: "https://api.twilio.com",
        extraHTTPHeaders: {
          Authorization:
            "Basic " +
            Buffer.from(`${twilioEnv.AUTH_BASIC_USERNAME}:${twilioEnv.AUTH_BASIC_PASSWORD}`).toString("base64"),
        },
      },
    },
  ],
});
