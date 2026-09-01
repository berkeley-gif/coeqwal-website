import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Compare by Locations, live: one request per chart carrying every selected
// location's subject for the held scenario, each member picking its own
// series by subject id. Offline, with fixtures that serve DISTINCT values per
// subject so a swapped or positional pick draws the wrong (detectable)
// number. Same harness as the other did-* specs.

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

function values(value: number) {
  return Array.from({ length: 20 }, (_, i) => ({
    water_year: 1922 + i,
    value,
  }))
}

const RESERVOIR_TAF: Record<string, number> = {
  SHSTA: 3000,
  OROVL: 2000,
  TRNTY: 1000,
  FOLSM: 500,
}
const RESERVOIR_PCT: Record<string, number> = {
  SHSTA: 66,
  OROVL: 58,
  TRNTY: 41,
  FOLSM: 51,
}
const SYSDEL_TAF: Record<string, number> = {
  D_CAA238_CVPCV: 100,
  D_MLRTN_FRK000: 800,
  SWP_TA_KERNAG: 400,
}

type Logged = { endpoint: string; subjects: string[]; units: string }

/** Installs the offline routes and returns the request log. */
async function setupRoutes(
  page: Page,
  opts: { dropSysdelSubject?: string } = {},
): Promise<Logged[]> {
  const log: Logged[] = []
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  await page.route("**/api/data-in-depth/reservoir-storage*", (route) => {
    const url = new URL(route.request().url())
    const subjects = (url.searchParams.get("subjects") ?? "").split(",")
    const units = url.searchParams.get("units") ?? "volume"
    log.push({ endpoint: "reservoir", subjects, units })
    const pct = units === "pct_capacity"
    return route.fulfill({
      json: {
        wyt_filter: null,
        scenarios: [
          {
            scenario: "s0020",
            n_years: 20,
            reservoirs: subjects.map((code) => ({
              subject: code,
              kind: "entity",
              label: code,
              periods: {
                april: pct
                  ? { PCT_CAP: { values: values(RESERVOIR_PCT[code] ?? 1) } }
                  : { TAF: { values: values(RESERVOIR_TAF[code] ?? 1) } },
              },
            })),
          },
        ],
      },
    })
  })
  await page.route("**/api/data-in-depth/groundwater-storage*", (route) => {
    const url = new URL(route.request().url())
    const subjects = (url.searchParams.get("subjects") ?? "").split(",")
    log.push({ endpoint: "gw", subjects, units: "volume" })
    return route.fulfill({
      json: {
        wyt_filter: null,
        scenarios: [
          {
            scenario: "s0020",
            n_years: 20,
            subjects: subjects.map((code, i) => ({
              subject: code,
              kind: code.endsWith("_GroundwaterStorage")
                ? "aggregate"
                : "entity",
              label: code,
              periods: {
                annual: { volume: { values: values(10000 * (i + 1)) } },
              },
            })),
          },
        ],
      },
    })
  })
  await page.route("**/api/data-in-depth/system-deliveries*", (route) => {
    const url = new URL(route.request().url())
    const subjects = (url.searchParams.get("subjects") ?? "").split(",")
    log.push({ endpoint: "sysdel", subjects, units: "volume" })
    const served = subjects.filter((s) => s !== opts.dropSysdelSubject)
    return route.fulfill({
      json: {
        wyt_filter: null,
        scenarios: [
          {
            scenario: "s0020",
            n_years: 20,
            subjects: served.map((code) => ({
              subject: code,
              kind: "metric",
              label: code,
              periods: {
                annual: { TAF: { values: values(SYSDEL_TAF[code] ?? 1) } },
              },
            })),
          },
        ],
      },
    })
  })
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
  return log
}

