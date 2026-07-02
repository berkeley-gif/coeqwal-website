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
