import { test, expect, type Page } from "@playwright/test"
import { setupNetwork } from "./support/network"

// The Data in Depth tool's two option columns (scenario library sidebar and
// the variables rail) collapse to slim labeled strips so the chart gets the
// width (per the layout decision that followed the 2026-07-10 real-estate
// feedback). Collapsed state persists across tool switches and a same-tab
// reload, but the two rails are scoped differently: the scenario rail is
// workspace state shared by every sidebar-layout tool (since the cross-tool
// rails port), while the variables rail is data-tool session state.

async function openDataTool(page: Page) {
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
}

test("variables rail collapses to a strip and reopens", async ({ page }) => {
  await openDataTool(page)

  const rail = page.getByRole("navigation", { name: "Variables by sector" })
  await expect(rail).toBeVisible()

  await page.getByRole("button", { name: "Collapse variables" }).click()
  await expect(rail).toBeHidden()

  const expandStrip = page.getByRole("button", { name: "Expand variables" })
  await expect(expandStrip).toBeVisible()

  await expandStrip.click()
  await expect(rail).toBeVisible()
  await expect(expandStrip).toBeHidden()
})

test("scenario library collapses to a strip and reopens", async ({ page }) => {
  await openDataTool(page)

  const libraryHeader = page.getByText("Scenario library")
  await expect(libraryHeader).toBeVisible()

  await page.getByRole("button", { name: "Collapse scenarios" }).click()
  await expect(libraryHeader).toBeHidden()

  const expandStrip = page.getByRole("button", { name: "Expand scenarios" })
  await expect(expandStrip).toBeVisible()

  await expandStrip.click()
  await expect(libraryHeader).toBeVisible()
  await expect(expandStrip).toBeHidden()
})

test("collapsed rails survive tool switch and reload", async ({ page }) => {
  await openDataTool(page)

  await page.getByRole("button", { name: "Collapse variables" }).click()
  await page.getByRole("button", { name: "Collapse scenarios" }).click()

  // The scenario rail is workspace-scoped, so Radar shows the same collapsed
  // strip; the variables rail is data-tool-only, so Radar renders no
  // variables strip. Radar auto-opens its tour on first visit; close it so
  // the modal cannot swallow the tab click back to Data in depth.
  await page.getByRole("tab", { name: /Radar/ }).click()
  await expect(
    page.getByRole("button", { name: "Expand scenarios" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Expand variables" }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Close tour" }).click()

  // Back to Data in depth: both rails are still collapsed.
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(
    page.getByRole("button", { name: "Expand variables" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Expand scenarios" }),
  ).toBeVisible()

  // Same-tab reload restores the collapsed session state.
  await page.reload()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Expand variables" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Expand scenarios" }),
  ).toBeVisible()
})
