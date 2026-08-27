#!/usr/bin/env node
/**
 * import.mjs - turn the shared display-name sheet's CSV exports into
 * config/displayNames.table.ts.
 *
 *   pnpm --filter main did:names -- --scenarios scenarios.csv --locations locations.csv
 *
 * Either file may be omitted; the other table is then left as it is. Writes
 * the JSON and runs prettier on it. Exits non-zero on a code with two names.
 */

import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { buildDisplayNames, parseCsv, parseTableLiteral } from "./lib.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = resolve(HERE, "..", "..")
const OUT = join(
  APP_ROOT,
  "app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/displayNames.table.ts",
)

/** Read the current table out of the TypeScript module. */
function readCurrent() {
  return parseTableLiteral(readFileSync(OUT, "utf8"))
}

function renderModule(table) {
  return `/**
 * displayNames.table.ts - the display-name override table, WRITTEN by
 * \`pnpm --filter main did:names\` from the shared sheet's CSV exports. Do not
 * edit by hand; re-import and commit. Keys are the site's own ids.
 */

export const DISPLAY_NAME_TABLE: {
  scenarios: Record<string, string>
  locations: Record<string, string>
} = ${JSON.stringify(table, null, 2)}
`
}

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? null : args[i + 1]
}
const scenariosFile = opt("--scenarios")
const locationsFile = opt("--locations")
const current = readCurrent()
const built = buildDisplayNames(
  scenariosFile ? parseCsv(readFileSync(scenariosFile, "utf8")) : [],
  locationsFile ? parseCsv(readFileSync(locationsFile, "utf8")) : [],
)
const next = {
  scenarios: scenariosFile ? built.scenarios : current.scenarios,
  locations: locationsFile ? built.locations : current.locations,
}
const formatted = execFileSync(
  "pnpm",
  ["exec", "prettier", "--stdin-filepath", OUT],
  { cwd: APP_ROOT, input: renderModule(next), encoding: "utf8" },
)
writeFileSync(OUT, formatted)
console.log(
  `wrote ${OUT}: ${Object.keys(next.scenarios).length} scenario names, ${Object.keys(next.locations).length} location names`,
)
