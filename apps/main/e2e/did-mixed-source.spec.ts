import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Mixed live/sample provenance, end to end and offline.
//
// Some scenarios are not modeled for some variables: there are no salmon
// results for the Delta Conveyance Project scenarios, and there never will
// be. The endpoint answers 200 with an EMPTY scenarios array for those, which
// the site previously could not distinguish from any other live response, so
// the member quietly fell back to the sample engine and drew a curve under a
// chart-level "Live data" badge.
//
// Detection is response-driven rather than an id list, because the DCP family
// spans one short_code per hydroclimate (s0065, s0085, s0105, s0131, s0157)
// and only one of those appears in site content today. This spec pins that:
// BOTH scenarios must be requested, and the served-nothing one must be
// recognized from its response, not from its name.

const SCENARIOS_FIXTURE = [
  {
    name: "Current operations",
    short_code: "s0020",
    short_description: "spec fixture",
    is_active: true,
    hydroclimate_id: 2,
    sibling_group: "s0020",
  },
  {
    name: "DWR 2025 DCP",
    short_code: "s0065",
    short_description: "spec fixture, no salmon results",
    is_active: true,
    hydroclimate_id: 2,
    sibling_group: "s0065",
  },
]

const SALMON_VALUE = 55

function salmonPayload(scenario: string) {
  // The Delta Conveyance Project scenario is not modeled for salmon: the
  // endpoint returns an empty scenarios array, NOT a block of nulls.
  if (scenario !== "s0020") return { wyt_filter: null, scenarios: [] }
  return {
    wyt_filter: null,
    scenarios: [
      {
        scenario,
        n_years: 20,
        subjects: [
          {
            subject: "WRLCM_ADULT_FEMALES",
            kind: "entity",
            label: "Winter-run adult females",
            periods: {
              annual: {
                NOF_3YR_AVG: {
                  unit: "PCT",
                  values: Array.from({ length: 20 }, (_, i) => ({
                    water_year: 1922 + i,
                    value: SALMON_VALUE,
                  })),
                },
              },
            },
          },
        ],
      },
    ],
  }
}

/**
 * Installs the offline fixtures this spec needs and returns the live log of
 * scenario short_codes the salmon endpoint was asked for. Side effects:
 * registers page routes for the scenario list, the salmon endpoint, the
 * reservoir-storage endpoint the default variable hits on tab open, and the
 * two tiers calls the explorer fires when it opens.
 */
async function setupSalmonRoutes(page: Page): Promise<string[]> {
  const requestedScenarios: string[] = []
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  await page.route("**/api/data-in-depth/salmon*", (route) => {
    const scenario =
      new URL(route.request().url()).searchParams.get("scenarios") ?? ""
    requestedScenarios.push(scenario)
    return route.fulfill({ json: salmonPayload(scenario) })
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
  return requestedScenarios
}

test("a scenario with no served block is detected from its response, not its id", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requestedScenarios = await setupSalmonRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await page.getByRole("button", { name: /Winter-run abundance/ }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()

  // Add the Delta Conveyance Project scenario to the comparison. The chart
  // now holds one scenario the endpoint serves and one it does not.
  await page
    .getByLabel("Select DWR 2025 DCP scenario")
    .check({ timeout: 10_000 })

  // The substance: the site asks for BOTH scenarios and learns the second has
  // nothing from the ANSWER. A hardcoded id list would have skipped the
  // request entirely, and would miss the DCP siblings under other
  // hydroclimates.
  await expect
    .poll(() => requestedScenarios.some((s) => s.includes("s0020")))
    .toBe(true)
  await expect
    .poll(() => requestedScenarios.some((s) => s.includes("s0065")))
    .toBe(true)

  // Both scenarios keep a legend entry: silently dropping one the user chose
  // to compare reads as data loss, and this case needs an explanation rather
  // than an absence.
  await expect(page.getByText("Current operations").first()).toBeVisible()
  await expect(page.getByText("DWR 2025 DCP").first()).toBeVisible()

  // The served-nothing member is labeled "no data", carrying the registry's
  // explanation, and the served one is NOT labeled.
  const noData = page.getByText("no data", { exact: true })
  await expect(noData).toHaveCount(1)
  await expect(noData).toHaveAttribute(
    "aria-label",
    /not modeled for Delta Conveyance Project/i,
  )

  // The chart-level caption stops claiming the whole figure is live.
  await expect(
    page.getByText(/for 1 of 2 series; see the legend/),
  ).toBeVisible()

  // The substance of the honesty pass: TWO members are legended but only ONE
  // curve is drawn. The sample engine always produces a series, so without
  // this the chart would draw an invented curve for a scenario the model has
  // no results for, under a badge reading "Live data". Exceedance curves are
  // the only stroke-width-2 unfilled paths in the plot.
  const curves = page.locator('svg path[stroke-width="2"][fill="none"][stroke]')
  await expect.poll(() => curves.count()).toBe(1)

  expect(errors).toEqual([])
})
