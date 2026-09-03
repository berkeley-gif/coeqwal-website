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

  // The share-URL and PDF exports were retired: both buttons rendered but
  // neither did anything. The two image and data exports beside them work
  // and stay. These assert on the visible labels: the export bar wraps its
  // buttons in a tooltip, which injects its own text as the accessible
  // name, so a name-based role query would pass here for the wrong reason.
  await expect(page.getByText("Copy link", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Download PDF", { exact: true })).toHaveCount(0)
  await expect(
    page.getByText("Download all images", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Download all data", { exact: true }),
  ).toBeVisible()

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

  // The card, and therefore every rasterized export, carries a color key for
  // the plotted members and a facts block naming what the figure shows.
  // Scoped to the story canvas: the same card also renders in the tray, so
  // an unscoped count would be double and would not say which card was
  // checked. One member is staged in this flow, so one swatch.
  const storyCard = page.locator('[data-share-region="canvas"]')
  await expect(storyCard.locator("[data-share-legend-swatch]")).toHaveCount(1)
  // The swatch carries an accessible name so screen readers get the color
  // key, and it always paints: a row without a color falls back to grey.
  const swatch = storyCard.getByRole("img", {
    name: "Legend: Current operations",
  })
  await expect(swatch).toBeVisible()
  expect(
    await swatch.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  await expect(storyCard.getByText("Variable", { exact: true })).toBeVisible()
  await expect(storyCard.getByText("View", { exact: true })).toBeVisible()
  await expect(
    storyCard.getByText("Water years", { exact: true }),
  ).toBeVisible()
  // The legend row names the member the chart drew. Exact: the standardized
  // title above it also contains the scenario name, title-cased.
  await expect(
    storyCard.getByText("Current operations", { exact: true }),
  ).toBeVisible()

  // The subtitle is legible on the card. It used to take a token that
  // resolves to the card's own background color, so it rendered invisible in
  // every export.
  const subtitleContrast = await storyCard
    .getByText("Volume (TAF) (Exceedance)", { exact: true })
    .first()
    .evaluate((el) => {
      const color = getComputedStyle(el).color
      let background = ""
      let node = el.parentElement
      while (node && (!background || background === "rgba(0, 0, 0, 0)")) {
        background = getComputedStyle(node).backgroundColor
        node = node.parentElement
      }
      return { color, background }
    })
  expect(subtitleContrast.color).not.toBe(subtitleContrast.background)

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
