import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// System-deliveries live path, end to end and offline. Same technique as
// did-climate-axis.spec.ts: inline route fixtures layered over the HAR
// harness (later routes win), so the real live path runs without network:
// id resolution, per-variable subject mapping, live series adoption, and
// the Live/Sample card label.

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

// Distinct value per subject so a wrong subject mapping would draw the
// wrong (detectable) series.
const VALUE_BY_SUBJECT: Record<string, number> = {
  DEL_CVP_TOTAL: 5000,
  DEL_CVP_TOT_N_WAMER: 1500,
  DEL_SWP_TOT_N: 900,
  C_CVPSWP_TOTAL_EXPORTS: 4800,
}

function sysdelPayload(subjectsCsv: string) {
  const subjects = subjectsCsv.split(",").map((code) => ({
    subject: code,
    kind: "metric",
    label: code,
    periods: {
      annual: {
        TAF: {
          values: Array.from({ length: 20 }, (_, i) => ({
            water_year: 1922 + i,
            value: VALUE_BY_SUBJECT[code] ?? 1,
          })),
        },
      },
    },
  }))
  return {
    wyt_filter: null,
    scenarios: [{ scenario: "s0020", n_years: 20, subjects }],
  }
}

test("system-delivery variables fetch their per-variable subjects and go live", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.route("**/api/scenarios", (route) =>
    route.fulfill({ json: SCENARIOS_FIXTURE }),
  )
  const requestedSubjects: string[] = []
  await page.route("**/api/data-in-depth/system-deliveries*", (route) => {
    const url = new URL(route.request().url())
    const subjects = url.searchParams.get("subjects") ?? ""
    requestedSubjects.push(subjects)
    return route.fulfill({ json: sysdelPayload(subjects) })
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

  // CVP deliveries: default region is System-wide -> DEL_CVP_TOTAL.
  await page
    .getByRole("button", { name: "Central Valley Project deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("DEL_CVP_TOTAL"))
    .toBe(true)

  // Regional pin: North of Delta maps to the NOD subject of the SAME
  // variable's family.
  await page.getByRole("combobox").filter({ hasText: "System-wide" }).click()
  await page.getByRole("option", { name: "North of Delta" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("DEL_CVP_TOT_N_WAMER"))
    .toBe(true)

  // SWP deliveries map to their own subject family, and the region pin
  // persists per location group: still North of Delta -> the SWP NOD subject.
  await page
    .getByRole("button", { name: "State Water Project deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("DEL_SWP_TOT_N"))
    .toBe(true)

  // Delta exports: single Delta location -> the combined exports metric.
  await page.getByRole("button", { name: "Total Delta exports" }).click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("C_CVPSWP_TOTAL_EXPORTS"))
    .toBe(true)

  // Note: tot_exp declares a monthly view but the ViewBar filters "monthly"
  // out of the first-version explorer, so it is unreachable here. The
  // viewHasLiveSource guard that keeps a mock-surfaced view from claiming
  // live data is covered node-side in did-mapping.spec.ts.

  // Sector-specific variables follow the same per-variable subject-family
  // pattern. The regional pin (still North of Delta from above) carries into
  // the CVP agricultural family.
  await page
    .getByRole("button", { name: "CVP agricultural deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("DEL_CVP_PAG_NOD"))
    .toBe(true)

  // Refuges are served as a system total only: dedicated single location.
  await page
    .getByRole("button", { name: "CVP wildlife refuge deliveries" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("DEL_CVP_PRF_TOTAL"))
    .toBe(true)

  // Southern SJV exports: the three served routes are the locations; the
  // presentation is provisional pending confirmation, and switching routes
  // fetches each route's own subject.
  await page
    .getByRole("button", { name: "Southern San Joaquin Valley exports" })
    .click()
  await expect(page.getByText(/^Live data$/)).toBeVisible()
  await expect(page.getByText(/^Provisional$/)).toBeVisible()
  await expect
    .poll(() => requestedSubjects.includes("D_CAA238_CVPCV"))
    .toBe(true)
  await page
    .getByRole("combobox")
    .filter({ hasText: "Cross Valley Canal" })
    .click()
  await page.getByRole("option", { name: "Friant Division" }).click()
  await expect
    .poll(() => requestedSubjects.includes("D_MLRTN_FRK000"))
    .toBe(true)

  expect(errors).toEqual([])
})
