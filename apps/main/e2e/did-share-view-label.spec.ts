import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// A figure of a distribution view other than the plain one names that view
// after the chart style, because the variable row's unit alone cannot tell
// percent of capacity from percent of demand. Offline (sample data).

test("a percent-of-capacity figure names its view on the card", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()
  // The reservoir variables offer the plain volume view and percent of
  // capacity; the toggle group is labelled "Data view".
  await page
    .getByRole("group", { name: "Data view" })
    .getByRole("button", { name: "% of capacity" })
    .click()
  await page.getByRole("button", { name: "save snapshot" }).click()
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")

  const tray = page.locator('[data-share-region="tray"]')
  await expect(
    tray.getByText("Exceedance plot, % of capacity", { exact: true }),
  ).toBeVisible()
  await expect(tray.getByText("Variable", { exact: true })).toBeVisible()

  expect(errors).toEqual([])
})
