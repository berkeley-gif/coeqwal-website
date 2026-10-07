import JSZip from "jszip"
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
  // The card is laid out as the figure template: tool eyebrow and chart kind
  // in the header, the held dimensions as rows, the compared dimension as
  // the legend heading, and a SOURCE footer. The old View row is gone.
  await expect(
    storyCard.getByText("Data in depth", { exact: true }).first(),
  ).toBeVisible()
  await expect(
    storyCard.getByText("Exceedance plot", { exact: true }),
  ).toBeVisible()
  await expect(storyCard.getByText("Variable", { exact: true })).toBeVisible()
  await expect(
    storyCard.getByText("Water years", { exact: true }),
  ).toBeVisible()
  await expect(storyCard.getByText("Strategy", { exact: true })).toBeVisible()
  await expect(storyCard.getByText("Source", { exact: true })).toBeVisible()
  await expect(storyCard.getByText("View", { exact: true })).toHaveCount(0)
  // The legend row names the member the chart drew.
  await expect(
    storyCard.getByText("Current operations", { exact: true }),
  ).toBeVisible()

  // Download the PNG (html-to-image path renders the live card).
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
  // Every export is laid out at one fixed width, so a card that sits alone
  // in a wide story column downloads at the same size as one in the tray:
  // 480 CSS px at the 3x raster scale (headless dpr 1) = 1,440 px.
  expect(pngWidth).toBe(1440)
  expect(pngHeight).toBeGreaterThan(400)

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
  // The template rows survive the export of the live card.
  expect(svg).toContain("April Reservoir Storage (TAF)")
  expect(svg).toContain("Shasta Reservoir")

  // Cleanup: the off-screen export host must be gone after downloads.
  const hosts = () =>
    page.evaluate(
      () => document.querySelectorAll('body > div[aria-hidden="true"]').length,
    )
  const hostsBefore = await hosts()

  // Two cards in the story: the grid narrows each card, but every export is
  // still laid out at 480 CSS px, so every PNG is still exactly 1,440 px.
  // The tray persists in localStorage across the navigation.
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await page.getByRole("button", { name: "save snapshot" }).click()
  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  await page.getByRole("button", { name: "Add to story" }).first().click()
  await expect(
    storyCard.getByRole("button", { name: "Download as PNG" }),
  ).toHaveCount(2)
  const zipPromise = page.waitForEvent("download")
  await page.getByText("Download all images", { exact: true }).click()
  const zipDownload = await zipPromise
  const zipChunks: Buffer[] = []
  for await (const chunk of await zipDownload.createReadStream()) {
    zipChunks.push(chunk as Buffer)
  }
  const zip = await JSZip.loadAsync(Buffer.concat(zipChunks))
  const pngNames = Object.keys(zip.files).filter((n) => n.endsWith(".png"))
  expect(pngNames).toHaveLength(2)
  for (const name of pngNames) {
    const buf = await zip.files[name]!.async("nodebuffer")
    expect(buf.readUInt32BE(16)).toBe(1440)
  }
  expect(await hosts()).toBe(hostsBefore)

  expect(errors).toEqual([])
})
