import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Community-water-systems live path, end to end and offline. Same technique
// as did-sysdel.spec.ts: inline route fixtures layered over the HAR harness
// (later routes win). Covers the measure-keyed cws domain: both variables
// read the same endpoint but different measures, and the shortage variable
// switches measures per view (shortage_total for the TAF volume view,
// shortage_pct for the percent-of-demand view).

const SCENARIOS_FIXTURE = [
  {
    name: "Current operations",
    short_code: "s0020",
    short_description: "spec fixture",
    is_active: true,
    hydroclimate_id: 2,
    sibling_group: "s0020",
  },
]

// Distinct value per (subject, measure) so a wrong subject or measure
// mapping would draw the wrong (detectable) series.
const VALUE_BY_SUBJECT_MEASURE: Record<string, Record<string, number>> = {
  NOD_CWS: {
    delivery: 350,
    pct_demand_met: 93.5,
    shortage_total: 42,
    shortage_pct: 6.5,
  },
  SOD_CWS: {
    delivery: 2000,
    pct_demand_met: 88,
    shortage_total: 77,
    shortage_pct: 12,
  },
  // One delivery-only system, one shortage-only system, and one in both
  // families, so a subject requested outside its family is detectable.
  MWD: { delivery: 1134, pct_demand_met: 100 },
  "02_NU": { shortage_total: 9, shortage_pct: 4, welfare_loss: 28000 },
  "26N_NU1": {
    delivery: 20,
    pct_demand_met: 97.5,
    shortage_total: 3,
    shortage_pct: 2.5,
  },
}
// Welfare loss is served in USD; the aggregates are millions, an entity
// tens of thousands. Both must read correctly in $M.
VALUE_BY_SUBJECT_MEASURE.NOD_CWS!.welfare_loss = 2551000
VALUE_BY_SUBJECT_MEASURE.SOD_CWS!.welfare_loss = 3280000

// A subject the endpoint serves in most scenarios but not this one (KCWA is
// absent from the Delta Conveyance Project family): the block exists and
// simply lacks the subject.
const ABSENT_SUBJECT = "ACFC"

function cwsPayload(subjectsCsv: string, measuresCsv: string) {
  const measures = measuresCsv ? measuresCsv.split(",") : ["delivery"]
  const subjects = subjectsCsv
    .split(",")
    .filter((code) => code !== ABSENT_SUBJECT)
    .map((code) => ({
      subject: code,
      kind: "aggregate",
      label: code,
      periods: {
        annual: Object.fromEntries(
          measures.map((measure) => {
            const full = VALUE_BY_SUBJECT_MEASURE[code]?.[measure] ?? 1
            // The delivery family is calendar-year and served with a
            // three-month 1921 stub and a nine-month 2021 stub, at about
            // 0.2 and 0.8 of a full year; the site must drop both.
            const values =
              measure === "delivery"
                ? [
                    { water_year: 1921, value: full * 0.2 },
                    ...Array.from({ length: 20 }, (_, i) => ({
                      water_year: 1922 + i,
                      value: full,
                    })),
                    { water_year: 2021, value: full * 0.8 },
                  ]
                : Array.from({ length: 20 }, (_, i) => ({
                    water_year: 1922 + i,
                    value: full,
                  }))
            return [
              measure,
              {
                unit:
                  measure === "pct_demand_met"
                    ? "PCT_DEMAND_MET"
                    : measure === "shortage_pct"
                      ? "PCT_SHORTAGE"
                      : measure === "welfare_loss"
                        ? "USD"
                        : "TAF",
                values,
              },
            ]
          }),
        ),
      },
    }))
  return {
    wyt_filter: null,
    scenarios: [{ scenario: "s0020", n_years: 20, subjects }],
  }
}

/** One observed cws data-in-depth request: parsed params plus the raw URL. */
type CwsRequest = { subjects: string; measures: string; url: string }

/**
 * Installs every offline route fixture this spec needs and returns the live
 * log of cws data-in-depth requests observed so far. Side effects: registers
 * page routes for the scenario list, the cws endpoint, the reservoir-storage
 * endpoint the default variable hits on tab open, and the two tiers calls the
 * explorer fires when it opens.
 */
