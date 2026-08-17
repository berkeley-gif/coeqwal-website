import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { LOCATION_GROUPS } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"

// Exact served groundwater subjects, derived from the registry (the parity
// spec keeps registry and mapping in agreement, so this mirrors production).
const GW_SERVED_SUBJECTS = new Set(
  LOCATION_GROUPS.basins.items.map((l) =>
    l.aggregate ? `${l.region}_GroundwaterStorage` : l.id,
  ),
)

// Salmon and groundwater live paths, end to end and offline, over inline
// route fixtures (same technique as did-sysdel.spec.ts). Salmon is also the
// first variable carrying wytApplicable: false, so this spec is the UI
// coverage for the WYT opt-out: disabled chip row, not-applicable note, and
// no WYT clause in the figure title.

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

function seriesValues(value: number, years = 20, startYear = 1934) {
  return Array.from({ length: years }, (_, i) => ({
    water_year: startYear + i,
    value,
  }))
}

test("salmon goes live with the WYT row disabled; groundwater totals and basins go live with level per basin", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  const salmonRequests: string[] = []
  await page.route("**/api/data-in-depth/salmon*", (route) => {
    const url = new URL(route.request().url())
    salmonRequests.push(url.searchParams.get("subjects") ?? "")
    return route.fulfill({
      json: {
        wyt_filter: null,
        scenarios: [
          {
            scenario: "s0020",
            n_years: 20,
            subjects: [
              {
                subject: "WRLCM_ADULT_FEMALES",
                kind: "metric",
                label: "Metric of winter-run abundance",
                periods: {
                  annual: { NOF_3YR_AVG: { values: seriesValues(0.8) } },
                },
              },
            ],
          },
        ],
      },
    })
  })
  const gwRequests: string[] = []
  await page.route("**/api/data-in-depth/groundwater-storage*", (route) => {
    const url = new URL(route.request().url())
    const subject = url.searchParams.get("subjects") ?? ""
    gwRequests.push(subject)
    // Mirrors the live endpoint: basin entities serve level and volume,
    // the NOD/SOD aggregates serve volume only. Fail closed on any subject
    // outside the exact served set, so a mistyped or unserved code (WBA99,
    // WBA1) cannot render as live in this spec.
    if (!GW_SERVED_SUBJECTS.has(subject)) {
      return route.fulfill({ status: 422, json: { detail: "unknown subject" } })
    }
    const isAggregate = subject.endsWith("_GroundwaterStorage")
    const units: Record<string, { values: ReturnType<typeof seriesValues> }> = {
      volume: { values: seriesValues(46000, 20, 1922) },
    }
    if (!isAggregate) {
      units.level = { values: seriesValues(180, 20, 1922) }
    }
    return route.fulfill({
      json: {
        wyt_filter: null,
        scenarios: [
          {
            scenario: "s0020",
            n_years: 20,
            subjects: [
              {
                subject,
                kind: isAggregate ? "aggregate" : "entity",
                label: subject,
                periods: { annual: units },
              },
            ],
          },
        ],
      },
    })
  })
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
                  april: { TAF: { values: seriesValues(4000, 20, 1922) } },
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

  // Salmon: sector is unlocked, the variable goes live, and the WYT row is
  // disabled with the not-applicable note (first real wytApplicable: false
  // variable; this is the UI coverage for the opt-out mechanism).
  await page.getByRole("button", { name: /Winter-run abundance/ }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => salmonRequests.includes("WRLCM_ADULT_FEMALES"))
    .toBe(true)
  await expect(page.getByText("Not applicable to this variable")).toBeVisible()
  // Disabled chips drop out of the button role.
  await expect(
    page.getByRole("button", { name: "Wet", exact: true }),
  ).toHaveCount(0)
  // The figure title carries no water-years clause for an opted-out variable.
  await expect(
    page.getByRole("heading", { name: /Winter-run Abundance/ }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: /Water Years/ })).toHaveCount(
    0,
  )
  // Percent display: the fixture serves a 0.8 habitat-occupancy ratio, so the
  // interpretive sentence reads 80% and the y-axis carries the confirmed
  // percent label; the detailed reading renders in the card footer.
  await expect(
    page.getByText(/occupy 80% of suitable spawning habitat, on average/),
  ).toBeVisible()
  await expect(
    page
      .locator('[role="img"]')
      .getByText("Percent of spawning habitat occupied"),
  ).toBeVisible()
  await expect(
    page.getByText(/would suggest returning spawners exceed/),
  ).toBeVisible()

  // Groundwater: the NOD/SOD totals lead the location list, so the default
  // selection is live immediately, and every served basin resolves by its
  // technical code.
  await page.getByRole("button", { name: "Groundwater storage" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => gwRequests.includes("NOD_GroundwaterStorage"))
    .toBe(true)
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  await page.getByRole("option", { name: "WBA10", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect.poll(() => gwRequests.includes("WBA10")).toBe(true)
  // The volume series feeds the summary sentence (fixture serves 46,000).
  await expect(page.getByText(/46,000 TAF/).first()).toBeVisible()

  // The level view is served per basin, so it stays live on a basin, and
  // the LEVEL series (180 ft), not the volume series, feeds the display.
  await page.getByRole("button", { name: "Level (ft)" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByText(/180 ft/).first()).toBeVisible()
  await expect(page.getByText(/46,000 ft/)).toHaveCount(0)

  // The one basin with a served display name resolves and stays live too.
  await page.getByRole("combobox").filter({ hasText: "WBA10" }).click()
  await page.getByRole("option", { name: "Delta-Eastside Water" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect.poll(() => gwRequests.includes("DETAW")).toBe(true)
  await page.getByRole("combobox").filter({ hasText: "Delta-Eastside" }).click()
  await page.getByRole("option", { name: "WBA10", exact: true }).click()

  // ...but the aggregates serve volume only, so their level view falls back
  // to clearly labeled sample data.
  await page.getByRole("combobox").filter({ hasText: "WBA10" }).click()
  await page.getByRole("option", { name: "All North of Delta" }).click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()

  expect(errors).toEqual([])
})
