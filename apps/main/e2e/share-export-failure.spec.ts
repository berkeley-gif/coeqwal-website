import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Image exports fail closed: a figure is exported as the full card or not
// at all. When the capture fails, the user must be told rather than left
// with a download button that does nothing. html-to-image rasterizes
// through a canvas, so making toDataURL throw fails every PNG capture
// while the SVG path (no canvas) keeps working.

test("a failed image export tells the user instead of doing nothing", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()
  await page.getByRole("button", { name: "save snapshot" }).click()
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  await page.getByRole("button", { name: "Add to story" }).click()

  const notice = page.locator("[data-share-export-notice]")
  await expect(notice).toHaveCount(0)

  // Break rasterization only now: staging the snapshot above also draws
  // through a canvas, and that must succeed for the card to exist.
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toDataURL = () => {
      throw new Error("forced capture failure (test)")
    }
  })

  // Single PNG: no file, one sentence, dismissible.
  await page.getByRole("button", { name: "Download as PNG" }).click()
  await expect(notice).toContainText(
    "could not be exported as a PNG, so nothing was downloaded",
  )
  await notice.getByRole("button", { name: "Close" }).click()
  await expect(notice).toHaveCount(0)

  // Bulk: the SVG still exports, so a ZIP is downloaded, and the notice
  // says the one figure is not in it in full.
  const zipPromise = page.waitForEvent("download")
  await page.getByText("Download all images", { exact: true }).click()
  const zip = await zipPromise
  expect(zip.suggestedFilename()).toBe("coeqwal-share-images.zip")
  await expect(notice).toContainText(
    "1 of 1 figures could not be exported in full; the ZIP holds the rest.",
  )

  expect(errors).toEqual([])
})
