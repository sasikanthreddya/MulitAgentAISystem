// Renders an Extent-style HTML report from a Jira-agent run, using the same
// generator as the scripted Playwright suite (reporters/render-report.mjs).
//
// Usage: node scripts/generate-agent-report.mjs <results.json> <issueKey>
//
// <results.json> is an array the calling agent writes itself (via its Write
// tool) after executing real test cases, each entry:
//   { "suite": "ui"|"api"|"ivr", "title": "TC1 [Positive] ...", "status": "passed"|"failed"|"skipped",
//     "duration": <ms>, "retry": <count>, "error": "<string or null>", "screenshotPath": "<path or null>" }
//
// Output goes to target/extent-report/<issueKey>/ — scoped per story so testing
// one Jira issue never clobbers another's report, but each run of the *same*
// issue key starts clean (old index.html/results.json for that key are removed
// first, so stale results never linger next to fresh ones).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { renderExtentReport } from "../reporters/render-report.mjs";

const [, , resultsPath, issueKey] = process.argv;

if (!resultsPath || !issueKey) {
  console.error("Usage: node scripts/generate-agent-report.mjs <results.json> <issueKey>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(resultsPath, "utf8"));
if (!Array.isArray(raw) || raw.length === 0) {
  console.error("results.json must be a non-empty array of test results");
  process.exit(1);
}

const outDir = path.join("target", "extent-report", issueKey);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const { html, results } = renderExtentReport(raw);
writeFileSync(path.join(outDir, "index.html"), html);
writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));

console.log(`Report written to ${path.join(outDir, "index.html")}`);
