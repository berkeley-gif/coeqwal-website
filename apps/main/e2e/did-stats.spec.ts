import { test, expect, type Page } from "@playwright/test"
import { setupNetwork } from "./support/network"
import { linearTrendPerYear } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/mockDataEngine"

// The Stats chart style shows side-by-side bar plots of summary statistics
// for the currently selected quantity view: mean and CV everywhere, plus the
// linear level trend (ft/yr) on the groundwater level view.

test("linearTrendPerYear returns the least-squares slope per year", () => {
  // Perfect line: value = 100 - 0.5 * year.
  const declining = Array.from({ length: 100 }, (_, i) => 100 - 0.5 * i)
  expect(linearTrendPerYear(declining)).toBeCloseTo(-0.5, 6)
  // Constant series has zero trend; short series are not extrapolated.
  expect(linearTrendPerYear([7, 7, 7])).toBeCloseTo(0, 6)
  expect(linearTrendPerYear([42])).toBe(0)
  expect(linearTrendPerYear([])).toBe(0)
})

async function openDataTool(page: Page) {
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
}

test("Stats style shows mean and CV bar plots for the volume view", async ({
  page,
}) => {
  await openDataTool(page)

  const stats = page.getByRole("button", { name: "Stats", exact: true })
  await expect(stats).toBeVisible()
  await stats.click()

  await expect(page.getByText("Mean (TAF)")).toBeVisible()
  await expect(page.getByText("CV", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Trend (ft/yr)")).toBeHidden()

  // Every chart style can be captured: the Stats style stitches its bar
  // panels into one composed figure.
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeEnabled()
})

test("Stats style adds the trend plot on the groundwater level view", async ({
  page,
}) => {
  await openDataTool(page)

  await page
    .getByRole("navigation", { name: "Variables by sector" })
    .getByRole("button", { name: "Groundwater storage" })
    .click()
  // The default pin is the North of Delta total, which has no level series
  // (levels are per basin), so the Level view is blocked until a basin is
  // picked; nothing is reselected for the user.
  await expect(page.getByRole("button", { name: "Level (ft)" })).toBeDisabled()
  await page
    .getByRole("combobox")
    .filter({ hasText: "All North of Delta" })
    .click()
  await page.getByRole("option", { name: "WBA10" }).click()
  await page.getByRole("button", { name: "Level (ft)" }).click()
  await page.getByRole("button", { name: "Stats", exact: true }).click()

  await expect(page.getByText("Mean (ft)")).toBeVisible()
  await expect(page.getByText("CV", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Trend (ft/yr)")).toBeVisible()

  // The three-panel Stats view captures too: compose mode stitches every
  // panel, so the count of panels never gates the export.
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "save snapshot" }).click()
  const drawer = page.locator(".MuiDrawer-root")
  // Match the standardized card title (it carries the location
  // parenthetical); the figure-facts block also names the bare variable.
  await expect(drawer.getByText(/Groundwater Storage \(/i)).toBeVisible({
    timeout: 20_000,
  })
  await expect(
    drawer.getByRole("img", { name: /Groundwater Storage/i }),
  ).toBeVisible()
})

// The sentence under the Stats bars reports the mean and the CV those bars
// draw, on both axes; the word "median" never appears there.
test("Stats view sentence reports the mean and CV, not the median", async ({
  page,
}) => {
  await openDataTool(page)
  await page.getByRole("button", { name: "Stats", exact: true }).click()
  await expect(page.getByText("Mean (TAF)")).toBeVisible()
  const sentence = page.getByText(
    /^Mean April reservoir storage for .+ under the Historical hydroclimate is [\d,.]+ TAF\./,
  )
  await expect(sentence).toBeVisible()
  await expect(sentence).toContainText("(CV)")
  await expect(sentence).not.toContainText(/median/i)

  await page.getByRole("button", { name: "Hydroclimates", exact: true }).click()
  await expect(
    page.getByText(
      /^At Shasta Reservoir under .+, mean April reservoir storage ranges from [\d,.]+ TAF \(/,
    ),
  ).toBeVisible()
})

test("Stats style saves a composed snapshot to the share drawer", async ({
  page,
}) => {
  await openDataTool(page)
  await page.getByRole("button", { name: "Stats", exact: true }).click()
  await expect(page.getByText("Mean (TAF)")).toBeVisible()

  await page.getByRole("button", { name: "save snapshot" }).click()

  // The staged card carries the standardized title and a stitched thumbnail
  // (compose mode wraps every panel chart in one SVG).
  const drawer = page.locator(".MuiDrawer-root")
  await expect(
    drawer.getByText(/April Reservoir Storage \(Shasta Reservoir\)/),
  ).toBeVisible({ timeout: 20_000 })
  // The captured thumbnail itself, not just any svg: the drawer chrome has
  // its own close icons, and a failed capture stages the card anyway (the
  // staging helper swallows capture errors), so a bare svg match would pass
  // even when nothing was captured. SvgThumbnail exposes role="img" labeled
  // with the figure title.
  await expect(
    drawer.getByRole("img", { name: /April Reservoir Storage/ }),
  ).toBeVisible()
  // The card names the style it captured (in the subtitle and again in
  // the figure-facts View row).
  await expect(drawer.getByText(/Stats/).first()).toBeVisible()
})
