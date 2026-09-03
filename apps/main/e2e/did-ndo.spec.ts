import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Delta outflow live path, end to end and offline. Same technique as
// did-cws.spec.ts: inline route fixtures layered over the HAR harness (later
// routes win).
//
// Delta outflow borrows the RIVER domain (the delta domain serves X2 only):
// the modeling team confirmed the CalSim C_SAC000 channel as the outflow
// series, and the endpoint serves it as the bare subject code SAC000. The
// two things worth pinning in a browser are that the request asks for that
// subject, and that the displayed value comes from the ANNUAL period rather
// than any other period in the same response.

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

const ANNUAL_TAF = 12345
// A decoy period in the same response block. If the mapping ever read the
// wrong period, the chart would show this number instead.
const DECOY_TAF = 999

function constantValues(value: number) {
  return Array.from({ length: 20 }, (_, i) => ({
    water_year: 1922 + i,
    value,
  }))
}

function riverPayload(subjectsCsv: string) {
  const rivers = subjectsCsv.split(",").map((code) => ({
    subject: code,
    kind: "entity",
    label: code,
    periods: {
      annual: { TAF: { unit: "TAF", values: constantValues(ANNUAL_TAF) } },
      april: { TAF: { unit: "TAF", values: constantValues(DECOY_TAF) } },
    },
  }))
  return {
    wyt_filter: null,
    scenarios: [{ scenario: "s0020", n_years: 20, rivers }],
  }
}

test("delta outflow fetches the SAC000 river series and goes live on the annual view", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  const riverUrls: string[] = []
  await page.route("**/api/data-in-depth/river-flows*", (route) => {
    const raw = route.request().url()
    riverUrls.push(raw)
    const subjects = new URL(raw).searchParams.get("subjects") ?? ""
    return route.fulfill({ json: riverPayload(subjects) })
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
                periods: { april: { TAF: { values: constantValues(4000) } } },
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

  await page.getByRole("button", { name: "Delta outflow volume" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()

  // The request carries the remapped subject, not the registry location id.
  await expect.poll(() => riverUrls.length).toBeGreaterThan(0)
  expect(riverUrls.some((u) => u.includes("subjects=SAC000"))).toBe(true)
  expect(riverUrls.some((u) => u.includes("DELTA"))).toBe(false)

  // The annual period feeds the display, not the decoy period in the same
  // response block.
  await expect(page.getByText(/12,345 TAF/).first()).toBeVisible()
  await expect(page.getByText(/999 TAF/)).toHaveCount(0)

  // The registry lists a monthly view for this variable, but ViewBar and
  // SectorRail both filter "monthly" out, so the annual distribution is the
  // only view the UI offers - and a single-view variable renders no view
  // tabs at all (a one-tab strip offers no choice). Pinned here so that if
  // monthly is ever restored, this spec fails and its sample-data labeling
  // gets covered deliberately rather than shipping unlabeled.
  await expect(
    page.getByRole("button", { name: "Monthly pattern" }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Annual distribution" }),
  ).toHaveCount(0)

  // The distribution chart styles all read the same live series.
  await page.getByRole("button", { name: "Box plot" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()

  expect(errors).toEqual([])
})
