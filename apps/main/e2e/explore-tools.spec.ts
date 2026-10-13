import { fileURLToPath } from "node:url"
import { test, expect, type Page } from "@playwright/test"
import {
  API_URL_PATTERN,
  collectConsoleErrors,
  setupNetwork,
} from "./support/network"

// Explore tools, offline: the empty-selection prompt on every sidebar tool.
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
  await page.goto("/explore")

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

  // A Distribution tour with no focus shows the grid; ending it brings the
  // prompt back and must not switch the map on.
  await openTool(page, /^Distribution: /)
  await page
    .getByRole("button", { name: "Take the tour for this chart" })
    .click()
  await expect(page.locator("[data-select-scenario-prompt]")).toHaveCount(0)
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

  expect(apiFailures).toEqual([])
  expect(errors).toEqual([])
})
