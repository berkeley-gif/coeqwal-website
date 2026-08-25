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

  // Snapshot capture is not offered for the Stats style yet; the save
  // button disables instead of capturing a chart the pipeline cannot draw.
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeDisabled()
})

test("Stats style adds the trend plot on the groundwater level view", async ({
  page,
}) => {
  await openDataTool(page)

  await page
    .getByRole("navigation", { name: "Variables by sector" })
    .getByRole("button", { name: "Groundwater storage" })
    .click()
  await page.getByRole("button", { name: "Level (ft)" }).click()
  await page.getByRole("button", { name: "Stats", exact: true }).click()

  await expect(page.getByText("Mean (ft)")).toBeVisible()
  await expect(page.getByText("CV", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Trend (ft/yr)")).toBeVisible()
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

  await page
    .getByRole("button", { name: "Climate futures", exact: true })
    .click()
  await expect(
    page.getByText(
      /^At Shasta Reservoir under .+, mean April reservoir storage ranges from [\d,.]+ TAF \(/,
    ),
  ).toBeVisible()
})
