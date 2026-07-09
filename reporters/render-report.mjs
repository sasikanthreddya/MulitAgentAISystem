// Shared Extent-style HTML renderer. Used by two callers with two different
// result sources: the Playwright reporter (reporters/extent-reporter.mjs, fed
// by the scripted tests/ suite) and scripts/generate-agent-report.mjs (fed by
// the Jira acceptance-criteria-driven agents in .claude/agents/). Both hand it
// the same plain result shape so the two report types look identical.
import { readFileSync } from "node:fs";

const COLORS = { passed: "#2e7d32", failed: "#c62828", skipped: "#9e9e9e", flaky: "#f9a825" };

function classify(title) {
  const t = title.toLowerCase();
  if (t.includes("[negative]")) return "Negative";
  if (t.includes("[positive]")) return "Positive";
  return "Other";
}

// A "passed" result that only passed after a retry is surfaced as its own
// category rather than silently counted as a clean pass.
function finalStatus(status, retry) {
  if (status === "passed" && retry > 0) return "flaky";
  return status;
}

function embedScreenshot(screenshotPath) {
  if (!screenshotPath) return null;
  try {
    const buf = readFileSync(screenshotPath);
    const ext = screenshotPath.toLowerCase().endsWith(".jpg") || screenshotPath.toLowerCase().endsWith(".jpeg")
      ? "jpeg"
      : "png";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch {
    // Screenshot file may have been cleaned up or the path is stale — the
    // report still renders, just without the image for that one test.
    return null;
  }
}

function donutSvg(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const r = 60, cx = 70, cy = 70, circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([status, v]) => {
      const frac = v / total;
      const dash = frac * circumference;
      const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLORS[status] || "#999"}"
        stroke-width="24" stroke-dasharray="${dash} ${circumference - dash}"
        stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
      offset += dash;
      return seg;
    })
    .join("\n");
  return `<svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Pass/fail breakdown">
    ${segments}
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-total">${total}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="donut-label">tests</text>
  </svg>`;
}

