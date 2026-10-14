import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { selectCurrentOperations } from "./support/scenarioSelection"

test("home page renders without unexpected console errors", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/")
  await expect(page).toHaveTitle(/COEQWAL/)
  // The hero heading is home-specific and confirms the page rendered, not
  // just an empty shell.
  await expect(
    page.getByRole("heading", { name: /California.s water/i }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test("data-in-depth tool activates and renders its panel", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  // Explore is now a dedicated route (/explore) and the tool sub-tabs render
  // immediately, so open the Data in depth tool directly (no "Tools" gate).
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  // With nothing selected the tool asks for a scenario, as every Explore
  // tool does, and draws no chart.
  await expect(page.locator("[data-select-scenario-prompt]")).toBeVisible()
  await expect(page.locator("[data-did-chart-state]")).toHaveCount(0)
  await selectCurrentOperations(page)
  await expect(page.locator("[data-select-scenario-prompt]")).toHaveCount(0)
  // The tool opens on the shared journey-strip header (the legacy
  // By category / Explorer toggle is retired); with a scenario selected the
  // by-variable Explorer draws model results and the comparison controls
  // are visible.
  await expect(
    page.getByRole("heading", { name: "Data in Depth" }),
  ).toBeVisible()
  await expect(
    page.getByText("Explore additional outcome variables."),
  ).toBeVisible()
  await expect(page.locator('[data-did-chart-state="drawn"]')).toBeVisible()
  await expect(page.getByRole("group", { name: "Compare by" })).toBeVisible()
  // Every chart carries the standardized figure title.
  await expect(
    page.getByText(
      /^April Reservoir Storage \(Shasta Reservoir\), Current Operations, Historical Hydroclimate, All Water Years$/,
    ),
  ).toBeVisible()
  // The tool shows model results only: no data-source badge, and no sample
  // or synthetic data, anywhere on the page.
  await expect(page.getByText(/live data/i)).toHaveCount(0)
  await expect(
    page.getByText(/sample data|\bsample\b|simulated years/i),
  ).toHaveCount(0)
  expect(errors).toEqual([])
})
