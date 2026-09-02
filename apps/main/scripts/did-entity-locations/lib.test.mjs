// Unit tests for the Data in Depth entity-location generator, runnable with
// `node --test`. Pure functions only; the CLI's fetch and file writes are
// exercised by generate.test.mjs against synthetic payloads.

import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildLocationDefs,
  cleanServedLabel,
  compareEntityCodes,
  entityDisplayName,
  renderGeneratedModule,
  stripGeneratedHeader,
  truncateAtWordBoundary,
} from "./lib.mjs"

// --- label cleaning ---------------------------------------------------------
// The served CWS labels are "<community> <system> <PWS id>" strings from a
// table extraction. The cleaner removes exactly three artifact shapes and
// nothing else: bare 5 to 7 digit public-water-system ids, footnote digits
// glued to a lowercase word end, and bullet markers.

test("cleanServedLabel strips a trailing public-water-system id", () => {
  assert.equal(
    cleanServedLabel("Anderson City of Anderson 4510001"),
    "Anderson City of Anderson",
  )
  assert.equal(
    cleanServedLabel("Arbuckle Arbuckle PUD 610001"),
    "Arbuckle Arbuckle PUD",
  )
  assert.equal(
    cleanServedLabel(
      "Berkeley, Oakland, Richmond, Walnut Creek25 East Bay Municipal Utility District 11005",
    ),
    "Berkeley, Oakland, Richmond, Walnut Creek East Bay Municipal Utility District",
  )
})

test("cleanServedLabel strips footnote digits glued to a lowercase word", () => {
  assert.equal(
    cleanServedLabel("Napa City of Napa16 2810003"),
    "Napa City of Napa",
  )
  assert.equal(
    cleanServedLabel("San Juan Retail Service Area11 San Juan WD 3410021"),
    "San Juan Retail Service Area San Juan WD",
  )
  assert.equal(
    cleanServedLabel(
      "Bay Point, Clayton, Clyde, Concord, Oakley, Pittsburg, Port Costa24 Contra Costa Water District 710003",
    ),
    "Bay Point, Clayton, Clyde, Concord, Oakley, Pittsburg, Port Costa Contra Costa Water District",
  )
})

test("cleanServedLabel strips bullet markers and mid-string ids, collapsing spaces", () => {
  assert.equal(
    cleanServedLabel(
      "Loomis, Newcastle Placer County WA - lower Zone 1 3110025 •8 •7 Bear River Canal Lincoln (Placer County WA) 3110004",
    ),
    "Loomis, Newcastle Placer County WA - lower Zone 1 Bear River Canal Lincoln (Placer County WA)",
  )
})

test("cleanServedLabel leaves codes, short numbers and percentages alone", () => {
  for (const label of [
    "Shasta CSA No. 6 Jones Valley CSA2",
    "Westlands WD Priority Area I, DD No. 2",
    "Placer County WA Zone 1",
    "Glenn-Colusa ID (55% of total)",
    "Merced ID (3.5% of total, north of Merced River)",
    "Non-district",
    "RD 108, River Garden Farms, misc. settlement contractors",
  ]) {
    assert.equal(cleanServedLabel(label), label)
  }
})

// --- display names ----------------------------------------------------------

test("entityDisplayName prefixes the code and keeps a bare code when unlabeled", () => {
  assert.equal(
    entityDisplayName("08N_SA2", "Glenn-Colusa ID (55% of total)"),
    "08N_SA2 - Glenn-Colusa ID (55% of total)",
  )
  assert.equal(entityDisplayName("KCWA", "KCWA"), "KCWA")
  assert.equal(entityDisplayName("KCWA", ""), "KCWA")
})

// --- ordering ---------------------------------------------------------------

test("compareEntityCodes orders numeric water-budget-area codes naturally, then names", () => {
  const codes = [
    "MWD",
    "90_PA1",
    "08N_SA2",
    "02_NA",
    "07S_NA",
    "07N_PA",
    "10_NA",
    "ACFC",
    "08S_NA1",
  ]
  assert.deepEqual([...codes].sort(compareEntityCodes), [
    "02_NA",
    "07N_PA",
    "07S_NA",
    "08N_SA2",
    "08S_NA1",
    "10_NA",
    "90_PA1",
    "ACFC",
    "MWD",
  ])
})

