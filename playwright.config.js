import { defineConfig } from "@playwright/test";
import { loadEnvFile } from "./scripts/load-env.mjs";

// Single .env file for everything — Twilio's values use a distinct TWILIO_
// prefix (see .env.example) precisely so they don't collide with the generic
// REST_BASE_URL used by the "api" project below.
const env = loadEnvFile(".env");

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
        baseURL: env.REST_BASE_URL || "https://restful-booker.herokuapp.com",
      },
    },
    {
      name: "ivr",
      testDir: "tests/ivr",
      use: {
        baseURL: env.TWILIO_BASE_URL || "https://api.twilio.com",
        extraHTTPHeaders: {
          Authorization:
            "Basic " +
            Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        },
      },
    },
  ],
});
