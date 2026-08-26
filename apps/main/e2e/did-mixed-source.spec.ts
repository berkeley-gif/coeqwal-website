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
    name: "Delta Conveyance Project",
    short_code: "s0065",
    short_description: "spec fixture, no salmon results",
    is_active: true,
    hydroclimate_id: 2,
    sibling_group: "s0065",
  },
  // The same two strategies under the "Moderate risk" hydroclimate (ecv,
  // API id 7): one variant per climate, as the real listing has.
  {
    name: "Current operations",
    short_code: "s0047",
    short_description: "spec fixture, Moderate risk variant",
    is_active: true,
    hydroclimate_id: 7,
    sibling_group: "s0020",
  },
  {
    name: "Delta Conveyance Project",
    short_code: "s0157",
    short_description: "spec fixture, Moderate risk variant, no salmon results",
    is_active: true,
    hydroclimate_id: 7,
    sibling_group: "s0065",
  },
]

const SALMON_VALUE = 55
/** Served value for the Moderate risk variant of Current operations. */
const SALMON_VALUE_ECV = 40
const SERVED: Record<string, number> = {
  s0020: SALMON_VALUE,
  s0047: SALMON_VALUE_ECV,
}

function salmonPayload(scenario: string) {
  // The Delta Conveyance Project scenarios are not modeled for salmon: the
  // endpoint returns an empty scenarios array, NOT a block of nulls.
  const served = SERVED[scenario]
  if (served == null) return { wyt_filter: null, scenarios: [] }
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
                    value: served,
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
async function setupSalmonRoutes(
  page: Page,
  opts: { delayMsFor?: (scenario: string) => number } = {},
): Promise<string[]> {
  const requestedScenarios: string[] = []
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  await page.route("**/api/data-in-depth/salmon*", async (route) => {
    const scenario =
      new URL(route.request().url()).searchParams.get("scenarios") ?? ""
    requestedScenarios.push(scenario)
    const delay = opts.delayMsFor?.(scenario) ?? 0
    if (delay > 0) await new Promise((r) => setTimeout(r, delay))
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
    .getByLabel("Select Delta Conveyance Project scenario")
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
  await expect(page.getByText("Delta Conveyance Project").first()).toBeVisible()

  // The served-nothing member is labeled "no data", carrying the registry's
  // explanation, and the served one is NOT labeled.
  const noData = page.getByText("no data", { exact: true })
  await expect(noData).toHaveCount(1)
  await expect(noData).toHaveAttribute(
    "aria-label",
    /not available for the Delta Conveyance Project/i,
  )

  // A visible line says the same thing, so the chip is not the only signal.
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /Winter-run salmon data are not available/ }),
  ).toHaveCount(1)

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

  // The header sentence names the unmodeled scenario as having no data rather
  // than quoting the sample engine's stand-in value for it as a real result,
  // and reports the plotted median rather than the arithmetic mean.
  await expect(
    page.getByText(
      /at the median.*no data available for Delta Conveyance Project/,
    ),
  ).toBeVisible()

  expect(errors).toEqual([])
})

test("pinning a hydroclimate other than the workspace climate keeps the scenarios axis live", async ({
  page,
}) => {
  await setupNetwork(page)
  const errors = collectConsoleErrors(page)
  const requestedScenarios = await setupSalmonRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await page.getByRole("button", { name: /Winter-run abundance/ }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await page
    .getByLabel("Select Delta Conveyance Project scenario")
    .check({ timeout: 10_000 })
  await expect(page.getByText("no data", { exact: true })).toHaveCount(1)

  // Pin "Moderate risk" while the workspace stays on Historical. Before this
  // change the whole card dropped to sample data here and drew an invented
  // curve for the DCP scenario under a "Sample data" badge.
  await page
    .getByRole("combobox")
    .filter({ hasText: /^Historical$/ })
    .first()
    .click()
  await page.getByRole("option", { name: "Moderate risk" }).click()

  // Each compared scenario is requested as its Moderate risk variant.
  await expect
    .poll(() => requestedScenarios.some((s) => s.includes("s0047")))
    .toBe(true)
  await expect
    .poll(() => requestedScenarios.some((s) => s.includes("s0157")))
    .toBe(true)

  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByText(/^Sample data$/)).toHaveCount(0)
  await expect(page.getByText("sample", { exact: true })).toHaveCount(0)
  await expect(page.getByText("no data", { exact: true })).toHaveCount(1)
  const curves = page.locator('svg path[stroke-width="2"][fill="none"][stroke]')
  await expect.poll(() => curves.count()).toBe(1)
  // The sentence quotes the Moderate risk variant's served value (40 percent
  // served, shown as a proportion) and still names the unmodeled scenario.
  await expect(
    page.getByText(
      /under the Moderate risk hydroclimate occupy 40%.*no data available for Delta Conveyance Project/,
    ),
  ).toBeVisible()

  // Back to Historical: the Historical variants are requested again.
  await page
    .getByRole("combobox")
    .filter({ hasText: /^Moderate risk$/ })
    .first()
    .click()
  await page.getByRole("option", { name: "Historical" }).click()
  await expect(
    page.getByText(/under the Historical hydroclimate occupy 55%/),
  ).toBeVisible()
  await expect(page.getByText(/^Sample data$/)).toHaveCount(0)

  expect(errors).toEqual([])
})

test("a member whose live request is still in flight is shown as loading, not drawn from sample data", async ({
  page,
}) => {
  await setupNetwork(page)
  const errors = collectConsoleErrors(page)
  // Hold the DCP answer back so the in-flight state is observable.
  await setupSalmonRoutes(page, {
    delayMsFor: (scenario) => (scenario.includes("s0065") ? 2500 : 0),
  })

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await page.getByRole("button", { name: /Winter-run abundance/ }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()

  await page
    .getByLabel("Select Delta Conveyance Project scenario")
    .check({ timeout: 10_000 })

  // While the DCP request is outstanding: one legend entry says "loading",
  // nothing says "sample", and only the served curve is drawn. Before this
  // change the sample engine's stand-in was drawn under a "sample" chip for
  // as long as the endpoint took to answer.
  const curves = page.locator('svg path[stroke-width="2"][fill="none"][stroke]')
  await expect(page.getByText("loading", { exact: true })).toHaveCount(1)
  await expect(page.getByText("sample", { exact: true })).toHaveCount(0)
  expect(await curves.count()).toBe(1)

  // Once the empty answer lands the member becomes "no data".
  await expect(page.getByText("no data", { exact: true })).toHaveCount(1, {
    timeout: 10_000,
  })
  await expect(page.getByText("loading", { exact: true })).toHaveCount(0)
  await expect.poll(() => curves.count()).toBe(1)

  expect(errors).toEqual([])
})
