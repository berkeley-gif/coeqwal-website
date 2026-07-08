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
  // With no scenarios selected the tool shows its choose-scenarios empty
  // state. Rendering the reservoir charts with data needs a full scenario
  // selection flow and is covered when that section is wired (PR 2).
  await expect(page.getByText("Select scenarios to explore")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Choose scenarios" }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
