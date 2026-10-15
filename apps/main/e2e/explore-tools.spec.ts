import { fileURLToPath } from "node:url"
import { test, expect, type Page } from "@playwright/test"
import {
  API_URL_PATTERN,
  collectConsoleErrors,
  setupNetwork,
} from "./support/network"
import { getTierWording } from "./support/tierWording"
import { HYDROCLIMATE_DEFS } from "../app/content/scenarios"

// Explore tools, offline: the empty-selection prompt on every sidebar tool,
// Data in Depth included; the map caption; Bar's and Heatmap's selected
// outcome on the map; and no "tier" wording anywhere a tool draws.
// Later changes extend this single test. It is one test on purpose: its HAR
// records per browser context, and a second test would overwrite the
// recording.
//
// Re-record after changing the flow (needs network):
//   RECORD_TOOLS_FIXTURES=1 pnpm exec playwright test explore-tools.spec.ts --workers=1

const TOOLS_HAR = fileURLToPath(
  new URL("./fixtures/tools/tools.har", import.meta.url),
)
const RECORDING = !!process.env.RECORD_TOOLS_FIXTURES
/** The explorer's background location prefetch for every scenario (see the
 *  route below). It asks for all nine outcomes at once, and the sorted code
 *  list it sends always starts with these three; the map's own requests ask
 *  for the multi-value outcomes only, or for one outcome, so they never
 *  match. */
const BACKGROUND_PREFETCH =
  /\/api\/tiers\/scenarios\/[^/]+\/locations\?codes=AG_REV,CWS_DEL,DELTA_ECO,/
/** Square map markers (TierMarkers); the map mounts offline because the
 *  build carries a placeholder Mapbox token, see ci.yml */
const SQUARE_MARKERS = "[data-marker-shape='square']"

async function openTool(page: Page, name: RegExp) {
  await page.getByRole("tab", { name }).click()
}

function showMapSwitch(page: Page) {
  return page
    .getByText("Show map", { exact: true })
    .locator("..")
    .locator('input[type="checkbox"]')
}