async function setupCwsRoutes(page: Page): Promise<CwsRequest[]> {
  const requested: CwsRequest[] = []
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  await page.route("**/api/data-in-depth/cws*", (route) => {
    const raw = route.request().url()
    const params = new URL(raw).searchParams
    const subjects = params.get("subjects") ?? ""
    const measures = params.get("measures") ?? ""
    requested.push({ subjects, measures, url: raw })
    return route.fulfill({ json: cwsPayload(subjects, measures) })
  })
  // The default variable (April reservoir storage) fetches live on tab open
  // once a real scenario list resolves; serve it a minimal payload so the
  // harness stays offline without console errors.
  await page.route("**/api/data-in-depth/reservoir-storage*", (route) =>
    route.fulfill({
      json: {
        wyt_filter: null,
        scenarios: [
          {
            scenario: "s0020",
            n_years: 20,
            reservoirs: [
              {
                subject: "SHSTA",
                kind: "entity",
                label: "Shasta",
                periods: {
                  april: {
                    TAF: {
                      values: Array.from({ length: 20 }, (_, i) => ({
                        water_year: 1922 + i,
                        value: 4000,
                      })),
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    }),
  )
  await page.route("**/api/tiers/batch*", (route) =>
    route.fulfill({ json: { scenarios: {}, count: 0 } }),
  )
  await page.route("**/api/tiers/scenarios/*/locations*", (route) => {
    const id =
      route
        .request()
        .url()
        .match(/tiers\/scenarios\/([^/]+)\//)?.[1] ?? ""
    return route.fulfill({ json: { scenario: id, results: {}, missing: [] } })
  })
  return requested
}

test("cws variables fetch their per-variable measures and go live", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupCwsRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()

  // "Surface water deliveries" also exists in the Agricultural water sector,
  // so scope to the list that carries the unique "Municipal supply shortages".
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })

  // Deliveries: the default pinned location is the group's first entry
  // (All North of Delta) -> subject NOD_CWS, measure delivery.
  await cwsList
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "NOD_CWS" && r.measures === "delivery",
      ),
    )
    .toBe(true)
  // The adopted live value renders in TAF (guards the measure-keyed
  // response path for the domain).
  await expect(page.getByText(/350 TAF/).first()).toBeVisible()

  // Location switch: the SOD aggregate resolves to its own subject.
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  await page.getByRole("option", { name: "All South of Delta" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "SOD_CWS" && r.measures === "delivery",
      ),
    )
    .toBe(true)

  // Shortages, volume view (default): the SAME endpoint serves a different
  // measure for this variable; the SOD pin persists per location group.
  await cwsList
    .getByRole("button", { name: "Municipal supply shortages" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "SOD_CWS" && r.measures === "shortage_total",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/77(\.0)? TAF/).first()).toBeVisible()
  // The scope-settled variable carries no provisional chip on the chart.
  await expect(page.getByText(/^Provisional$/)).toHaveCount(0)

  // Percent-of-demand view: switches to the served shortage_pct measure,
  // and the unit follows the view.
  await page.getByRole("button", { name: "% of demand", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "SOD_CWS" && r.measures === "shortage_pct",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/12(\.0+)? %/).first()).toBeVisible()

  expect(errors).toEqual([])
})

// Water-year-type opt-out (2026-08-20 team ruling): the CWS series are
// aggregated by calendar year upstream, so the filter cannot apply to them.
// The registry flag is asserted in did-registry.spec.ts; this is the browser
// half - the chip row goes not-applicable, and, the substance, no cws request
// carries `wyt=` even when a class is selected on the way in from a variable
// the filter DOES apply to.
test("cws variables disable the water-year-type row and never send wyt", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupCwsRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()

  // Select a class on the default variable (April reservoir storage), which
  // the filter applies to. The stored selection stays inert, not cleared,
  // when we switch to CWS - which is exactly what could leak into a request.
  await page.getByRole("button", { name: "Critical", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Critical", exact: true, pressed: true }),
  ).toBeVisible()

  // "Surface water deliveries" also exists in the Agricultural water sector,
  // so scope to the list that carries the unique "Municipal supply shortages".
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })

  const expectChipsNotApplicable = async () => {
    await expect(
      page.getByText("Not applicable to this variable"),
    ).toBeVisible()
    // Disabled chips drop out of the button role entirely.
    for (const label of [
      "All years",
      "Wet",
      "Above normal",
      "Below normal",
      "Dry",
      "Critical",
    ]) {
      await expect(
        page.getByRole("button", { name: label, exact: true }),
      ).toHaveCount(0)
    }
  }

  await cwsList
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requested.some((r) => r.measures === "delivery"))
    .toBe(true)
  await expectChipsNotApplicable()

  // Shortages, volume view.
  await cwsList
    .getByRole("button", { name: "Municipal supply shortages" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requested.some((r) => r.measures === "shortage_total"))
    .toBe(true)
  await expectChipsNotApplicable()

  // Shortages, percent-of-demand view.
  await page.getByRole("button", { name: "% of demand", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requested.some((r) => r.measures === "shortage_pct"))
    .toBe(true)
  await expectChipsNotApplicable()

  // No CWS request carried the filter, in any variable or view.
  expect(requested.length).toBeGreaterThan(0)
  expect(requested.filter((r) => r.url.includes("wyt="))).toEqual([])

  expect(errors).toEqual([])
})

// Entity-level systems: deliveries and shortages read different, overlapping
// system sets, so each variable offers its own list. A pinned system carries
// over to the other variable only when it exists there; otherwise the pin
// heals to the aggregate rather than requesting a subject the endpoint does
// not serve for that measure.
test("cws systems are pickable per measure family and pins carry over only when shared", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupCwsRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })
  await cwsList
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()

  // A delivery-only system.
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  await page
    .getByRole("option", {
      name: "MWD - Metropolitan Water District of Southern California",
    })
    .click()
  await expect
    .poll(() =>
      requested.some((r) => r.subjects === "MWD" && r.measures === "delivery"),
    )
    .toBe(true)
  await expect(page.getByText(/1,134 TAF/).first()).toBeVisible()

  // Shortages do not serve MWD: the pin heals to the aggregate and the
  // request never names MWD.
  await cwsList
    .getByRole("button", { name: "Municipal supply shortages" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "NOD_CWS" && r.measures === "shortage_total",
      ),
    )
    .toBe(true)
  expect(
    requested.some((r) => r.subjects === "MWD" && r.measures !== "delivery"),
  ).toBe(false)
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  // A shortage-only system is offered here and not on deliveries.
  await page
    .getByRole("option", { name: "02_NU - Anderson City of Anderson" })
    .click()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "02_NU" && r.measures === "shortage_total",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/9(\.00)? TAF/).first()).toBeVisible()

  // Back on deliveries the group's own pin (MWD) still stands: the shortage
  // pick does not exist there, so nothing carried over.
  await cwsList
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await page
    .getByRole("combobox")
    .filter({ hasText: "MWD - Metropolitan Water District" })
    .click()
  await expect(
    page.getByRole("option", { name: "02_NU - Anderson City of Anderson" }),
  ).toHaveCount(0)
  await page.getByRole("option", { name: /^26N_NU1 - / }).click()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "26N_NU1" && r.measures === "delivery",
      ),
    )
    .toBe(true)
  await cwsList
    .getByRole("button", { name: "Municipal supply shortages" })
    .click()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "26N_NU1" && r.measures === "shortage_total",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/3(\.00)? TAF/).first()).toBeVisible()

  expect(errors).toEqual([])
})

