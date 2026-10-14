import { test, expect } from "@playwright/test"
import { setupNetwork } from "./support/network"
import { getTierWording } from "./support/tierWording"
import { selectCurrentOperations } from "./support/scenarioSelection"

// The site never uses the word "tier": outcome levels go by their names or
// as "outcome levels". Each page, and Data in Depth, is read for the word in
// its text and accessible labels once it has drawn. The Explore tools and
// their map caption are read in explore-tools.spec.ts, where they draw
// against their own fixture.

for (const path of ["/", "/learn", "/about", "/data", "/share"]) {
  test(`${path} never says "tier"`, async ({ page }) => {
    await setupNetwork(page)
    await page.goto(path)
    await expect(page.locator("main, body").first()).toBeVisible()
    await page.waitForLoadState("networkidle")
    expect(await getTierWording(page)).toEqual([])
  })
}

test("data in depth never says tier", async ({ page }) => {
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await selectCurrentOperations(page)
  await expect(page.locator('[data-did-chart-state="drawn"]')).toBeVisible()
  expect(await getTierWording(page)).toEqual([])
})