// --- location defs from a served payload ------------------------------------

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

const SERVED = [
  subject("NOD_CWS", "aggregate", "North of Delta Community Water Systems", {
    delivery: [1, 2, 3],
  }),
  subject(
    "MWD",
    "entity",
    "Metropolitan Water District of Southern California",
    { delivery: [1000, 1200, 1100] },
  ),
  subject("02_NU", "entity", "Anderson City of Anderson 4510001", {
    shortage_total: [0, 0, 0],
  }),
  subject("26N_NU1", "entity", "Northridge Sacramento Suburban WD 3410024", {
    delivery: [10, 30, 20],
    shortage_total: [1, 3, 2],
  }),
]

test("buildLocationDefs keeps entities that carry the primary measure, regions them, and orders NOD before SOD", () => {
  // The region map is per measure family: only the systems served for
  // `delivery` appear in it.
  const defs = buildLocationDefs({
    subjects: SERVED,
    regions: { MWD: "SOD", "26N_NU1": "NOD" },
    primaryMeasure: "delivery",
  })
  assert.deepEqual(defs, [
    {
      id: "26N_NU1",
      name: "26N_NU1 - Northridge Sacramento Suburban WD",
      apiLabel: "Northridge Sacramento Suburban WD 3410024",
      region: "NOD",
      mockBase: 20,
    },
    {
      id: "MWD",
      name: "MWD - Metropolitan Water District of Southern California",
      apiLabel: "Metropolitan Water District of Southern California",
      region: "SOD",
      mockBase: 1100,
    },
  ])
})

test("buildLocationDefs floors a zero median so the sample engine has a magnitude", () => {
  const defs = buildLocationDefs({
    subjects: SERVED,
    regions: { "26N_NU1": "NOD", "02_NU": "NOD" },
    primaryMeasure: "shortage_total",
  })
  assert.deepEqual(
    defs.map((d) => [d.id, d.mockBase]),
    [
      ["02_NU", 0.1],
      ["26N_NU1", 2],
    ],
  )
})

test("buildLocationDefs fails loudly on a served entity with no region", () => {
  assert.throws(
    () =>
      buildLocationDefs({
        subjects: SERVED,
        regions: { MWD: "SOD" },
        primaryMeasure: "delivery",
      }),
    /no region.*26N_NU1/,
  )
})

test("buildLocationDefs fails loudly on a mapped code the API does not serve", () => {
  assert.throws(
    () =>
      buildLocationDefs({
        subjects: SERVED,
        regions: { MWD: "SOD", "26N_NU1": "NOD", GHOST: "NOD" },
        primaryMeasure: "delivery",
      }),
    /not served.*GHOST/,
  )
})

// --- module rendering -------------------------------------------------------

