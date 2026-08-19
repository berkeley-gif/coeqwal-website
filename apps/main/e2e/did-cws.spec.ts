import { test, expect } from "@playwright/test"
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

test("cws variables fetch their per-variable measures and go live", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  const requested: Array<{ subjects: string; measures: string }> = []
  await page.route("**/api/data-in-depth/cws*", (route) => {
    const url = new URL(route.request().url())
    const subjects = url.searchParams.get("subjects") ?? ""
    const measures = url.searchParams.get("measures") ?? ""
    requested.push({ subjects, measures })
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
