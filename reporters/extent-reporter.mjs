// Playwright Test reporter: collects raw results from the scripted tests/ suite
// and hands them to the shared renderer (reporters/render-report.mjs) so this
// report is visually identical to the one generate-agent-report.mjs produces
// for the Jira-driven agents.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderExtentReport } from "./render-report.mjs";

class ExtentReporter {
  constructor() {
    this.raw = [];
  }

  onTestEnd(test, result) {
    const suite = test.titlePath()[1] || "unknown";
    let screenshotPath = null;
    for (const att of result.attachments) {
      if (att.contentType?.startsWith("image/") && att.path) screenshotPath = att.path;
    }
    this.raw.push({
      suite,
      title: test.title,
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      error: result.errors?.map((e) => e.message || String(e)).join("\n") || null,
      screenshotPath,
    });
  }

  onEnd() {
    mkdirSync("target/extent-report", { recursive: true });
    const { html, results } = renderExtentReport(this.raw);
    writeFileSync(path.join("target", "extent-report", "index.html"), html);
    writeFileSync(path.join("target", "extent-report", "results.json"), JSON.stringify(results, null, 2));
  }
}

export default ExtentReporter;