function barChartSvg(rows) {
  const maxVal = Math.max(1, ...rows.map((r) => r.passed + r.failed + r.skipped));
  const barH = 22, gap = 12, labelW = 110, chartW = 320;
  const scale = chartW / maxVal;
  let y = 10;
  const bars = rows
    .map((r) => {
      const passedW = r.passed * scale;
      const failedW = r.failed * scale;
      const skippedW = r.skipped * scale;
      const row = `
      <text x="0" y="${y + barH / 2 + 4}" class="bar-label">${r.name} (${r.passed + r.failed + r.skipped})</text>
      <rect x="${labelW}" y="${y}" width="${passedW}" height="${barH}" fill="${COLORS.passed}" />
      <rect x="${labelW + passedW}" y="${y}" width="${failedW}" height="${barH}" fill="${COLORS.failed}" />
      <rect x="${labelW + passedW + failedW}" y="${y}" width="${skippedW}" height="${barH}" fill="${COLORS.skipped}" />`;
      y += barH + gap;
      return row;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${labelW + chartW + 10} ${y}" class="barchart" role="img" aria-label="Results by category">
    ${bars}
  </svg>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// rawResults: [{ suite, title, category?: 'Positive'|'Negative' (optional — falls
//   back to parsing "[positive]"/"[negative]" out of the title if omitted, but an
//   explicit category is authoritative since not every real title follows that
//   convention), status: 'passed'|'failed'|'skipped', duration (ms), retry (number),
//   error (string|null), screenshotPath (string|null) }]
export function renderExtentReport(rawResults) {
  const results = rawResults.map((r) => ({
    suite: r.suite,
    title: r.title,
    category: r.category || classify(r.title),
    status: finalStatus(r.status, r.retry || 0),
    duration: r.duration || 0,
    retry: r.retry || 0,
    error: r.error || null,
    screenshot: embedScreenshot(r.screenshotPath),
  }));

  const totals = { passed: 0, failed: 0, skipped: 0, flaky: 0 };
  for (const r of results) totals[r.status] = (totals[r.status] || 0) + 1;

  const bySuite = {};
  const byCategory = {};
  for (const r of results) {
    bySuite[r.suite] ??= { passed: 0, failed: 0, skipped: 0 };
    byCategory[r.category] ??= { passed: 0, failed: 0, skipped: 0 };
    const bucket = r.status === "flaky" ? "passed" : r.status;
    if (bySuite[r.suite][bucket] !== undefined) bySuite[r.suite][bucket]++;
    if (byCategory[r.category][bucket] !== undefined) byCategory[r.category][bucket]++;
  }
  const suiteRows = Object.entries(bySuite).map(([name, v]) => ({ name, ...v }));
  const categoryRows = Object.entries(byCategory).map(([name, v]) => ({ name, ...v }));

  const passRate = results.length
    ? Math.round(((totals.passed + totals.flaky) / results.length) * 100)
    : 0;

  const groupedBySuite = {};
  for (const r of results) (groupedBySuite[r.suite] ??= []).push(r);

  const testRows = Object.entries(groupedBySuite)
    .map(([suite, tests]) => {
      const rows = tests
        .map((r, i) => {
          const rowId = `${suite}-${i}`;
          const hasDetail = r.error || r.screenshot;
          return `
          <tr class="test-row status-${r.status}" ${hasDetail ? `onclick="toggleDetail('${rowId}')" style="cursor:pointer"` : ""}>
            <td>${escapeHtml(r.title)}</td>
            <td><span class="badge badge-${r.category.toLowerCase()}">${r.category}</span></td>
            <td><span class="badge badge-${r.status}">${r.status}</span></td>
            <td>${r.retry > 0 ? r.retry : "-"}</td>
            <td>${(r.duration / 1000).toFixed(2)}s</td>
          </tr>
          ${hasDetail ? `
          <tr class="detail-row" id="detail-${rowId}" hidden>
            <td colspan="5">
              ${r.error ? `<pre class="error">${escapeHtml(r.error)}</pre>` : ""}
              ${r.screenshot ? `<img src="${r.screenshot}" alt="Failure screenshot" class="screenshot" />` : ""}
            </td>
          </tr>` : ""}`;
        })
        .join("\n");
      return `
      <h2>${escapeHtml(suite)}</h2>
      <table>
        <thead><tr><th>Test</th><th>Type</th><th>Status</th><th>Retries</th><th>Duration</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Extent Report</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; background: #f7f7f8; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) { body { background: #16181c; color: #e6e6e6; } }
  h1 { margin-top: 0; }
  .summary { display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; margin-bottom: 2rem; }
  .cards { display: flex; gap: 1rem; flex-wrap: wrap; }
  .card { background: #fff; border-radius: 8px; padding: 1rem 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,.12); min-width: 100px; text-align: center; }
  @media (prefers-color-scheme: dark) { .card { background: #22252b; } }
  .card .n { font-size: 1.8rem; font-weight: 700; display: block; }
  .card.passed .n { color: ${COLORS.passed}; }
  .card.failed .n { color: ${COLORS.failed}; }
  .card.skipped .n { color: ${COLORS.skipped}; }
  .card.flaky .n { color: ${COLORS.flaky}; }
  .charts { display: flex; gap: 3rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .donut-total { font-size: 22px; font-weight: 700; fill: currentColor; }
  .donut-label { font-size: 11px; fill: currentColor; opacity: .7; }
  .bar-label { font-size: 12px; fill: currentColor; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 2rem; background: #fff; }
  @media (prefers-color-scheme: dark) { table { background: #22252b; } }
  th, td { text-align: left; padding: .5rem .75rem; border-bottom: 1px solid rgba(127,127,127,.25); font-size: .9rem; }
  th { opacity: .7; font-weight: 600; }
  .badge { padding: .15rem .5rem; border-radius: 4px; font-size: .78rem; font-weight: 600; color: #fff; }
  .badge-passed { background: ${COLORS.passed}; }
  .badge-failed { background: ${COLORS.failed}; }
  .badge-skipped { background: ${COLORS.skipped}; }
  .badge-flaky { background: ${COLORS.flaky}; }
  .badge-positive { background: #1565c0; }
  .badge-negative { background: #6a1b9a; }
  .badge-other { background: #555; }
  .detail-row td { background: rgba(127,127,127,.08); }
  .error { white-space: pre-wrap; color: ${COLORS.failed}; font-size: .82rem; }
  .screenshot { max-width: 480px; display: block; margin-top: .5rem; border: 1px solid rgba(127,127,127,.3); }
  .legend { font-size: .8rem; opacity: .8; }
  .legend span { display: inline-flex; align-items: center; gap: .3rem; margin-right: 1rem; }
  .legend i { width: 10px; height: 10px; display: inline-block; border-radius: 2px; }
</style>
</head>
<body>
  <h1>Test Execution Report</h1>
  <p class="legend">Generated ${new Date().toLocaleString()}</p>
  <div class="summary">
    <div class="cards">
      <div class="card passed"><span class="n">${totals.passed}</span>Passed</div>
      <div class="card failed"><span class="n">${totals.failed}</span>Failed</div>
      <div class="card skipped"><span class="n">${totals.skipped}</span>Skipped</div>
      <div class="card flaky"><span class="n">${totals.flaky}</span>Flaky (passed on retry)</div>
      <div class="card"><span class="n">${passRate}%</span>Pass rate</div>
    </div>
  </div>
  <div class="charts">
    <div>
      <h3>Overall</h3>
      ${donutSvg(totals)}
    </div>
    <div>
      <h3>By suite</h3>
      ${barChartSvg(suiteRows)}
    </div>
    <div>
      <h3>Positive vs Negative</h3>
      ${barChartSvg(categoryRows)}
    </div>
  </div>
  <div class="legend">
    <span><i style="background:${COLORS.passed}"></i>Passed</span>
    <span><i style="background:${COLORS.failed}"></i>Failed</span>
    <span><i style="background:${COLORS.skipped}"></i>Skipped</span>
  </div>
  ${testRows}
  <script>
    function toggleDetail(id) {
      const el = document.getElementById('detail-' + id);
      if (el) el.hidden = !el.hidden;
    }
  </script>
</body>
</html>`;

  return { html, results };
}
