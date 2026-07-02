import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

test("home page renders without unexpected console errors", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/")
  await expect(page).toHaveTitle(/COEQWAL/)
  await expect(
    page.getByRole("button", { name: "Explore water allocation scenarios" }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test("data-in-depth tool activates and renders its panel", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/?tab=explore")
  // The individual tool tabs are hidden until the "Tools" mode is active,
  // so reveal them first, then open the Data in depth tool.
  await page.getByRole("tab", { name: "Tools" }).click()
  await page.getByRole("tab", { name: "Data in depth" }).click()
  // With no scenarios selected the tool shows its choose-scenarios empty
  // state. Rendering the reservoir charts with data needs a full scenario
  // selection flow and is covered when that section is wired (PR 2).
  await expect(page.getByText("Select scenarios to explore")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Choose scenarios" }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
