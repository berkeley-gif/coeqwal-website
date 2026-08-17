import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

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

test("salmon goes live with the WYT row disabled; groundwater aggregates go live while basins stay sample", async ({
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
                kind: "aggregate",
                label: subject,
                periods: {
                  annual: { volume: { values: seriesValues(46000, 20, 1922) } },
                },
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
    page.getByText("Percent of spawning habitat occupied").first(),
  ).toBeVisible()
  await expect(
    page.getByText(/Values above 100% mean returning spawners exceed/),
  ).toBeVisible()

  // Groundwater: the default first basin (Colusa) has no live subject and
  // stays sample; the North-of-Delta aggregate goes live.
  await page.getByRole("button", { name: "Groundwater storage" }).click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()
  await page.getByRole("combobox").filter({ hasText: "Colusa" }).click()
  await page.getByRole("option", { name: "All North of Delta" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => gwRequests.includes("NOD_GroundwaterStorage"))
    .toBe(true)

  expect(errors).toEqual([])
})
