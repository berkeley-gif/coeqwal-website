#!/usr/bin/env node
/**
 * generate.mjs - regenerate the Data in Depth entity-location registry from
 * the live API.
 *
 *   pnpm --filter main did:entities          # fetch, write, prettier
 *   pnpm --filter main did:entities:check    # fetch, compare, exit 1 on drift
 *
 * Options:
 *   --api <base>       API origin (default https://api.coeqwal.org)
 *   --scenario <id>    scenario whose values seed the sample magnitudes
 *                      (default s0020, Current Operations under Historical)
 *   --from <dir>       read <dir>/ag_<scenario>.json and cws_<scenario>.json
 *                      instead of fetching (offline runs and tests)
 *   --regions <file>   NOD/SOD map per family (default ./regions.json)
 *   --out <file>       output module (default the registry's generated file)
 *   --check            do not write; exit 1 if the body of --out differs
 *                      from what the current data would produce
 *
 * Side effects: network reads (unless --from), writes --out and runs
 * prettier on it (unless --check). Exits non-zero, with the reason on
 * stderr, on any inconsistency between the API and the region map.
 */

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildLocationDefs,
  renderGeneratedModule,
  stripGeneratedHeader,
} from "./lib.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = resolve(HERE, "..", "..")
const DEFAULT_OUT = join(
  APP_ROOT,
  "app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/entityLocations.generated.ts",
)

/** Family definitions: endpoint, region-map key, membership measure. */
const FAMILIES = [
  {
    name: "AG_ENTITY_LOCATIONS",
    endpoint: "ag",
    regions: "ag",
    primaryMeasure: "net_diversion",
  },
  {
    name: "CWS_DELIVERY_ENTITY_LOCATIONS",
    endpoint: "cws",
    regions: "cwsDelivery",
    primaryMeasure: "delivery",
  },
  {
    name: "CWS_SHORTAGE_ENTITY_LOCATIONS",
    endpoint: "cws",
    regions: "cwsShortage",
    primaryMeasure: "shortage_total",
  },
]

function parseArgs(argv) {
  const opts = {
    api: "https://api.coeqwal.org",
    scenario: "s0020",
    from: null,
    regions: join(HERE, "regions.json"),
    out: DEFAULT_OUT,
    check: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = () => {
      i += 1
      if (i >= argv.length) throw new Error(`${arg} needs a value`)
      return argv[i]
    }
    if (arg === "--api") opts.api = next()
    else if (arg === "--scenario") opts.scenario = next()
    else if (arg === "--from") opts.from = next()
    else if (arg === "--regions") opts.regions = next()
    else if (arg === "--out") opts.out = next()
    else if (arg === "--check") opts.check = true
    else throw new Error(`unknown option ${arg}`)
  }
  return opts
}

async function loadPayload(opts, endpoint) {
  if (opts.from) {
    const file = join(opts.from, `${endpoint}_${opts.scenario}.json`)
    return JSON.parse(readFileSync(file, "utf8"))
  }
  const url = `${opts.api}/api/data-in-depth/${endpoint}?scenarios=${opts.scenario}&include=values`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} answered ${res.status}`)
  return res.json()
}

function subjectsOf(payload, endpoint, scenario) {
  const block = payload?.scenarios?.find((s) => s.scenario === scenario)
  if (!block?.subjects?.length) {
    throw new Error(`${endpoint}: no subjects served for ${scenario}`)
  }
  return block.subjects
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const regionsByFamily = JSON.parse(readFileSync(opts.regions, "utf8"))
  const payloads = {}
  for (const endpoint of new Set(FAMILIES.map((f) => f.endpoint))) {
    payloads[endpoint] = subjectsOf(
      await loadPayload(opts, endpoint),
      endpoint,
      opts.scenario,
    )
  }
  const groups = {}
  for (const family of FAMILIES) {
    const regions = regionsByFamily[family.regions]
    if (!regions) throw new Error(`regions file has no "${family.regions}" map`)
    groups[family.name] = buildLocationDefs({
      subjects: payloads[family.endpoint],
      regions,
      primaryMeasure: family.primaryMeasure,
    })
  }
  const source = renderGeneratedModule({
    apiBase: opts.from ? `file://${resolve(opts.from)}` : opts.api,
    scenario: opts.scenario,
    generatedAt: new Date().toISOString(),
    groups,
  })
  // Format under the repo's own prettier config whatever --out is (a test
  // writes into a temp dir, which has no config of its own).
  const formatted = execFileSync(
    "pnpm",
    ["exec", "prettier", "--stdin-filepath", DEFAULT_OUT],
    { cwd: APP_ROOT, input: source, encoding: "utf8" },
  )
  if (opts.check) {
    const current = existsSync(opts.out) ? readFileSync(opts.out, "utf8") : ""
    if (stripGeneratedHeader(current) !== stripGeneratedHeader(formatted)) {
      console.error(
        `drift: ${opts.out} differs from the ${opts.from ? "snapshot" : "live API"}; run did:entities and commit`,
      )
      process.exit(1)
    }
    console.log(`${opts.out} matches the current data`)
    return
  }
  writeFileSync(opts.out, formatted)
  for (const family of FAMILIES) {
    console.log(`${family.name}: ${groups[family.name].length}`)
  }
  console.log(`wrote ${opts.out}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
