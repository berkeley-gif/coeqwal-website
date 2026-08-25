import { test, expect, type Page } from "@playwright/test"
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

/**
 * Installs the offline routes this spec needs (scenario list, salmon,
 * groundwater, the default reservoir variable, tiers) and returns the request
 * logs: salmon subjects, groundwater subjects, and the subset of groundwater
 * requests that asked for the level measure.
 */
async function setupGwRoutes(page: Page) {
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
  const gwLevelRequests: string[] = []
  await page.route("**/api/data-in-depth/groundwater-storage*", (route) => {
    const url = new URL(route.request().url())
    const subject = url.searchParams.get("subjects") ?? ""
    gwRequests.push(subject)
    if ((url.searchParams.get("measures") ?? "").includes("level")) {
      gwLevelRequests.push(subject)
    }
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
  return { salmonRequests, gwRequests, gwLevelRequests }
}

test("salmon goes live with the WYT row disabled; groundwater totals and basins go live with level per basin", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const { salmonRequests, gwRequests, gwLevelRequests } =
    await setupGwRoutes(page)

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
  // Proportion display: the endpoint serves percent (fixture 0.8 = 0.8% of
  // habitat), the tool divides by 100 for the proportion chart scale, and
  // the interpretive sentence converts back to percent for prose; the
  // detailed reading renders in the card footer.
  await expect(
    page.getByText(/occupy 0.8% of suitable spawning habitat, at the median/),
  ).toBeVisible()
  await expect(
    page
      .locator('[role="img"]')
      .getByText("Proportion of spawning habitat occupied"),
  ).toBeVisible()
  await expect(
    page.getByText(/lower 20th percentile of model simulations/),
  ).toBeVisible()
  // The above-1.0 sentence was removed from the caption at the science
  // team's request; assert it stays gone so a future caption edit cannot
  // restore it silently.
  await expect(
    page.getByText(/would suggest returning spawners exceed/),
  ).toHaveCount(0)

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
  await page.getByRole("option", { name: "WBA10" }).click()
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
  await page.getByRole("option", { name: "WBA10" }).click()

  // ...but the aggregates serve volume only, so on the Level view the
  // totals cannot be picked (disabled, with the reason on screen) rather
  // than falling back to sample data.
  await page.getByRole("combobox").filter({ hasText: "WBA10" }).click()
  const nodOption = page.getByRole("option", { name: "All North of Delta" })
  await expect(nodOption).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("Escape")
  await expect(
    page.getByText(
      "Groundwater levels are reported per basin; the North and South of Delta totals are volumes.",
    ),
  ).toBeVisible()
  // Back on Volume the totals are pickable again, and once a total is
  // pinned the Level toggle itself is disabled: the tool asks for a basin
  // rather than picking one.
  await page.getByRole("button", { name: "Volume (TAF)" }).click()
  await page.getByRole("combobox").filter({ hasText: "WBA10" }).click()
  await page.getByRole("option", { name: "All North of Delta" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByRole("button", { name: "Level (ft)" })).toBeDisabled()
  await expect(
    page.getByText(
      "Groundwater levels are reported per basin; the North and South of Delta totals are volumes.",
    ),
  ).toBeVisible()
  // No level request was ever made for a total.
  expect(gwLevelRequests.some((s) => s.endsWith("_GroundwaterStorage"))).toBe(
    false,
  )

  expect(errors).toEqual([])
})

// A restored session or a shared link can still carry a groundwater total on
// the Level view. Nothing is rewritten: the chart area shows the reason, no
// level request goes out for the total, and picking a basin recovers.
test("a restored session with a groundwater total on the Level view shows the reason and makes no request", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const { gwLevelRequests } = await setupGwRoutes(page)
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "coeqwal-explorer-tool-sessions-v3",
      JSON.stringify({
        version: 3,
        workspace: {},
        list: {},
        radar: {},
        equity: {},
        resilience: {},
        data: {
          selectedVariableId: "gw_stor",
          view: "level",
          pinnedLocationByGroup: { basins: "AGG_GW_SOD" },
        },
      }),
    )
  })
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(
    page
      .getByText(
        "Groundwater levels are reported per basin; the North and South of Delta totals are volumes.",
      )
      .first(),
  ).toBeVisible()
  await expect(page.getByText(/^Sample data$/)).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeDisabled()
  expect(gwLevelRequests).toEqual([])
  // Picking a basin recovers the live level view.
  await page
    .getByRole("combobox")
    .filter({ hasText: "All South of Delta" })
    .click()
  await page.getByRole("option", { name: "WBA10" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByText(/180 ft/).first()).toBeVisible()
  expect(errors).toEqual([])
})