test("renderGeneratedModule emits typed exports and a header the check mode can ignore", () => {
  const source = renderGeneratedModule({
    apiBase: "https://api.example.org",
    scenario: "s0020",
    generatedAt: "2026-08-24T00:00:00Z",
    groups: {
      AG_ENTITY_LOCATIONS: [
        {
          id: "02_NA",
          name: "02_NA - Non-district",
          apiLabel: "Non-district",
          region: "NOD",
          mockBase: 4.4,
        },
      ],
      CWS_DELIVERY_ENTITY_LOCATIONS: [],
      CWS_SHORTAGE_ENTITY_LOCATIONS: [],
    },
  })
  assert.match(
    source,
    /Generated by scripts\/did-entity-locations\/generate\.mjs/,
  )
  assert.match(
    source,
    /import type \{ LocationDef \} from "\.\/variableRegistry"/,
  )
  assert.match(
    source,
    /export const AG_ENTITY_LOCATIONS: readonly LocationDef\[\] = \[/,
  )
  assert.match(
    source,
    /export const AG_ENTITY_IDS: ReadonlySet<string> = new Set\(\s*AG_ENTITY_LOCATIONS\.map\(\(l\) => l\.id\),?\s*\)/,
  )
  assert.match(source, /"02_NA - Non-district"/)
  // The header carries the timestamp; the body does not, so two runs on the
  // same data compare equal once the header is stripped.
  const again = renderGeneratedModule({
    apiBase: "https://api.example.org",
    scenario: "s0020",
    generatedAt: "2027-01-01T00:00:00Z",
    groups: {
      AG_ENTITY_LOCATIONS: [],
      CWS_DELIVERY_ENTITY_LOCATIONS: [],
      CWS_SHORTAGE_ENTITY_LOCATIONS: [],
    },
  })
  const same = renderGeneratedModule({
    apiBase: "https://api.example.org",
    scenario: "s0020",
    generatedAt: "2026-08-24T00:00:00Z",
    groups: {
      AG_ENTITY_LOCATIONS: [],
      CWS_DELIVERY_ENTITY_LOCATIONS: [],
      CWS_SHORTAGE_ENTITY_LOCATIONS: [],
    },
  })
  assert.notEqual(again, same)
  assert.equal(stripGeneratedHeader(again), stripGeneratedHeader(same))
})

// --- bounded display names ----------------------------------------------------
// 46 of the 269 served labels run past 60 characters (one is 206). Names feed
// chips, legends, figure titles and sentence openers, so the generator bounds
// them at a word boundary and keeps the full cleaned text as `longName`.

test("truncateAtWordBoundary keeps short text, cuts long text at a word and never inside parentheses", () => {
  assert.equal(
    truncateAtWordBoundary("Glenn-Colusa ID (55% of total)", 40),
    "Glenn-Colusa ID (55% of total)",
  )
  assert.equal(
    truncateAtWordBoundary(
      "Loomis, Newcastle, Penryn, Rocklin, Granite Bay (Portion), Roseville (Portion) Placer County WA",
      40,
    ),
    "Loomis, Newcastle, Penryn, Rocklin…",
  )
  // A cut that would land inside "(Portion)" moves before the parenthesis.
  assert.equal(
    truncateAtWordBoundary(
      "Loomis, Newcastle, Penryn, Rocklin, Granite Bay (Portion) more",
      55,
    ),
    "Loomis, Newcastle, Penryn, Rocklin, Granite Bay…",
  )
  assert.equal(truncateAtWordBoundary("", 40), "")
})

test("cleanServedLabel normalizes dashes so the code separator stays unique", () => {
  assert.equal(
    cleanServedLabel(
      "Arcade14 Sacramento Suburban WD – SSA (City of Sacramento) 3410001",
    ),
    "Arcade Sacramento Suburban WD, SSA (City of Sacramento)",
  )
  assert.equal(
    cleanServedLabel("Auburn, Bowman Placer County WA – Upper Zone 1 3110005"),
    "Auburn, Bowman Placer County WA, Upper Zone 1",
  )
})

test("buildLocationDefs bounds names and keeps the full text as longName only when cut", () => {
  const long =
    "Loomis, Newcastle, Penryn, Rocklin, Granite Bay (Portion), Roseville (Portion) Placer County WA 3110025"
  const defs = buildLocationDefs({
    subjects: [
      subject("24_NU2", "entity", long, { delivery: [1, 2, 3] }),
      subject(
        "MWD",
        "entity",
        "Metropolitan Water District of Southern California",
        { delivery: [1, 2, 3] },
      ),
    ],
    regions: { "24_NU2": "NOD", MWD: "SOD" },
    primaryMeasure: "delivery",
  })
  assert.equal(
    defs[0].name,
    "24_NU2 - Loomis, Newcastle, Penryn, Rocklin, Granite Bay…",
  )
  assert.equal(
    defs[0].longName,
    "Loomis, Newcastle, Penryn, Rocklin, Granite Bay (Portion), Roseville (Portion) Placer County WA",
  )
  assert.equal(
    defs[1].name,
    "MWD - Metropolitan Water District of Southern California",
  )
  assert.equal(defs[1].longName, undefined)
  for (const d of defs) assert.ok(d.name.length <= 62, d.name)
})
