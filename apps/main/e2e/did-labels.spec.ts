import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { getScenarioShortLabel } from "../app/content/scenarios"

// Browser contract for the label edits from the project lead's Aug 23 board
// review: the key-outcome chips read "used in calculation of key outcome:
// <name>" or "not used in calculation of key outcome", every thousand
// acre-feet axis reads its long unit, the X2 axis reads the distance from the
// Golden Gate, the X2 figure title drops the location parenthetical, the box
// plot explainer names the dashed mean marker, and "Outflow as % of
// unimpaired flow" is gone from the sector rail. Offline against the sample
// engine: labels do not depend on the data source.

const TAF_AXIS = "thousand acre feet (TAF)"

async function openDataInDepth(page: Page) {
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
}

function variableButton(page: Page, name: string) {
  return page
    .getByRole("navigation", { name: "Variables by sector" })
    .getByRole("button", { name, exact: true })
}

test("the default chart carries the reworded chip and the long TAF axis", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await openDataInDepth(page)
  await expect(
    page.getByText("used in calculation of key outcome: Reservoir storage"),
  ).toBeVisible()
  await expect(page.getByText(/feeds tier/)).toHaveCount(0)
  await expect(page.getByText(TAF_AXIS)).toBeVisible()
  expect(errors).toEqual([])
})

test("April X2 reads not used, the Golden Gate axis, and the title without a location", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await openDataInDepth(page)
  await variableButton(page, "April X2 position").click()
  await expect(
    page.getByText("not used in calculation of key outcome"),
  ).toBeVisible()
  await expect(
    page.getByText("distance of X2 from Golden Gate (km)"),
  ).toBeVisible()
  // The chart exposes the figure title as its accessible name; the title
  // text above the chart is the same string.
  const chart = page.getByRole("img", { name: /X2 Position/ })
  const title = await chart.getAttribute("aria-label")
  expect(title).toMatch(/^April X2 Position \(in km\), /)
  expect(title).not.toContain("NDO")
  await expect(page.getByText(title!, { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test("SWP M&I deliveries gains a not-used chip and the TAF axis on Stats", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await openDataInDepth(page)
  await variableButton(page, "SWP M&I deliveries").click()
  await expect(
    page.getByText("not used in calculation of key outcome"),
  ).toBeVisible()
  await expect(page.getByText(TAF_AXIS)).toBeVisible()
  await page.getByRole("button", { name: "Stats", exact: true }).click()
  await expect(page.getByText("Mean (TAF)")).toBeVisible()
  await expect(page.getByText(TAF_AXIS)).toBeVisible()
  expect(errors).toEqual([])
})

test("the box plot explainer names the dashed mean line", async ({ page }) => {
  await openDataInDepth(page)
  await page.getByRole("button", { name: "Box plot" }).click()
  await page.getByRole("button", { name: "How do I read this chart?" }).click()
  await expect(
    page.getByText("The short dashed line inside each box marks the mean."),
  ).toBeVisible()
})

test("outflow as percent of unimpaired flow is gone from the rail", async ({
  page,
}) => {
  await openDataInDepth(page)
  await expect(variableButton(page, "Delta outflow volume")).toBeVisible()
  await expect(
    variableButton(page, "Outflow as % of unimpaired flow"),
  ).toHaveCount(0)
})

// Content Summary sheet, tab Scenarios, Short Title column (2026-08-26): the
// two copy defects the sheet carried and the one title the Aug 26 label
// update left behind. Pure registry check, no browser.
test("scenario short labels match the Content Summary sheet for the three corrected rows", () => {
  expect(getScenarioShortLabel("s0023")).toBe(
    "Current USBR operations without TUCPs",
  )
  expect(getScenarioShortLabel("s0044")).toBe(
    "Increase Shasta carry-over storage",
  )
  expect(getScenarioShortLabel("s0011")).toBe(
    "Current operations with historical land use",
  )
})

// The explainer accordion under the chart asks about the VARIABLE, matching
// the term the rest of the tool uses (the sector rail lists variables, and
// the registry keys are variable ids). The question mark stays, matching the
// sibling accordion "How do I read this chart?".
test("the explainer accordion asks about the variable, not the metric", async ({
  page,
}) => {
  await openDataInDepth(page)
  await expect(page.getByText("What is this variable?")).toBeVisible()
  await expect(page.getByText("What is this metric?")).toHaveCount(0)
})
