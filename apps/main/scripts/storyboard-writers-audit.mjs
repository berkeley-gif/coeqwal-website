#!/usr/bin/env node
/* Storyboard Writers Audit.
 *
 * Enforces invariant 1 of the Storyboard Engine Hardening Plan v2:
 * writes to the shared Mapbox layers `demand-units` and
 * `demand-units-outline` are restricted to a small, enumerated set
 * of files. Any new file that adds a hardcoded
 * `setPaintProperty("demand-units", ...)`,
 * `setFilter("demand-units", ...)`, or
 * `setLayoutProperty("demand-units", ...)` call (or the `-outline`
 * variants) causes this script to exit non-zero, which should fail
 * CI.
 *
 * Why not a unit test. `apps/main` does not have a test runner
 * configured, and Phase 0.5 is explicitly scoped to not introduce
 * one. This plain Node script runs under any CI. Phase 3 or beyond
 * can promote it to Vitest once the test runner lands.
 *
 * How to extend the allowlist. If you genuinely need a new writer,
 * add the relative path to `APPROVED_WRITERS` below, include a
 * one-line comment explaining why that file is allowed to write,
 * and re-run `node apps/main/scripts/storyboard-writers-audit.mjs`
 * to confirm the file now passes.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const SCRIPT_DIR = __filename.substring(0, __filename.lastIndexOf(sep))
// scripts/../app → the main app's source root
const APP_ROOT = join(SCRIPT_DIR, "..")
const SCAN_ROOT = join(APP_ROOT, "app")
const REPO_MAIN_REL = "apps/main"

/* Files that are allowed to write to `demand-units` or
 * `demand-units-outline`. Paths are relative to `apps/main`. Order
 * has no meaning. The matching is exact string equality, not a
 * prefix or glob. */
const APPROVED_WRITERS = new Set([
  // The playback arbiter. Single writer during Beat 4.
  "app/features/scenarioExplorer/getStarted/engine/arbiters/MapPaintArbiter.ts",
  // The interactive paint arbiter. Single writer during get-started
  // paused-between-beats and interactive exploration (Phase 3c).
  "app/features/scenarioExplorer/getStarted/engine/arbiters/InteractivePaintArbiter.ts",
  // The baseline helper that other approved writers delegate to for
  // full-state assertion.
  "app/features/scenarioExplorer/getStarted/engine/demandUnitsBaseline.ts",
  // Session-init + engine-unmount teardown writes only. Phase 3c
  // step 2 moved the interactive-paint + deselect-teardown writes
  // into `InteractivePaintArbiter`, so this file's literal-id write
  // count is now restricted to the session-lifecycle blocks.
  "app/features/scenarioExplorer/getStarted/TierAnimationSection.tsx",
  // Learn / explore modes still route demand-units through OPL; only
  // the get-started interactive flow was moved to
  // `InteractivePaintArbiter`. All of OPL's writes use dynamic
  // `fillId` / `outlineId` variables, so the literal-id audit reports
  // 0 hits; listed here for documentation only.
  "app/features/map/visualizationLayers/components/OutcomePolygonLayer.tsx",
])

/* Call patterns we consider "writes" for audit purposes. Each
 * pattern must match the full write-call signature up to the first
 * argument (the layer id). Matches are deliberately string-literal
 * only: we do not try to audit writes through dynamic ids like
 * `setPaintProperty(fillId, ...)`, because those are covered by the
 * "OPL is an approved writer" rule and would produce too many false
 * positives anyway. */
const WRITE_PATTERNS = [
  /setPaintProperty\(\s*"(demand-units(?:-outline)?)"/g,
  /setFilter\(\s*"(demand-units(?:-outline)?)"/g,
  /setLayoutProperty\(\s*"(demand-units(?:-outline)?)"/g,
]

/** Scanner extension allowlist. We only read TypeScript sources; JS
 *  is not expected in this app. */
const SCAN_EXTENSIONS = [".ts", ".tsx"]

function walk(dir, out = []) {
  const entries = readdirSync(dir)
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) {
      walk(abs, out)
    } else if (SCAN_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      out.push(abs)
    }
  }
  return out
}

function scan() {
  const files = walk(SCAN_ROOT)
  const violations = []
  const hitsByFile = new Map()
  for (const abs of files) {
    const rel = relative(APP_ROOT, abs)
    const src = readFileSync(abs, "utf8")
    let hits = 0
    for (const pattern of WRITE_PATTERNS) {
      for (const _ of src.matchAll(pattern)) hits++
    }
    if (hits === 0) continue
    hitsByFile.set(rel, hits)
    if (!APPROVED_WRITERS.has(rel)) {
      violations.push({ file: rel, hits })
    }
  }
  return { hitsByFile, violations }
}

function main() {
  const { hitsByFile, violations } = scan()
  const sorted = [...hitsByFile.entries()].sort((a, b) => b[1] - a[1])
  console.log("Storyboard writers audit")
  console.log(`  scan root: ${REPO_MAIN_REL}/app`)
  console.log(
    `  layers: demand-units, demand-units-outline (literal ids only)`,
  )
  console.log("")
  console.log("Write sites found:")
  for (const [file, hits] of sorted) {
    const approved = APPROVED_WRITERS.has(file) ? "OK" : "VIOLATION"
    console.log(`  [${approved}] ${hits.toString().padStart(4)}  ${file}`)
  }
  console.log("")
  if (violations.length > 0) {
    console.error(
      `audit failed: ${violations.length} file(s) write demand-units outside the allowlist`,
    )
    for (const v of violations) {
      console.error(`  ${v.file} (${v.hits} writes)`)
    }
    console.error("")
    console.error(
      "If the new writer is intentional, add the path to APPROVED_WRITERS in",
    )
    console.error(`  ${REPO_MAIN_REL}/scripts/storyboard-writers-audit.mjs`)
    console.error(
      "along with a one-line comment explaining why the file needs to write.",
    )
    process.exit(1)
  }
  console.log(
    `audit passed: ${hitsByFile.size} approved file(s) write demand-units`,
  )
}

main()
