#!/usr/bin/env node
/**
 * analyze.mjs - summarize perf-driver JSONL results
 *
 * Usage: node analyze.mjs [resultsDir]
 * Reads *.jsonl in the results dir and prints one markdown table per suite:
 * median / min / max ms per cell, plus median bytes where recorded, and a
 * select-to-paint end-to-end table derived from app-flow record dumps.
 */

import { readFileSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const here = dirname(fileURLToPath(import.meta.url))
const dir = process.argv[2] ?? join(here, "results")

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const rows = []
for (const file of readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of readFileSync(join(dir, file), "utf8").split("\n")) {
    if (line.trim()) rows.push(JSON.parse(line))
  }
}

const bySuiteCell = new Map()
for (const row of rows) {
  if (typeof row.ms !== "number") continue
  const key = `${row.suite}|${row.cell}`
  if (!bySuiteCell.has(key)) bySuiteCell.set(key, { ms: [], bytes: [] })
  bySuiteCell.get(key).ms.push(row.ms)
  if (typeof row.bytes === "number") bySuiteCell.get(key).bytes.push(row.bytes)
}

let currentSuite = null
for (const [key, agg] of [...bySuiteCell.entries()].sort()) {
  const [suite, cell] = key.split("|")
  if (suite !== currentSuite) {
    currentSuite = suite
    console.log(`\n## ${suite}\n`)
    console.log("| cell | runs | median ms | min | max | median bytes |")
    console.log("|------|------|-----------|-----|-----|--------------|")
  }
  const mb = agg.bytes.length ? Math.round(median(agg.bytes)) : ""
  console.log(
    `| ${cell} | ${agg.ms.length} | ${median(agg.ms).toFixed(0)} | ${Math.min(...agg.ms).toFixed(0)} | ${Math.max(...agg.ms).toFixed(0)} | ${mb} |`,
  )
}

// App-flow rows carry nested records rather than a flat ms; summarize the
// end-to-end span (select mark to paint mark) per cell, plus the batch API
// span inside each run.
const flowCells = new Map()
for (const row of rows) {
  if (!Array.isArray(row.records)) continue
  const select = row.records.find((r) => r.name === "select:scenarios")
  const paint = row.records.find((r) => r.name === "paint:category-batch")
  if (!select || !paint) continue
  if (!flowCells.has(row.cell)) flowCells.set(row.cell, { e2e: [], api: [] })
  flowCells.get(row.cell).e2e.push(paint.t - select.t)
  const batch = row.records.find(
    (r) => r.kind === "api" && String(r.url).includes("statistics/batch"),
  )
  if (batch) flowCells.get(row.cell).api.push(batch.totalMs)
}
if (flowCells.size) {
  console.log(`\n## app-flow end-to-end (select to paint)\n`)
  console.log("| cell | runs | median ms | min | max | median api ms |")
  console.log("|------|------|-----------|-----|-----|---------------|")
  for (const [cell, agg] of [...flowCells.entries()].sort()) {
    const apiMed = agg.api.length ? median(agg.api).toFixed(0) : ""
    console.log(
      `| ${cell} | ${agg.e2e.length} | ${median(agg.e2e).toFixed(0)} | ${Math.min(...agg.e2e).toFixed(0)} | ${Math.max(...agg.e2e).toFixed(0)} | ${apiMed} |`,
    )
  }
}

// Compute-bench rows carry a results array of {label, medianMs, minMs, maxMs}
const benchRows = rows.filter((r) => r.suite === "compute-bench")
if (benchRows.length) {
  console.log(`\n## compute-bench (FE quantiles)\n`)
  console.log("| case | median ms | min | max |")
  console.log("|------|-----------|-----|-----|")
  const latest = benchRows[benchRows.length - 1]
  for (const c of latest.results ?? []) {
    console.log(
      `| ${c.label} | ${c.medianMs.toFixed(2)} | ${c.minMs.toFixed(2)} | ${c.maxMs.toFixed(2)} |`,
    )
  }
}
