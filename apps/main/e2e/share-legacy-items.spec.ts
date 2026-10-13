import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Share items saved before the figure template (no figureSpec) keep their
// original card with every fact it showed; items that carry a figureSpec
// render in the template. Users keep their tray in localStorage across
// releases, so both must work from stored data alone.

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#eee"/></svg>'

test("legacy and template data items render from storage", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.addInitScript((svg) => {
    // Seed once: the reload below must read what the app itself saved.
    if (window.localStorage.getItem("coeqwal-share-v2")) return
    const base = {
      type: "data",
      variableId: "res_apr",
      view: "dist",
      distKind: "box",
      compareBy: "climates",
      memberIds: ["historical", "cc50"],
      memberLabels: ["Historical", "Moderate stress"],
      source: "live",
      hydroclimate: "historical",
      cachedSvg: svg,
    }
    const legacy = {
      ...base,
      id: "data-legacy-1",
      note: "Kept note",
      cachedChartData: {
        figureTitle:
          "April Reservoir Storage (Shasta Reservoir), Current Operations, 2 Hydroclimates, All Water Years",
        waterYearTypesLabel: "All years",
        unitLabel: "thousand acre-feet",
      },
    }
    const templated = {
      ...base,
      id: "data-new-1",
      figureSpec: {
        toolLabel: "Data in depth",
        chartKindLabel: "Box plot",
        values: {
          variable: "April Reservoir Storage (TAF)",
          location: "Shasta Reservoir",
          strategy: "Current Operations",
          waterYears: "All Water Years",
        },
        compared: "hydroclimate",
      },
    }
    window.localStorage.setItem(
      "coeqwal-share-v2",
      JSON.stringify({
        version: 2,
        shareItems: [legacy, templated],
        storyItemIds: [legacy.id, templated.id],
      }),
    )
  }, SVG)
  await page.goto("/share")
  const canvas = page.locator('[data-share-region="canvas"]')

  // Legacy card: the old title and facts are all still there.
  await expect(
    canvas.getByText(
      "April Reservoir Storage (Shasta Reservoir), Current Operations, 2 Hydroclimates, All Water Years",
    ),
  ).toBeVisible()
  await expect(canvas.getByText("Compared", { exact: true })).toBeVisible()
  await expect(canvas.getByText("Units", { exact: true })).toBeVisible()
  await expect(canvas.getByText("Kept note")).toBeVisible()

  // Template card: chart kind, rows, legend heading, source heading.
  await expect(canvas.getByText("Box plot", { exact: true })).toBeVisible()
  await expect(
    canvas.getByText("Shasta Reservoir", { exact: true }),
  ).toBeVisible()
  await expect(canvas.getByText("Hydroclimate", { exact: true })).toBeVisible()
  await expect(canvas.getByText("Source", { exact: true })).toBeVisible()

  // Both images render inline, and everything survives a reload.
  await expect(canvas.locator("svg rect[fill='#eee']")).toHaveCount(2)
  await page.reload()
  await expect(canvas.getByText("Kept note")).toBeVisible()
  await expect(canvas.getByText("Box plot", { exact: true })).toBeVisible()

  // A legacy card exports the same way as a template card: when its live
  // capture fails, no bare cached chart goes out under its name, and the
  // user is told. (html-to-image rasterizes through a canvas.)
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toDataURL = () => {
      throw new Error("forced capture failure (test)")
    }
  })
  const notice = page.locator("[data-share-export-notice]")
  await expect(notice).toHaveCount(0)
  await canvas.getByRole("button", { name: "Download as PNG" }).first().click()
  await expect(notice).toContainText(
    "could not be exported as a PNG, so nothing was downloaded",
  )

  expect(errors).toEqual([])
})

// Figures saved while the site could show sample data are dropped on load
// (and from the story order): the site shows model results only, so a stored
// sample or mixed figure must never render or export again.
test("stored sample and mixed data figures are dropped on load", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.addInitScript((svg) => {
    if (window.localStorage.getItem("coeqwal-share-v2")) return
    const item = (id: string, source: string, note: string) => ({
      id,
      type: "data",
      variableId: "res_apr",
      view: "dist",
      distKind: "box",
      compareBy: "scenarios",
      memberIds: ["s0020"],
      memberLabels: ["Current operations"],
      source,
      hydroclimate: "historical",
      note,
      cachedSvg: svg,
    })
    const items = [
      item("data-live", "live", "Model results note"),
      item("data-mock", "mock", "Sample note"),
      item("data-mixed", "mixed", "Mixed note"),
    ]
    window.localStorage.setItem(
      "coeqwal-share-v2",
      JSON.stringify({
        version: 2,
        shareItems: items,
        storyItemIds: items.map((i) => i.id),
      }),
    )
  }, SVG)
  await page.goto("/share")
  const canvas = page.locator('[data-share-region="canvas"]')
  await expect(canvas.getByText("Model results note")).toBeVisible()
  await expect(canvas.getByText("Sample note")).toHaveCount(0)
  await expect(canvas.getByText("Mixed note")).toHaveCount(0)
  await expect(page.getByText(/sample data/i)).toHaveCount(0)
  expect(errors).toEqual([])
})

// A share link minted for a sample figure restores nothing for that item;
// the model-results item in the same link restores normally.
test("a share link drops its sample data figures", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  // Data token: variable.view.distKind.compareBy.members.source.hydroclimate
  await page.goto(
    "/share?v=1&items=d.res_apr.dist.box.scenarios.s0020.live.,d.ag_rev.dist.box.scenarios.s0020.mock.",
  )
  const canvas = page.locator(
    '[data-share-region="canvas"], [data-share-region="tray"]',
  )
  await expect(
    canvas.getByText("April reservoir storage").first(),
  ).toBeVisible()
  await expect(canvas.getByText("Gross crop revenues")).toHaveCount(0)
  await expect(page.getByText(/sample data/i)).toHaveCount(0)
  expect(errors).toEqual([])
})