// The delivery series is trimmed to full calendar years before anything is
// computed from it: the exported table starts at 1922, ends at 2020, and is
// headed "Calendar year"; a stub year never reaches the min, mean or CV.
test("cws deliveries drop the partial calendar years and export calendar-year rows", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await setupCwsRoutes(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })
  await cwsList
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  // Stats: with every full year at 350 the mean is exactly 350 only when the
  // 70 and 280 stubs are gone.
  await page.getByRole("button", { name: "Stats", exact: true }).click()
  await expect(page.getByText("Mean (TAF)")).toBeVisible()
  await expect(page.getByText(/350 TAF/).first()).toBeVisible()

  await page.getByRole("button", { name: "Exceedance", exact: true }).click()
  await page.getByRole("button", { name: "save snapshot" }).click()
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  const addToStory = page.getByRole("button", { name: "Add to story" })
  await expect(addToStory).toBeVisible()
  await addToStory.click()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download data" }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  const csv = Buffer.concat(chunks).toString("utf8")
  expect(csv).toContain("Calendar year,")
  expect(csv).not.toContain("Water year,")
  const years = csv
    .split("\n")
    .map((l) => l.split(",")[0] ?? "")
    .filter((c) => /^\d{4}$/.test(c))
    .map(Number)
  expect(Math.min(...years)).toBe(1922)
  expect(Math.max(...years)).toBe(1941)
  expect(years).not.toContain(1921)
  expect(errors).toEqual([])
})

