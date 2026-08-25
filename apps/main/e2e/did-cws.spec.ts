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
  NOD_CWS: { delivery: 350, shortage_total: 42, shortage_pct: 6.5 },
  SOD_CWS: { delivery: 2000, shortage_total: 77, shortage_pct: 12 },
  // One delivery-only system, one shortage-only system, and one in both
  // families, so a subject requested outside its family is detectable.
  MWD: { delivery: 1134 },
  "02_NU": { shortage_total: 9, shortage_pct: 4 },
  "26N_NU1": { delivery: 20, shortage_total: 3, shortage_pct: 2.5 },
}

function cwsPayload(subjectsCsv: string, measuresCsv: string) {
  const measures = measuresCsv ? measuresCsv.split(",") : ["delivery"]
  const subjects = subjectsCsv.split(",").map((code) => ({
    subject: code,
    kind: "aggregate",
    label: code,
    periods: {
      annual: Object.fromEntries(
        measures.map((measure) => [
          measure,
          {
            unit: measure === "shortage_pct" ? "PCT_SHORTAGE" : "TAF",
            values: Array.from({ length: 20 }, (_, i) => ({
              water_year: 1922 + i,
              value: VALUE_BY_SUBJECT_MEASURE[code]?.[measure] ?? 1,
            })),
          },
        ]),
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
  // so scope to the list that carries the unique "Delivery shortages".
  const cwsList = page
    .getByRole("list")
    .filter({ has: page.getByRole("button", { name: "Delivery shortages" }) })

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
  await cwsList.getByRole("button", { name: "Delivery shortages" }).click()
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
  // so scope to the list that carries the unique "Delivery shortages".
  const cwsList = page
    .getByRole("list")
    .filter({ has: page.getByRole("button", { name: "Delivery shortages" }) })

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
  await cwsList.getByRole("button", { name: "Delivery shortages" }).click()
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
    .filter({ has: page.getByRole("button", { name: "Delivery shortages" }) })
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
  await cwsList.getByRole("button", { name: "Delivery shortages" }).click()
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
  await cwsList.getByRole("button", { name: "Delivery shortages" }).click()
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