test("explore tools ask for a scenario before drawing", async ({ page }) => {
  const errors = collectConsoleErrors(page, {
    ignoreUrls: BACKGROUND_PREFETCH,
  })
  // This spec replays its own fixture: the shared api.har predates the
  // Explore tools' data calls. Replay aborts on a miss, so this fixture
  // alone must cover the whole flow.
  await setupNetwork(page, { har: TOOLS_HAR, recording: RECORDING })
  // Any API request that fails or returns an error status, other than the
  // refused prefetches, means the fixture is missing data this flow needs.
  const apiFailures: string[] = []
  const isTracked = (url: string) =>
    API_URL_PATTERN.test(url) && !BACKGROUND_PREFETCH.test(url)
  page.on("requestfailed", (request) => {
    if (isTracked(request.url())) apiFailures.push(request.url())
  })
  page.on("response", (response) => {
    if (isTracked(response.url()) && response.status() >= 400) {
      apiFailures.push(`${response.status()} ${response.url()}`)
    }
  })
  // The explorer warms a per-scenario location cache for every scenario in
  // the background (errors swallowed by design). Those responses are
  // megabytes and nothing here reads them, so they are refused in both
  // recording and replay; registered last, this route is consulted first.
  // The map layer's own location requests (for the scenario whose outcome
  // is mapped below) pass through to the fixture, so the markers can draw.
  await page.route(BACKGROUND_PREFETCH, (route) => route.abort())
  await page.addInitScript(() => {
    // Mark every tool tour seen: tours keep the chart up on purpose.
    for (const tool of ["radar", "bar", "equity", "resilience", "list"]) {
      window.localStorage.setItem(`coeqwal-tour-seen-${tool}`, "true")
    }
  })
  // The levels served for community surface water, by scenario id, so the
  // test can tell which climate variant the map actually drew.
  const servedLevels = new Map<string, number[]>()
  page.on("response", async (response) => {
    const m = response
      .url()
      .match(/\/api\/tiers\/scenarios\/([^/]+)\/locations\?codes=CWS_DEL$/)
    if (!m?.[1] || !response.ok()) return
    const body = (await response.json()) as {
      results?: Record<string, { locations?: Array<{ tier_level?: number }> }>
    }
    servedLevels.set(
      m[1],
      (body.results?.CWS_DEL?.locations ?? []).map((l) => l.tier_level ?? 0),
    )
  })
  /** Sorted counts per distinct value, e.g. [2, 5, 17, 50]. */
  const getSortedCounts = (values: Array<string | number>) =>
    [
      ...values
        .reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map())
        .values(),
    ].sort((a, b) => a - b)
  /** The map's markers grouped by color, as sorted counts. */
  const getMarkerColorCounts = async () =>
    getSortedCounts(
      await page
        .locator(SQUARE_MARKERS)
        .evaluateAll((els) =>
          els.map((el) => getComputedStyle(el).backgroundColor),
        ),
    )
  const scenarioList = page.waitForResponse((r) =>
    r.url().endsWith("/api/scenarios"),
  )
  await page.goto("/explore")
  const scenarios = (await (await scenarioList).json()) as Array<{
    short_code: string
    hydroclimate_id: number
    sibling_group: string
  }>
  /** The id current operations resolves to under a hydroclimate. */
  const currentOpsIn = (hydroclimate: string) =>
    scenarios.find(
      (s) =>
        s.sibling_group === "s0020" &&
        s.hydroclimate_id ===
          HYDROCLIMATE_DEFS.find((d) => d.value === hydroclimate)?.apiId,
    )?.short_code

  await openTool(page, /^Radar: /)
  await expect(
    page.getByText(
      "Select scenarios in the sidebar to compare them on the radar chart.",
    ),
  ).toBeVisible()
  // No saving a figure of a scenario nobody picked.
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeDisabled()

  await openTool(page, /^Distribution: /)
  await expect(
    page.getByText(
      "Select a scenario in the sidebar to see how its outcomes are distributed across locations.",
    ),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeDisabled()

  await openTool(page, /^Heatmap: /)
  await expect(
    page.getByText(
      "Select scenarios in the sidebar to see how they perform across hydroclimates.",
    ),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "save snapshot" }),
  ).toBeDisabled()
  // The scenario phrase must not claim the chart shows every scenario.
  await expect(page.getByText(/^all \d+ scenarios$/)).toHaveCount(0)
  await page.getByText("no scenarios picked", { exact: true }).click()
  await expect(page.getByText(/showing all/)).toHaveCount(0)
  await expect(page.getByText(/Leave none picked/)).toHaveCount(0)
  await page.keyboard.press("Escape")

  await openTool(page, /^Bar: /)
  await expect(
    page.getByText(
      "Select scenarios in the sidebar to compare their bar charts here.",
    ),
  ).toBeVisible()

  // Data in Depth asks too: no chart, no comparison controls, and no
  // current operations drawn behind the user's back.
  await openTool(page, /^Data in depth: /)
  await expect(
    page.getByText(
      "Select scenarios in the sidebar to explore their model results here.",
    ),
  ).toBeVisible()
  await expect(page.locator("[data-did-chart-state]")).toHaveCount(0)

  // A Distribution tour with no focus shows the grid; ending it brings the
  // prompt back and must not switch the map on.
  await openTool(page, /^Distribution: /)
  await page
    .getByRole("button", { name: "Take the tour for this chart" })
    .click()
  await expect(page.locator("[data-select-scenario-prompt]")).toHaveCount(0)
  // No tool or tour step says "tier": outcome levels go by name. The tour
  // is walked step by step, checking each populated card.
  // Walk until the last step, which offers Finish instead of Next.
  // Each card also notes that the grid is an example for the tour.
  for (;;) {
    expect(await getTierWording(page)).toEqual([])
    await expect(page.getByTestId("tour-example-note")).toBeVisible()
    const next = page.getByRole("button", { name: "Next" })
    if ((await next.count()) === 0) break
    await next.click()
  }
  await expect(page.getByRole("button", { name: "Finish" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(
    page.getByText(
      "Select a scenario in the sidebar to see how its outcomes are distributed across locations.",
    ),
  ).toBeVisible()
  await expect(showMapSwitch(page)).not.toBeChecked()

  // One selection clears the prompt on Radar and draws its chart (the
  // fixture must carry real tier data, not just let the prompt disappear).
  await openTool(page, /^Radar: /)
  const firstScenario = page
    .getByRole("checkbox", { name: /^Select .+ scenario$/ })
    .first()
  await firstScenario.check()
  await expect(page.locator("[data-select-scenario-prompt]")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: /^About / }).first(),
  ).toBeVisible()
  expect(await getTierWording(page)).toEqual([])

  // Deselecting brings the prompt back with no chart controls left over it.
  await firstScenario.uncheck()
  await expect(
    page.getByText(
      "Select scenarios in the sidebar to compare them on the radar chart.",
    ),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: /^About / })).toHaveCount(0)

  // Bar: the glyph sent to the map keeps a visible outline until the user
  // clears it, and the outline must not change the glyph's size (the border
  // stays 2px wide; only its color changes). palette.blue.bright is #449cd9.
  const ACTIVE_BORDER = "rgb(68, 156, 217)"
  const TRANSPARENT = /rgba\(0, 0, 0, 0\)|transparent/
  await firstScenario.check()
  await openTool(page, /^Bar: /)
  await page.getByRole("checkbox", { name: "Show map" }).check()
  // Bar's glyphs toggle the map, and their name says so (OutcomeGlyphItem's
  // actionLabel); the default "View details for" name stays on other glyphs.
  const glyph = page
    .getByRole("button", { name: /^Show .+ on the map$/ })
    .first()
  const border = () =>
    glyph.evaluate((el) => {
      const style = getComputedStyle(el)
      return `${style.borderTopWidth} ${style.borderTopColor}`
    })
  expect(await border()).toMatch(TRANSPARENT)
  expect(await border()).toMatch(/^2px /)
  // The state is announced, not only drawn: the glyph is a pressed toggle.
  await expect(glyph).toHaveAttribute("aria-pressed", "false")
  await expect(page.locator(SQUARE_MARKERS)).toHaveCount(0)
  await glyph.click()
  await expect.poll(border).toBe(`2px ${ACTIVE_BORDER}`)
  await expect(glyph).toHaveAttribute("aria-pressed", "true")
  // The outline and the map agree: the first glyph is community surface
  // water, which the current-operations scenario maps as 74 locations.
  const squares = page.locator(SQUARE_MARKERS)
  await expect(squares).toHaveCount(74)
  await expect(squares.first()).toHaveCSS("border-radius", "2px")
  // A hydroclimate switch re-resolves the scenario; outline and markers stay.
  await page
    .getByRole("button", { name: "Moderate climate stress", exact: true })
    .click()
  await expect(squares).toHaveCount(74)
  await expect.poll(border).toBe(`2px ${ACTIVE_BORDER}`)
  // Toggling again from the keyboard clears the map and the outline.
  await glyph.focus()
  await page.keyboard.press("Enter")
  await expect.poll(border).toMatch(TRANSPARENT)
  await expect.poll(border).toMatch(/^2px /)
  await expect(glyph).toHaveAttribute("aria-pressed", "false")
  await expect(squares).toHaveCount(0)

  // Map caption: with nothing mapped, the map carries no caption and no
  // hydroclimate badge (the toolbar already names the hydroclimate).
  const caption = page.getByRole("region", { name: "Map description" })
  const mapPanel = page.locator("[data-explore-map-panel]")
  await expect(mapPanel).toBeVisible()
  await expect(caption).toHaveCount(0)
  await expect(mapPanel.getByText(/hydroclimate$/)).toHaveCount(0)
  // Mapping an outcome names it, the strategy and the hydroclimate in the
  // figure-template rows, with the outcome level color key.
  await glyph.click()
  await expect(squares).toHaveCount(74)
  await expect(caption.getByText("Map", { exact: true })).toBeVisible()
  await expect(caption.getByText("Bar tool", { exact: true })).toBeVisible()
  await expect(caption.getByText("Outcome", { exact: true })).toBeVisible()
  await expect(
    caption.getByText("Community surface water", { exact: true }),
  ).toBeVisible()
  await expect(caption.getByText("Strategy", { exact: true })).toBeVisible()
  await expect(caption).toContainText("Current Operations")
  await expect(caption.getByText("Hydroclimate", { exact: true })).toBeVisible()
  await expect(
    caption.getByText("Moderate stress", { exact: true }),
  ).toBeVisible()
  // Each level name shares a span with its number ("1Optimal").
  const levels = caption.getByRole("group", {
    name: "Outcome level color legend",
  })
  for (const [n, level] of [
    [1, "Optimal"],
    [2, "Acceptable"],
    [3, "At-risk"],
    [4, "Critical"],
  ] as const) {
    await expect(levels).toContainText(`${n}${level}`)
  }
  expect(await getTierWording(page)).toEqual([])
  // Offline the Mapbox style never loads, so the map never becomes ready
  // and the save button stays disabled.
  await expect(caption.getByRole("button", { name: "save map" })).toBeDisabled()
  // A hydroclimate switch with the caption up: the map re-resolves to the
  // historical variant and the caption follows it.
  await page.getByRole("button", { name: "Historical", exact: true }).click()
  await expect(squares).toHaveCount(74)
  await expect(caption.getByText("Historical", { exact: true })).toBeVisible()
  await expect(
    caption.getByText("Moderate stress", { exact: true }),
  ).toHaveCount(0)
  // Clearing the map takes the caption away and leaves the map bare.
  await glyph.click()
  await expect(squares).toHaveCount(0)
  await expect(caption).toHaveCount(0)
  await expect(mapPanel.getByText(/hydroclimate$/)).toHaveCount(0)

  // Heatmap: the cell whose outcome is on the map keeps an outline (the
  // same blue as Bar's selected glyph); a second click on it, or Enter on
  // it, takes it off the map. Show map is still on and the first scenario
  // (current operations) still selected.
  const BLUE = "#449cd9"
  const HOVER = "#193D6B"
  const heatCell = (hydroclimate: string) =>
    page.locator(
      `rect.resilience-cell[data-row="CWS_DEL"][data-col="${hydroclimate}"]`,
    )
  const selectedCells = page.locator(
    'rect.resilience-cell[data-selected="true"]',
  )
  // Switching tools clears the map, so an outcome mapped from Bar leaves
  // nothing on the map or outlined when Heatmap opens.
  await glyph.click()
  await expect(squares).toHaveCount(74)
  await openTool(page, /^Heatmap: /)
  await expect(heatCell("historical")).toHaveCount(1)
  await expect(squares).toHaveCount(0)
  await expect(selectedCells).toHaveCount(0)
  expect(await getTierWording(page)).toEqual([])
  // A click maps the cell and outlines it at once, under the pointer
  // (thicker while hovered), and the cell reports itself pressed.
  await heatCell("historical").click()
  await expect(squares).toHaveCount(74)
  await expect(heatCell("historical")).toHaveAttribute("data-selected", "true")
  await expect(heatCell("historical")).toHaveAttribute("aria-pressed", "true")
  await expect(heatCell("historical")).toHaveAttribute("stroke", BLUE)
  await expect(heatCell("historical")).toHaveAttribute("stroke-width", "3")
  await page.mouse.move(0, 0)
  await expect(heatCell("historical")).toHaveAttribute("stroke-width", "2")
  await expect(selectedCells).toHaveCount(1)
  await expect(caption.getByText("Heatmap tool", { exact: true })).toBeVisible()
  // The markers carry the levels served for the historical variant.
  await expect
    .poll(getMarkerColorCounts)
    .toEqual(getSortedCounts(servedLevels.get(currentOpsIn("historical")!)!))
  // A redraw (here a resize, with focus outside the chart) keeps the
  // selection's outline and its announced pressed state on every cell.
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.setViewportSize({ width: 1180, height: 820 })
  await expect(heatCell("historical")).toHaveAttribute("aria-pressed", "true")
  await expect(heatCell("cc50")).toHaveAttribute("aria-pressed", "false")
  await expect(heatCell("historical")).toHaveAttribute("stroke", BLUE)
  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(heatCell("historical")).toHaveAttribute("aria-pressed", "true")
  // Switching rows and columns keeps the outline on the same cell.
  // (Its accessible name describes the current layout; its text does not
  // change.)
  const switchRowsAndColumns = page
    .getByRole("button")
    .filter({ hasText: "Switch rows and columns" })
  await switchRowsAndColumns.click()
  await expect(
    page.locator(
      'rect.resilience-cell[data-row="historical"][data-col="CWS_DEL"]',
    ),
  ).toHaveAttribute("data-selected", "true")
  await expect(selectedCells).toHaveCount(1)
  await switchRowsAndColumns.click()
  await expect(heatCell("historical")).toHaveAttribute("data-selected", "true")
  // Rearranging the chart keeps exactly the mapped cell outlined: with one
  // tile per outcome it sits in the community surface water tile, with
  // one tile per hydroclimate in the historical tile.
  const pickPivot = async (label: string) => {
    await page.getByRole("button", { name: /^Chart pivot:/ }).click()
    await page
      .locator(".MuiPopover-root")
      .getByRole("button", { name: label, exact: true })
      .click()
    await page.keyboard.press("Escape")
  }
  const getSelectedPlace = () =>
    selectedCells.evaluateAll((els) =>
      els.map((el) => ({
        tile: el.closest("[data-tile-id]")?.getAttribute("data-tile-id"),
        keys: [el.getAttribute("data-row"), el.getAttribute("data-col")].sort(),
      })),
    )
  await pickPivot("outcomes")
  await expect
    .poll(getSelectedPlace)
    .toEqual([{ tile: "CWS_DEL", keys: ["historical", "s0020"] }])
  await pickPivot("hydroclimates")
  await expect
    .poll(getSelectedPlace)
    .toEqual([{ tile: "historical", keys: ["CWS_DEL", "s0020"] }])
  await pickPivot("scenarios")
  await expect
    .poll(getSelectedPlace)
    .toEqual([{ tile: "s0020", keys: ["CWS_DEL", "historical"] }])
  await expect(squares).toHaveCount(74)
  // An unselected cell shows the hover outline while the pointer is on it.
  await heatCell("cc50").hover()
  await expect(heatCell("cc50")).toHaveAttribute("stroke", HOVER)
  // Its tooltip names the level, never a tier.
  await expect(
    page.getByText(/^(Optimal|Acceptable|At-risk|Critical) \(\d/),
  ).toBeVisible()
  expect(await getTierWording(page)).toEqual([])
  await page.mouse.move(0, 0)
  await expect(heatCell("cc50")).toHaveAttribute("stroke", "transparent")
  // Heatmap has no toolbar hydroclimate chooser (its columns are the
  // hydroclimates): a column click moves the map and the outline together,
  // without clearing the map.
  await expect(
    page.getByRole("button", { name: "Moderate climate stress", exact: true }),
  ).toHaveCount(0)
  await heatCell("ecv").click()
  await expect(
    caption.getByText("Moderate stress", { exact: true }),
  ).toBeVisible()
  await expect(squares).toHaveCount(74)
  // The map drew the moderate-stress variant of current operations (a
  // different scenario id, with different levels than the historical one).
  const ecvLevels = servedLevels.get(currentOpsIn("ecv")!)
  expect(ecvLevels).toBeDefined()
  expect(getSortedCounts(ecvLevels!)).not.toEqual(
    getSortedCounts(servedLevels.get(currentOpsIn("historical")!)!),
  )
  await expect.poll(getMarkerColorCounts).toEqual(getSortedCounts(ecvLevels!))
  await expect(selectedCells).toHaveCount(1)
  await expect(heatCell("ecv")).toHaveAttribute("data-selected", "true")
  await expect(heatCell("historical")).not.toHaveAttribute("data-selected")
  await expect(heatCell("historical")).toHaveAttribute("aria-pressed", "false")
  // A selection change restyles the cells in place: the same nodes stay.
  const otherCell = await heatCell("tai").elementHandle()
  await heatCell("ecv").click()
  await expect(squares).toHaveCount(0)
  await expect(caption).toHaveCount(0)
  await expect(selectedCells).toHaveCount(0)
  expect(await otherCell!.evaluate((el) => el.isConnected)).toBe(true)
  // From the keyboard: the chart is one tab stop; arrow keys move between
  // cells, Enter maps the focused cell and Enter again clears it.
  await page.mouse.move(0, 0)
  await heatCell("historical").focus()
  await page.keyboard.press("ArrowRight")
  await expect(heatCell("ecv")).toBeFocused()
  // Keyboard focus is visible: the focused cell takes the hover outline.
  await expect(heatCell("ecv")).toHaveAttribute("stroke", HOVER)
  await expect(heatCell("ecv")).toHaveAttribute("tabindex", "0")
  await expect(heatCell("historical")).toHaveAttribute("tabindex", "-1")
  await page.keyboard.press("Enter")
  await expect(squares).toHaveCount(74)
  await expect(heatCell("ecv")).toHaveAttribute("aria-pressed", "true")
  await expect(heatCell("ecv")).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(squares).toHaveCount(0)
  await expect(heatCell("ecv")).toHaveAttribute("aria-pressed", "false")
  // Hiding the map clears it and the outline; showing it again starts
  // empty until a cell is chosen.
  await heatCell("historical").click()
  await expect(selectedCells).toHaveCount(1)
  await page.getByRole("checkbox", { name: "Show map" }).uncheck()
  await expect(selectedCells).toHaveCount(0)
  await page.getByRole("checkbox", { name: "Show map" }).check()
  await expect(squares).toHaveCount(0)
  await expect(selectedCells).toHaveCount(0)

  expect(apiFailures).toEqual([])
  expect(errors).toEqual([])
})
