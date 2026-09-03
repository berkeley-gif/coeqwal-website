import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Climate-futures axis, live path, end to end and offline. The rest of the
// suite rides the committed HAR, whose empty /api/scenarios body keeps id
// resolution empty and every chart on sample data. This spec instead serves
// its own minimal inline fixtures: a scenario list carrying the baseline
// strategy's five hydroclimate variants, and one reservoir-storage response
// per variant id. The routes are registered after setupNetwork, so they win
// for these URLs while the HAR still claims (and aborts) everything else.
// That makes this the one spec that exercises the real live path: id
// resolution, the per-scenario fan-out, live series adoption, and the
// Live/Sample card label.

const HC_VARIANTS = [
  { hydroclimateId: 2, shortCode: "s0020" }, // historical
  { hydroclimateId: 3, shortCode: "s0047" }, // cc50
  { hydroclimateId: 4, shortCode: "s0056" }, // cc95
  { hydroclimateId: 5, shortCode: "s0108" }, // tai
  { hydroclimateId: 7, shortCode: "s0134" }, // ecv
]

const SCENARIOS_FIXTURE = HC_VARIANTS.map((v) => ({
  name: `Current operations (hc ${v.hydroclimateId})`,
  short_code: v.shortCode,
  short_description: "spec fixture",
  is_active: true,
  hydroclimate_id: v.hydroclimateId,
  sibling_group: "s0020",
}))

// Distinct flat series per variant so every climate member draws a visibly
// different live series (and a wrong slot assignment would be detectable).
const VALUE_BY_ID: Record<string, number> = {
  s0020: 4000,
  s0047: 3500,
  s0056: 3000,
  s0108: 2500,
  s0134: 4500,
}

function reservoirPayload(id: string) {
  const value = VALUE_BY_ID[id] ?? 1
  const values = Array.from({ length: 20 }, (_, i) => ({
    water_year: 1922 + i,
    value,
  }))
  return {
    wyt_filter: null,
    scenarios: [
      {
        scenario: id,
        n_years: values.length,
        reservoirs: [
          {
            subject: "SHSTA",
            kind: "entity",
            label: "Shasta",
            periods: { april: { TAF: { values } } },
          },
        ],
      },
    ],
  }
}

test("climate futures axis fetches each hydroclimate variant and goes live", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  const fetchedIds: string[] = []
  await page.route("**/api/data-in-depth/reservoir-storage*", (route) => {
    const url = new URL(route.request().url())
    const id = url.searchParams.get("scenarios") ?? ""
    fetchedIds.push(id)
    return route.fulfill({ json: reservoirPayload(id) })
  })

  // A realistic scenario list wakes the workspace's tier fetches, which the
  // HAR does not carry. Serve shaped empties so the harness stays offline
  // without console errors (the app must tolerate empty tier data anyway).
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

  // Sanity precondition: with a real scenario list, the default scenarios
  // axis already serves live data (baseline resolves to s0020). This half
  // holds before the climates-axis change and pins the fixture wiring.
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  expect(fetchedIds).toContain("s0020")

  // The behavior under test: switching to the climate-futures axis keeps the
  // card live, renders one member per hydroclimate, and fetches every
  // variant id exactly as resolved from the sibling group.
  await page.getByRole("button", { name: "Hydroclimates", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByText(/^Sample data$/)).not.toBeVisible()
  for (const label of [
    "Historical",
    "Moderate stress",
    "Moderate-high stress",
    "High stress",
    "Extreme stress",
  ]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }
  await expect
    .poll(() => new Set(fetchedIds).size, { timeout: 10_000 })
    .toBe(HC_VARIANTS.length)
  expect([...new Set(fetchedIds)].sort()).toEqual(
    HC_VARIANTS.map((v) => v.shortCode).sort(),
  )

  expect(errors).toEqual([])
})
