import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

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
    page.getByRole("heading", { name: /California.s water/ }),
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
  // The by-variable Explorer is the default mode and works from the Current
  // Operations reference, so a chart card renders before any scenario is
  // selected: the data-source chip and the comparison controls are visible.
  await expect(
    page.getByRole("button", { name: "Explorer", pressed: true }),
  ).toBeVisible()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
  await expect(page.getByRole("group", { name: "Compare by" })).toBeVisible()
  // The original category view stays reachable behind the toggle and keeps
  // its choose-scenarios empty state when nothing is selected.
  await page.getByRole("button", { name: "By category" }).click()
  await expect(page.getByText("Select scenarios to explore")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Choose scenarios" }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
