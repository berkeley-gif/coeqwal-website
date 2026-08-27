// Unit tests for the display-name import (`node --test`): the shared sheet's
// CSV exports become the two override tables the tool reads.

import assert from "node:assert/strict"
import { test } from "node:test"
import { parseCsv, buildDisplayNames, parseTableLiteral } from "./lib.mjs"

test("parseCsv handles quoted commas and blank cells", () => {
  const rows = parseCsv('a,b,c\n1,"x, y",\n2,z,"q ""quoted"""\n')
  assert.deepEqual(rows, [
    { a: "1", b: "x, y", c: "" },
    { a: "2", b: "z", c: 'q "quoted"' },
  ])
})

test("buildDisplayNames keeps only rows with an edited name, keyed by the site id", () => {
  const scenarios = [
    {
      site_scenario_id_do_not_edit: "s0020",
      data_in_depth_prose_name_TED_EDITS: "Current operations",
    },
    {
      site_scenario_id_do_not_edit: "s0025",
      data_in_depth_prose_name_TED_EDITS: "",
    },
    {
      site_scenario_id_do_not_edit: "s0030",
      data_in_depth_prose_name_TED_EDITS:
        "  SGMA, San Joaquin pumping limits  ",
    },
  ]
  const locations = [
    {
      code_do_not_edit: "24_NU2",
      display_name_TED_EDITS: "Placer County WA lower Zone 1",
    },
    { code_do_not_edit: "MWD", display_name_TED_EDITS: "" },
    {
      code_do_not_edit: "24_NU2",
      display_name_TED_EDITS: "Placer County WA lower Zone 1",
    },
  ]
  assert.deepEqual(buildDisplayNames(scenarios, locations), {
    scenarios: {
      s0020: "Current operations",
      s0030: "SGMA, San Joaquin pumping limits",
    },
    locations: { "24_NU2": "Placer County WA lower Zone 1" },
  })
})

test("buildDisplayNames rejects two different names for one code", () => {
  assert.throws(
    () =>
      buildDisplayNames(
        [],
        [
          {
            code_do_not_edit: "24_NU2",
            display_name_TED_EDITS: "A",
          },
          {
            code_do_not_edit: "24_NU2",
            display_name_TED_EDITS: "B",
          },
        ],
      ),
    /24_NU2/,
  )
})

test("parseTableLiteral reads prettier-formatted modules: bare keys, quoted keys, trailing commas", () => {
  const src = `/** header */
export const DISPLAY_NAME_TABLE: {
  scenarios: Record<string, string>
  locations: Record<string, string>
} = {
  scenarios: { s0020: "Current operations" },
  locations: {
    "24_NU2": "Placer County WA, lower Zone 1",
    MWD: "Metropolitan",
  },
}
`
  assert.deepEqual(parseTableLiteral(src), {
    scenarios: { s0020: "Current operations" },
    locations: {
      "24_NU2": "Placer County WA, lower Zone 1",
      MWD: "Metropolitan",
    },
  })
})

// The CLI writes the TypeScript table module and reads it back on the next
// run, so a scenarios-only import keeps the location names and vice versa.
import { execFileSync } from "node:child_process"
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

test("import.mjs round-trips the table module", () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const table = join(
    here,
    "../../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/displayNames.table.ts",
  )
  const backup = readFileSync(table, "utf8")
  const dir = mkdtempSync(join(tmpdir(), "did-names-"))
  writeFileSync(
    join(dir, "locations.csv"),
    'code_do_not_edit,display_name_TED_EDITS\n24_NU2,"Placer County WA, lower Zone 1"\nMWD,\n',
  )
  writeFileSync(
    join(dir, "scenarios.csv"),
    "site_scenario_id_do_not_edit,data_in_depth_prose_name_TED_EDITS\ns0020,Current operations\n",
  )
  try {
    execFileSync(
      "node",
      [join(here, "import.mjs"), "--locations", join(dir, "locations.csv")],
      { stdio: "pipe" },
    )
    execFileSync(
      "node",
      [join(here, "import.mjs"), "--scenarios", join(dir, "scenarios.csv")],
      { stdio: "pipe" },
    )
    const src = readFileSync(table, "utf8")
    assert.match(src, /"24_NU2": "Placer County WA, lower Zone 1"/)
    assert.match(src, /\bs0020: "Current operations"/)
    assert.doesNotMatch(src, /"MWD"/)
  } finally {
    writeFileSync(table, backup)
  }
})
