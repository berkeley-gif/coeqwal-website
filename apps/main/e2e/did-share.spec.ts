import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Core export flow: save a Data-in-Depth chart snapshot, see it as a share
// card, and download its image and underlying data. Runs offline (HAR
// fixture): the data-in-depth live endpoints are absent from the HAR, so
// the chart renders from the deterministic sample-data engine.

test("data-in-depth chart can be saved, shared, and exported", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  // Offline the chart always renders sample data (the HAR fixture drives no
  // live request); assert that up front so an unexpected live render fails
  // here, not later at the CSV body diff.
  await expect(page.getByText(/^Sample data$/)).toBeVisible()

  // Stage the snapshot from the chart card. This auto-opens the persistent
  // share drawer on the right.
  await page.getByRole("button", { name: "save snapshot" }).click()

  // Navigate with the drawer's own button: it closes the drawer AND
  // switches the top-level tab to Share. The button is a fixed footer inside
  // the persistent drawer, whose 100vh paper carries a small top offset, so
  // its bottom edge sits just below a 720px-tall headless viewport and a
  // normal click reports it out of view. Dispatch the click directly to run
  // the real handler (setShowShareDrawer(false) + navigate to Share).
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")

  // The tray shows the new card; its labeled toggle proves it exists.
  const addToStory = page.getByRole("button", { name: "Add to story" })
  await expect(addToStory).toBeVisible()
  await addToStory.click()

  // Download the CSV from the story card and check its body.
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download data" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^coeqwal-data-.+\.csv$/)
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  const csv = Buffer.concat(chunks).toString("utf8")
  expect(csv).toContain("Coeqwal export,Data in depth")
  // The standardized figure title travels with the export (quoted: it
  // contains commas).
  expect(csv).toContain("Figure title,")
  expect(csv).toContain("April Reservoir Storage (Shasta Reservoir)")
  expect(csv).toContain("Data source,Sample data")
  expect(csv).toContain("Member,Mean,CV,Min,P10,P25,Median,P75,P90,Max,Source")
  expect(csv).toContain("Year index")

  // The figure footer is part of the card, so it travels with every export:
  // source, data provenance, capture date.
  await expect(
    page
      .getByText(
        /COEQWAL, coeqwal\.org\. CalSim3 model results\. Sample data, not model results\. Captured \w+ \d+, \d{4}\./,
      )
      .first(),
  ).toBeVisible()

  // Download the PNG (html-to-image path renders the live card). The raster
  // is wide enough to read as a figure, not a thumbnail.
  const pngPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download as PNG" }).click()
  const png = await pngPromise
  expect(png.suggestedFilename()).toMatch(/^coeqwal-data-.+\.png$/)
  const pngChunks: Buffer[] = []
  for await (const chunk of await png.createReadStream()) {
    pngChunks.push(chunk as Buffer)
  }
  const pngBytes = Buffer.concat(pngChunks)
  // PNG IHDR: width at bytes 16..19, height at 20..23 (big-endian).
  const pngWidth = pngBytes.readUInt32BE(16)
  const pngHeight = pngBytes.readUInt32BE(20)
  expect(pngWidth).toBeGreaterThanOrEqual(1000)
  // The chart box follows the chart's 900 x 520 shape, so the card is not
  // taller than it is wide by much: no blank bands around the chart.
  expect(pngHeight / pngWidth).toBeLessThan(1.15)

  // The SVG export carries the long axis label and the footer as text.
  const svgPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download as SVG" }).click()
  const svgDownload = await svgPromise
  const svgChunks: Buffer[] = []
  for await (const chunk of await svgDownload.createReadStream()) {
    svgChunks.push(chunk as Buffer)
  }
  const svg = Buffer.concat(svgChunks).toString("utf8")
  expect(svg).toContain("thousand acre feet (TAF)")
  expect(svg).toContain("Sample data, not model results.")
  expect(svg).toContain("April Reservoir Storage (Shasta Reservoir)")

  expect(errors).toEqual([])
})
