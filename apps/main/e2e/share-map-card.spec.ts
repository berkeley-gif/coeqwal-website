import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Saved maps render in the figure template with the Mapbox credit and, for
// Distribution comparisons, the direction key. A map restored from a share
// link (which never carries the image) says so. The offline suite has no
// Mapbox token, so these items are seeded, not captured.

test("stored comparison map card", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  const pixel = await page.evaluate(() => {
    const c = document.createElement("canvas")
    // A saved map's shape: tall and narrow, as wide as the map panel was.
    c.width = 720
    c.height = 1500
    const x = c.getContext("2d")!
    x.fillStyle = "#3a7"
    x.fillRect(0, 0, 720, 1500)
    return c.toDataURL("image/jpeg")
  })
  await page.addInitScript((img) => {
    const item = {
      id: "map-a",
      type: "map",
      tool: "equity",
      outcomeCodes: ["ENV_FLOWS"],
      scenarioId: "s0020",
      hydroclimate: "historical",
      comparedWithBaseline: true,
      imageAspect: 720 / 1500,
      capturedAt: "2026-10-05T12:00:00Z",
      cachedImageDataUrl: img,
    }
    window.localStorage.setItem(
      "coeqwal-share-v2",
      JSON.stringify({
        version: 2,
        shareItems: [item],
        storyItemIds: ["map-a"],
      }),
    )
  }, pixel)
  await page.goto("/share")
  const canvas = page.locator('[data-share-region="canvas"]')
  await expect(
    canvas.getByText("Distribution tool", { exact: true }),
  ).toBeVisible()
  await expect(
    canvas.getByText(/, Compared with Current Operations$/),
  ).toBeVisible()
  await expect(
    canvas.getByRole("group", { name: "Comparison marker legend" }),
  ).toBeVisible()
  await expect(
    canvas.getByRole("group", { name: "Outcome level color legend" }),
  ).toBeVisible()
  await expect(
    canvas.getByText(/Basemap © Mapbox © OpenStreetMap\./),
  ).toBeVisible()

  // The wide story card shows the map at most export-card width and 720 px
  // tall, not stretched across the whole story.
  const image = canvas.locator("img").first()
  await expect(image).toBeVisible()
  const box = (await image.boundingBox())!
  expect(box.width).toBeLessThanOrEqual(480.5)
  expect(box.height).toBeLessThanOrEqual(720.5)
  expect(box.width / box.height).toBeCloseTo(720 / 1500, 2)

  const png = page.waitForEvent("download")
  await canvas.getByRole("button", { name: "Download as PNG" }).first().click()
  const chunks: Buffer[] = []
  for await (const c of await (await png).createReadStream())
    chunks.push(c as Buffer)
  const bytes = Buffer.concat(chunks)
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG")
  expect(bytes.readUInt32BE(16)).toBe(1440)
  expect(errors).toEqual([])
})

test("map restored from a share link names its hydroclimate and says the image is missing", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  // Token shape pinned by share-map-pure.spec.ts ("map token has a fixed,
  // documented shape"); items are "<prefix>.<token>".
  // The Share tab (and its link rehydration) mounts on the /share route.
  await page.goto("/share?tab=share&v=1&items=m.ENV_FLOWS.s0020.cc50.bar.")
  const canvas = page.locator(
    '[data-share-region="canvas"], [data-share-region="tray"]',
  )
  await expect(
    canvas.getByText("Bar tool", { exact: true }).first(),
  ).toBeVisible()
  await expect(
    canvas
      .getByText(
        "The map image is not stored in share links. Show this outcome on the Explore map to redraw it.",
      )
      .first(),
  ).toBeVisible()
  // cc50's short label in HYDROCLIMATE_SHORT_LABELS (content/scenarios.ts).
  await expect(
    canvas.getByText("Moderate-high stress", { exact: true }).first(),
  ).toBeVisible()
  expect(errors).toEqual([])
})