// A served block without the requested subject is "not modeled for this
// scenario", shown as the no-data member, never as a sample curve.
test("a subject absent from a served block is reported as no data, not sample", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await setupCwsRoutes(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })
  await cwsList
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  await page.getByRole("option", { name: /^ACFC/ }).click()
  await expect(page.getByText("no data", { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/^Sample data$/)).toHaveCount(0)
  expect(errors).toEqual([])
})

// Welfare loss: served in USD on the shortage-modeled systems, displayed in
// millions of dollars per year, no water-year-type filter, and a sentence
// that reports the no-loss year count and the mean rather than a median.
test("welfare loss reads the welfare_loss measure and displays millions of dollars", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupCwsRoutes(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })
  await cwsList.getByRole("button", { name: "Welfare loss" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "NOD_CWS" && r.measures === "welfare_loss",
      ),
    )
    .toBe(true)
  expect(requested.some((r) => r.url.includes("wyt="))).toBe(false)
  await expect(page.getByText("Not applicable to this variable")).toHaveCount(1)
  // 2,551,000 USD reads as $2.55 M in the sentence.
  await expect(page.getByText(/mean annual loss of \$2\.55 M/)).toBeVisible()
  await expect(page.getByText(/^Provisional$/)).toHaveCount(0)

  // An entity at tens of thousands of dollars keeps its digits.
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  await page
    .getByRole("option", { name: "02_NU - Anderson City of Anderson" })
    .click()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "02_NU" && r.measures === "welfare_loss",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/mean annual loss of \$0\.028 M/)).toBeVisible()

  // Stats: mean and CV from the same scaled series.
  await page.getByRole("button", { name: "Stats", exact: true }).click()
  await expect(page.getByText("Mean ($M)")).toBeVisible()
  await expect(
    page.getByText(/^Mean welfare loss for .+ is \$0\.028 M\./),
  ).toBeVisible()
  expect(errors).toEqual([])
})

// Surface water delivery shortage (2026-08-26, project lead and CWS team):
// derived on the site as 100 minus the served pct_demand_met measure on the
// delivery family, carrying the Community deliveries key-outcome chip. The
// relabeled Municipal supply shortages keeps its series and loses that chip.
test("surface water delivery shortage derives 100 minus percent met from the served delivery family", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupCwsRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  const cwsList = page
    .getByRole("list")
    .filter({
      has: page.getByRole("button", { name: "Municipal supply shortages" }),
    })

  await cwsList
    .getByRole("button", { name: "Surface water delivery shortage" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "NOD_CWS" && r.measures === "pct_demand_met",
      ),
    )
    .toBe(true)
  // NOD aggregate: 100 - 93.5 = 6.5, printed with one decimal under 10.
  await expect(page.getByText(/6\.5 %/).first()).toBeVisible()
  await expect(
    page.getByText(/key outcome: Community surface water/),
  ).toBeVisible()
  await expect(page.getByText(/^Provisional$/)).toHaveCount(0)

  // The relabeled Municipal supply shortages: same series as before, no chip.
  await cwsList
    .getByRole("button", { name: "Municipal supply shortages" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByText(/42(\.0)? TAF/).first()).toBeVisible()
  await expect(
    page.getByText(/key outcome: Community surface water/),
  ).toHaveCount(0)

  expect(errors).toEqual([])
})
