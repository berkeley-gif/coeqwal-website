import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Exports are laid out at 480 CSS px and rasterized at a fixed 3x, so a
// high-density screen downloads the same 1,440 px figure as a standard one.
test.use({ deviceScaleFactor: 2 })

test("export width is independent of device pixel ratio", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await page.getByRole("button", { name: "save snapshot" }).click()
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  await page.getByRole("button", { name: "Add to story" }).click()
  const png = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download as PNG" }).click()
  const chunks: Buffer[] = []
  for await (const c of await (await png).createReadStream()) {
    chunks.push(c as Buffer)
  }
  expect(Buffer.concat(chunks).readUInt32BE(16)).toBe(1440)
  expect(errors).toEqual([])
})
