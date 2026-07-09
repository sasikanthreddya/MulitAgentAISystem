// Minimal KEY=VALUE file loader (same parsing rules as run-with-env.mjs) so
// playwright.config.js can read REST_BASE_URL/creds without a new dependency.
import { readFileSync, existsSync } from "node:fs";

export function loadEnvFile(path) {
  const result = {};
  if (!existsSync(path)) return result;
  const content = readFileSync(path, "utf8");
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
    result[key] = value;
  }
  return result;
}
