#!/usr/bin/env node
// Loads KEY=VALUE pairs from an env file (if present) into the child process's
// environment, then execs the given command. No dependency on dotenv/dotenv-cli
// (which has known issues via npx on Windows) — just Node built-ins, so this
// works identically for any teammate, CI runner, or Claude Code client.
//
// Usage: node run-with-env.mjs <envFile> <command> [args...]
// The env file always wins over an inherited process env var of the same
// name — each MCP server (rest-api vs rest-api-twilio) has its own env file
// specifying its own REST_BASE_URL/creds, and a stray machine-wide env var
// (e.g. REST_BASE_URL set globally on a dev box) must not silently override
// one server's endpoint with the other's. A missing env file is silently
// skipped rather than erroring, so the same .mcp.json still works in CI
// where credentials are injected directly with no file present.

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const [, , envFile, command, ...cmdArgs] = process.argv;

if (!command) {
  console.error("Usage: run-with-env.mjs <envFile> <command> [args...]");
  process.exit(1);
}

const env = { ...process.env };

if (envFile && existsSync(envFile)) {
  const content = readFileSync(envFile, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
}

// On Windows, npm-installed CLIs (npx, etc.) are .cmd shims that plain spawn()
// can't exec directly (tried resolving the .cmd extension explicitly — still
// EINVAL on Node 24). shell:true is the reliable fix, but shell:true + an args
// array concatenates arguments unescaped (Node's own deprecation warning) — so
// we quote everything ourselves and pass one pre-built command string instead.
function quoteArg(arg) {
  if (/^[A-Za-z0-9_.:\\/-]+$/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

const isWindows = process.platform === "win32";
const fullCommand = [command, ...cmdArgs].map(quoteArg).join(" ");
const child = isWindows
  ? spawn(fullCommand, { stdio: "inherit", env, shell: true })
  : spawn(command, cmdArgs, { stdio: "inherit", env });

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
child.on("error", (err) => {
  console.error(`Failed to start ${command}:`, err.message);
  process.exit(1);
});
