import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Agriculture live path, end to end and offline. Same technique as
// did-cws.spec.ts: inline route fixtures layered over the HAR harness (later
// routes win). The ag domain is measure-keyed like cws - both variables read
// the same endpoint but different measures - so the fixture gives every
// (subject, measure) pair a DISTINCT value: a wrong subject or a wrong
// measure draws a visibly wrong number rather than silently passing.

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

// Every value is distinct, and the shortage/net_diversion pairs are chosen so
// the DERIVED percent-of-demand lands on a round number that cannot be
// mistaken for either input: NOD 400 / (3,600 + 400) = 10 percent.
const VALUE_BY_SUBJECT_MEASURE: Record<string, Record<string, number>> = {
  NOD_Agriculture: { net_diversion: 3600, gw_pumping: 2200, shortage: 400 },
  SOD_Agriculture: { net_diversion: 4700, gw_pumping: 2600, shortage: 300 },
}

function agPayload(subjectsCsv: string, measuresCsv: string) {
  const measures = measuresCsv ? measuresCsv.split(",") : ["net_diversion"]
  const subjects = subjectsCsv.split(",").map((code) => ({
    subject: code,
    kind: "aggregate",
    label: code,
    periods: {
      annual: Object.fromEntries(
        measures.map((measure) => [
          measure,
          {
            unit: measure === "revenue" ? "USD" : "TAF",
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

/** One observed ag data-in-depth request: parsed params plus the raw URL. */
type AgRequest = { subjects: string; measures: string; url: string }

/**
 * Installs every offline route fixture this spec needs and returns the live
 * log of ag data-in-depth requests observed so far. Side effects: registers
 * page routes for the scenario list, the ag endpoint, the reservoir-storage
 * endpoint the default variable hits on tab open, and the two tiers calls the
 * explorer fires when it opens.
 */
async function setupAgRoutes(page: Page): Promise<AgRequest[]> {
  const requested: AgRequest[] = []
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  await page.route("**/api/data-in-depth/ag*", (route) => {
    const raw = route.request().url()
    const params = new URL(raw).searchParams
    const subjects = params.get("subjects") ?? ""
    const measures = params.get("measures") ?? ""
    requested.push({ subjects, measures, url: raw })
    return route.fulfill({ json: agPayload(subjects, measures) })
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
  return requested
}

test("ag variables fetch their per-variable measures and go live", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupAgRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()

  // "Surface water deliveries" also exists in the community-water-systems
  // sector, so scope to the list that carries the unique "Groundwater
  // pumping".
  const agList = page
    .getByRole("list")
    .filter({ has: page.getByRole("button", { name: "Groundwater pumping" }) })

  // Deliveries: the default pinned location is the group's first entry
  // (All North of Delta) -> subject NOD_Agriculture, measure net_diversion.
  await agList.getByRole("button", { name: "Surface water deliveries" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) =>
          r.subjects === "NOD_Agriculture" && r.measures === "net_diversion",
      ),
    )
    .toBe(true)
  // The adopted live value renders in TAF at the served magnitude. The
  // upstream extraction bug made these read 1000x low; the fix is in the
  // databases and the site applies NO client-side scale, so 3,600 in must be
  // 3,600 out.
  await expect(page.getByText(/3,600 TAF/).first()).toBeVisible()

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
        (r) =>
          r.subjects === "SOD_Agriculture" && r.measures === "net_diversion",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/4,700 TAF/).first()).toBeVisible()

  // Pumping: the SAME endpoint serves a different measure for this variable,
  // and the location pin persists per group.
  await agList.getByRole("button", { name: "Groundwater pumping" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "SOD_Agriculture" && r.measures === "gw_pumping",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/2,600 TAF/).first()).toBeVisible()
  // Both wired variables have settled scope, so no provisional chip.
  await expect(page.getByText(/^Provisional$/)).toHaveCount(0)

  // Agriculture IS water-year data, unlike CWS, so the filter applies here.
  await expect(page.getByText("Not applicable to this variable")).toHaveCount(0)
  await page.getByRole("button", { name: "Critical", exact: true }).click()
  await expect
    .poll(() => requested.some((r) => r.url.includes("wyt=5")))
    .toBe(true)

  expect(errors).toEqual([])
})

// The ag percent-of-demand view is DERIVED on the site: the endpoint serves
// no percent measure, so the request carries shortage AND net_diversion and
// the view computes shortage / (net_diversion + shortage) x 100. The fixture
// picks 25 and 75 so the expected percent (25) is unmistakable and cannot be
// confused with either input.
test("ag shortage derives its percent-of-demand view from two served measures", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const requested = await setupAgRoutes(page)

  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()

  const agList = page
    .getByRole("list")
    .filter({ has: page.getByRole("button", { name: "Groundwater pumping" }) })

  // Volume view first: one measure, the served shortage series in TAF.
  await agList.getByRole("button", { name: "Water shortage" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) => r.subjects === "NOD_Agriculture" && r.measures === "shortage",
      ),
    )
    .toBe(true)
  await expect(page.getByText(/400 TAF/).first()).toBeVisible()
  // Scope is settled now that the series is served.
  await expect(page.getByText(/^Provisional$/)).toHaveCount(0)

  // Percent view: BOTH measures in one request, and the rendered value is the
  // derived percent, not either input.
  await page.getByRole("button", { name: "% of demand", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      requested.some(
        (r) =>
          r.subjects === "NOD_Agriculture" &&
          r.measures.includes("shortage") &&
          r.measures.includes("net_diversion"),
      ),
    )
    .toBe(true)
  // 400 / (3,600 + 400) x 100 = 10 percent, a value that appears nowhere in
  // the fixture's inputs.
  await expect(page.getByText(/10(\.0+)? %/).first()).toBeVisible()

  expect(errors).toEqual([])
})
