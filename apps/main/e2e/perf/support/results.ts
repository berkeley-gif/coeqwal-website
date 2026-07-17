/**
 * results.ts - JSONL result sink for the perf driver
 *
 * Writes one JSON object per line to PERF_RESULTS_DIR (default:
 * e2e/perf/results, gitignored). Side effect: creates the directory on
 * first write.
 */

import { appendFileSync, mkdirSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"

const RESULTS_DIR =
  process.env.PERF_RESULTS_DIR ??
  fileURLToPath(new URL("../results", import.meta.url))

export function appendResult(file: string, row: Record<string, unknown>): void {
  mkdirSync(RESULTS_DIR, { recursive: true })
  appendFileSync(join(RESULTS_DIR, file), JSON.stringify(row) + "\n")
}
