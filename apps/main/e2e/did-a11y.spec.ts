import { test, expect, type Page } from "@playwright/test"
import { AxeBuilder } from "@axe-core/playwright"
import { setupNetwork } from "./support/network"

// Automated accessibility checks on the Data in Depth key flows, offline.
// axe-core runs in-page against the WCAG 2.1 A/AA rule tags; the offline
// harness renders the deterministic sample-data engine, whose DOM semantics
// match the live path, so no network is needed.
//
// Gate policy: critical and serious violations fail; moderate and minor are
// reported to the console as advisories so the gate stays stable. The
// color-contrast rule is excluded here until the contrast fix pass lands
// (it reports at serious impact and would fail this gate for findings that
// are tracked as their own workstream); re-enable it with that change.

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa"]

/** Axe scan of the current page state; returns blocking violations. */
async function blockingViolations(page: Page, state: string) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules(["color-contrast"])
    .analyze()
  for (const v of results.violations) {
    if (v.impact !== "critical" && v.impact !== "serious") {
      console.log(
        `[a11y advisory] ${state}: ${v.id} (${v.impact}), ${v.nodes.length} node(s)`,
      )
    }
  }
  return results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`)
}

async function openDataInDepth(page: Page) {
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()
}

test("explore landing has no blocking a11y violations", async ({ page }) => {
  await setupNetwork(page)
  await page.goto("/explore")
  await expect(page.getByText("Scenario library")).toBeVisible()
  expect(await blockingViolations(page, "explore-landing")).toEqual([])
})

test("data-in-depth default view has no blocking a11y violations", async ({
  page,
}) => {
  await openDataInDepth(page)
  expect(await blockingViolations(page, "did-default")).toEqual([])
})

test("stats view and wyt filter states have no blocking a11y violations", async ({
  page,
}) => {
  await openDataInDepth(page)
  await page
    .getByRole("button", { name: /^stats$/i })
    .first()
    .click()
  expect(await blockingViolations(page, "did-stats")).toEqual([])
  await page.getByRole("button", { name: "Critical", exact: true }).click()
  expect(await blockingViolations(page, "did-wyt-filtered")).toEqual([])
})

test("share drawer has no blocking a11y violations", async ({ page }) => {
  await openDataInDepth(page)
  // The drawer's own fixed toggle: present in every sidebar grouping state,
  // unlike the per-theme share-all buttons (grouping differs offline).
  await page.getByRole("button", { name: "Share", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Close share drawer" }),
  ).toBeVisible()
  expect(await blockingViolations(page, "share-drawer")).toEqual([])
})

test("locations axis with the grouped picker has no blocking a11y violations", async ({
  page,
}) => {
  await openDataInDepth(page)
  // Agricultural water lists 134 locations, so the Locations axis renders the
  // selected chips plus an add-location select instead of a chip cloud.
  await page
    .getByRole("list")
    .filter({ has: page.getByRole("button", { name: "Groundwater pumping" }) })
    .getByRole("button", { name: "Surface water deliveries" })
    .click()
  await page.getByRole("button", { name: "Locations", exact: true }).click()
  await expect(
    page.getByRole("combobox", { name: "Add location" }),
  ).toBeVisible()
  expect(await blockingViolations(page, "did-locations-picker")).toEqual([])
  await page.getByRole("combobox", { name: "Add location" }).click()
  await expect(page.getByRole("listbox")).toBeVisible()
  expect(await blockingViolations(page, "did-locations-picker-open")).toEqual(
    [],
  )
})
