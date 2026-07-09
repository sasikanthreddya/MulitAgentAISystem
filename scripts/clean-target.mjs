// Wipes report output from the previous run so target/ never mixes stale
// results with the current one (screenshots, JSON, and the Extent-style
// HTML dashboard are all regenerated fresh every run).
import { rmSync, mkdirSync } from "node:fs";

for (const dir of ["target", "test-results"]) {
  rmSync(dir, { recursive: true, force: true });
}
mkdirSync("target", { recursive: true });
