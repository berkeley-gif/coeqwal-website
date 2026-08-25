// End-to-end tests for generate.mjs, runnable with `node --test`. Each case
// runs the CLI as a child process against synthetic API payloads on disk
// (`--from <dir>`), so the fetch path is the only thing not exercised; the
// region check, the file write, the prettier pass and `--check` are real.

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, "generate.mjs")

function subject(code, kind, label, measures) {
  return {
    subject: code,
    kind,
    label,
    periods: {
      annual: Object.fromEntries(
        Object.entries(measures).map(([m, values]) => [
          m,
          {
            unit: "TAF",
            values: values.map((value, i) => ({ water_year: 1922 + i, value })),
          },
        ]),
      ),
    },
  }
}

function payload(subjects) {
  return {
    wyt_filter: null,
    scenarios: [{ scenario: "s0020", n_years: 3, subjects }],
  }
}

function fixtureDir() {
  const dir = mkdtempSync(join(tmpdir(), "did-entities-"))
  writeFileSync(
    join(dir, "ag_s0020.json"),
    JSON.stringify(
      payload([
        subject("NOD_Agriculture", "aggregate", "North of Delta Agriculture", {
          net_diversion: [1, 2, 3],
        }),
        subject("08N_SA2", "entity", "Glenn-Colusa ID (55% of total)", {
          net_diversion: [300, 310, 320],
        }),
        subject("90_PA1", "entity", "Westlands WD Priority Area I, DD No. 2", {
          net_diversion: [600, 620, 640],
        }),
      ]),
    ),
  )
  writeFileSync(
    join(dir, "cws_s0020.json"),
    JSON.stringify(
      payload([
        subject(
          "NOD_CWS",
          "aggregate",
          "North of Delta Community Water Systems",
          { delivery: [1, 2, 3], shortage_total: [1, 2, 3] },
        ),
        subject(
          "MWD",
          "entity",
          "Metropolitan Water District of Southern California",
          { delivery: [1000, 1100, 1200] },
        ),
        subject("02_NU", "entity", "Anderson City of Anderson 4510001", {
          shortage_total: [0, 0, 0],
        }),
        subject(
          "26N_NU1",
          "entity",
          "Northridge Sacramento Suburban WD 3410024",
          { delivery: [10, 20, 30], shortage_total: [1, 2, 3] },
        ),
      ]),
    ),
  )
  writeFileSync(
    join(dir, "regions.json"),
    JSON.stringify({
      ag: { "08N_SA2": "NOD", "90_PA1": "SOD" },
      cwsDelivery: { MWD: "SOD", "26N_NU1": "NOD" },
      cwsShortage: { "02_NU": "NOD", "26N_NU1": "NOD" },
    }),
  )
  return dir
}

function run(args, { expectFailure = false } = {}) {
  try {
    return {
      code: 0,
      out: execFileSync("node", [SCRIPT, ...args], {
        encoding: "utf8",
        stdio: "pipe",
      }),
    }
  } catch (err) {
    if (!expectFailure) throw err
    return { code: err.status, out: `${err.stdout}\n${err.stderr}` }
  }
}

test("generate writes a typed module with every entity of each measure family", () => {
  const dir = fixtureDir()
  const out = join(dir, "entityLocations.generated.ts")
  run(["--from", dir, "--regions", join(dir, "regions.json"), "--out", out])
  const source = readFileSync(out, "utf8")
  assert.match(
    source,
    /Counts: AG_ENTITY_LOCATIONS: 2, CWS_DELIVERY_ENTITY_LOCATIONS: 2, CWS_SHORTAGE_ENTITY_LOCATIONS: 2/,
  )
  assert.match(source, /"08N_SA2 - Glenn-Colusa ID \(55% of total\)"/)
  assert.match(source, /"02_NU - Anderson City of Anderson"/)
  // The delivery family does not contain the shortage-only system and vice
  // versa; the aggregates are never emitted (they are authored by hand).
  const delivery = source.slice(
    source.indexOf("CWS_DELIVERY_ENTITY_LOCATIONS"),
    source.indexOf("CWS_SHORTAGE_ENTITY_LOCATIONS"),
  )
  assert.doesNotMatch(delivery, /"02_NU"/)
  assert.doesNotMatch(source, /NOD_CWS|NOD_Agriculture/)
  // Prettier-clean: a second prettier pass changes nothing.
  const formatted = execFileSync(
    "pnpm",
    ["exec", "prettier", "--stdin-filepath", "x.ts"],
    {
      cwd: join(HERE, "..", ".."),
      input: source,
      encoding: "utf8",
    },
  )
  assert.equal(formatted, source)
})

test("--check passes against an up-to-date file and fails on drift", () => {
  const dir = fixtureDir()
  const out = join(dir, "entityLocations.generated.ts")
  const common = [
    "--from",
    dir,
    "--regions",
    join(dir, "regions.json"),
    "--out",
    out,
  ]
  run(common)
  assert.equal(run([...common, "--check"]).code, 0)
  const tampered = readFileSync(out, "utf8").replace('"MWD"', '"MWD_RENAMED"')
  writeFileSync(out, tampered)
  const result = run([...common, "--check"], { expectFailure: true })
  assert.notEqual(result.code, 0)
  assert.match(result.out, /drift/i)
})

test("a served entity with no region aborts the run with the code named", () => {
  const dir = fixtureDir()
  writeFileSync(
    join(dir, "regions.json"),
    JSON.stringify({
      ag: { "08N_SA2": "NOD" },
      cwsDelivery: { MWD: "SOD", "26N_NU1": "NOD" },
      cwsShortage: { "02_NU": "NOD", "26N_NU1": "NOD" },
    }),
  )
  const result = run(
    [
      "--from",
      dir,
      "--regions",
      join(dir, "regions.json"),
      "--out",
      join(dir, "x.ts"),
    ],
    { expectFailure: true },
  )
  assert.notEqual(result.code, 0)
  assert.match(result.out, /no region.*90_PA1/)
})