async function openDataInDepth(page: Page) {
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join()

test("reservoirs compare live in one request, each member by its own subject", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const log = await setupRoutes(page)
  await openDataInDepth(page)
  await page.getByRole("button", { name: "Locations", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  // Exactly one reservoir request carried the three seeded reservoirs.
  await expect
    .poll(
      () =>
        log.filter(
          (r) =>
            r.endpoint === "reservoir" &&
            sameSet(r.subjects, ["SHSTA", "OROVL", "TRNTY"]),
        ).length,
    )
    .toBe(1)
  // A swapped subject would quote the wrong reservoir here.
  await expect(page.getByText(/3,000 TAF at Shasta/)).toBeVisible()
  await expect(page.getByText(/1,000 TAF at Trinity/)).toBeVisible()
  await expect(page.getByText(/^Sample data$/)).toHaveCount(0)

  // Percent of capacity: one request in pct_capacity, served values shown.
  await page.getByRole("button", { name: /capacity/i }).click()
  await expect
    .poll(() =>
      log.some(
        (r) =>
          r.endpoint === "reservoir" &&
          r.units === "pct_capacity" &&
          sameSet(r.subjects, ["SHSTA", "OROVL", "TRNTY"]),
      ),
    )
    .toBe(true)
  await expect(page.getByText(/66 % at Shasta/)).toBeVisible()
  await expect(page.getByText(/41 % at Trinity/)).toBeVisible()

  // Adding a reservoir re-requests once with four subjects.
  await page.getByRole("button", { name: "Folsom" }).click()
  await expect
    .poll(
      () =>
        log.filter(
          (r) =>
            r.endpoint === "reservoir" &&
            sameSet(r.subjects, ["SHSTA", "OROVL", "TRNTY", "FOLSM"]),
        ).length,
    )
    .toBe(1)
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  expect(errors).toEqual([])
})

test("groundwater basins and totals compare live through the picker", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const log = await setupRoutes(page)
  await openDataInDepth(page)
  await page
    .getByRole("navigation", { name: "Variables by sector" })
    .getByRole("button", { name: "Groundwater storage" })
    .click()
  await page.getByRole("button", { name: "Locations", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() =>
      log.some(
        (r) =>
          r.endpoint === "gw" &&
          sameSet(r.subjects, [
            "NOD_GroundwaterStorage",
            "SOD_GroundwaterStorage",
            "DETAW",
          ]),
      ),
    )
    .toBe(true)
  // Add a basin through the picker: one more request with four subjects.
  await page.getByRole("combobox", { name: "Add location" }).click()
  await page.getByRole("option", { name: /^WBA10/ }).click()
  await page.getByRole("button", { name: "Add", exact: true }).click()
  await expect
    .poll(() =>
      log.some(
        (r) =>
          r.endpoint === "gw" &&
          sameSet(r.subjects, [
            "NOD_GroundwaterStorage",
            "SOD_GroundwaterStorage",
            "DETAW",
            "WBA10",
          ]),
      ),
    )
    .toBe(true)
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  expect(errors).toEqual([])
})

test("the SSJV total sums its routes in the shared request and fails closed when one is missing", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const log = await setupRoutes(page)
  await openDataInDepth(page)
  await page
    .getByRole("button", { name: /Southern San Joaquin Valley deliveries/ })
    .first()
    .click()
  await page.getByRole("button", { name: "Locations", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  // The seeded members are the total, Cross Valley Canal and Friant; the
  // request carries the three route subjects once each.
  await expect
    .poll(() =>
      log.some(
        (r) =>
          r.endpoint === "sysdel" &&
          sameSet(r.subjects, [
            "D_CAA238_CVPCV",
            "D_MLRTN_FRK000",
            "SWP_TA_KERNAG",
          ]),
      ),
    )
    .toBe(true)
  // 100 + 800 + 400 for the total; 100 for the canal alone.
  await expect(
    page.getByText(/1,300 TAF at All routes \(total\)/),
  ).toBeVisible()
  await expect(page.getByText(/100 TAF at Cross Valley Canal/)).toBeVisible()
  expect(errors).toEqual([])
})

test("a missing route makes the SSJV total sample, labeled, while the route members stay live", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await setupRoutes(page, { dropSysdelSubject: "SWP_TA_KERNAG" })
  await openDataInDepth(page)
  await page
    .getByRole("button", { name: /Southern San Joaquin Valley deliveries/ })
    .first()
    .click()
  await page.getByRole("button", { name: "Locations", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  // The per-member "sample" chip marks the total; the canal is live.
  await expect(page.getByText("sample", { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/100 TAF at Cross Valley Canal/)).toBeVisible()
  await expect(page.getByText(/1,300 TAF/)).toHaveCount(0)
  expect(errors).toEqual([])
})

test("switching the workspace climate re-resolves the locations axis", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await setupRoutes(page)
  await openDataInDepth(page)
  await page.getByRole("button", { name: "Locations", exact: true }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()

  // The per-tool climate pin was removed: the shared "View by hydroclimate"
  // control in the toolbar is the only hydroclimate input for this tool.
  await expect(
    page.getByRole("combobox", { name: "Hydroclimate" }),
  ).toHaveCount(0)

  // Driving that control moves the whole chart off the historical fixture,
  // so the offline suite falls back to the sample engine for every member.
  await page
    .getByRole("button", { name: /Moderate-dry climate stress/ })
    .first()
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()
  expect(errors).toEqual([])
})
