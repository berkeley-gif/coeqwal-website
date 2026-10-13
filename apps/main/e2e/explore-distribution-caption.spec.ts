import { fileURLToPath } from "node:url"
import { test, expect } from "@playwright/test"
import {
  API_URL_PATTERN,
  collectConsoleErrors,
  setupNetwork,
} from "./support/network"

// Distribution's map caption. Distribution draws its own markers, so it
// publishes what they show (outcomes, scenario, hydroclimate, comparison)
// for the caption. This spec has its own fixture; it shares the fixture
// directory with explore-tools.spec.ts so identical response bodies are
// stored once.
//
// Re-record after changing the flow (needs network):
//   RECORD_DISTRIBUTION_CAPTION_FIXTURES=1 pnpm exec playwright test explore-distribution-caption.spec.ts --workers=1

const DISTRIBUTION_CAPTION_HAR = fileURLToPath(
  new URL("./fixtures/tools/distribution-caption.har", import.meta.url),
)
const RECORDING = !!process.env.RECORD_DISTRIBUTION_CAPTION_FIXTURES
/** The explorer's background all-outcome location prefetch, refused like
 *  the tools spec (see BACKGROUND_PREFETCH there) */
const BACKGROUND_PREFETCH =
  /\/api\/tiers\/scenarios\/[^/]+\/locations\?codes=AG_REV,CWS_DEL,DELTA_ECO,/
const MARKERS = "[data-marker-shape]"
/** Single-outcome tier requests for current operations: Distribution's
 *  baseline when comparing another scenario */
const BASELINE_TIERS =
  /\/api\/tiers\/scenarios\/s0020\/locations\?codes=[A-Z_]+$/
const STRATEGY = "Groundwater Pumping Limits in the San Joaquin Valley"

test("distribution's map caption describes its painted markers", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page, {
    ignoreUrls: BACKGROUND_PREFETCH,
  })
  await setupNetwork(page, {
    har: DISTRIBUTION_CAPTION_HAR,
    recording: RECORDING,
  })
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
  await page.route(BACKGROUND_PREFETCH, (route) => route.abort())
  // Distribution fetches the baseline's tier data as soon as it opens, so
  // hold those responses from the start to see the caption before they
  // land.
  let holdBaseline = true
  let heldBaseline = 0
  let releaseBaseline: () => void = () => {}
  const baselineReleased = new Promise<void>((resolve) => {
    releaseBaseline = resolve
  })
  await page.route(BASELINE_TIERS, async (route) => {
    if (holdBaseline) {
      heldBaseline += 1
      await baselineReleased
    }
    await route.fallback()
  })
  await page.addInitScript(() => {
    for (const tool of ["radar", "bar", "equity", "resilience", "list"]) {
      window.localStorage.setItem(`coeqwal-tour-seen-${tool}`, "true")
    }
  })
  await page.goto("/explore")
  await page.getByRole("tab", { name: /^Distribution: / }).click()
  const showMap = page.getByRole("checkbox", { name: "Show map" })
  await showMap.check()

  const caption = page.getByRole("region", { name: "Map description" })
  const markers = page.locator(MARKERS)
  // Focus a scenario other than the baseline (Distribution is
  // single-select), so comparison needs the baseline's own tier data.
  await page
    .getByText("Groundwater pumping limits in the San Joaquin Valley", {
      exact: true,
    })
    .first()
    .click()
  const dots = page.locator(".tier-dot")
  await expect(dots.first()).toBeVisible()
  await expect(caption).toHaveCount(0)

  // Selecting a grid square paints its location and captions it.
  await dots.first().click()
  await expect(markers).toHaveCount(1)
  await expect(
    caption.getByText("Distribution tool", { exact: true }),
  ).toBeVisible()
  await expect(caption.getByText("Outcome", { exact: true })).toBeVisible()
  await expect(caption.getByText(STRATEGY, { exact: true })).toBeVisible()
  await expect(caption.getByText("Historical", { exact: true })).toBeVisible()

  // Comparison mode repaints the markers. Until the baseline's tier data
  // lands every marker shows no change, so the caption claims no
  // comparison; once it lands, it says what the markers compare with.
  await page.getByRole("button", { name: "Compare to Baseline" }).click()
  expect(heldBaseline).toBeGreaterThan(0)
  await expect(markers).toHaveCount(1)
  await expect(caption.getByText(STRATEGY, { exact: true })).toBeVisible()
  holdBaseline = false
  releaseBaseline()
  await expect(caption).toContainText(
    `${STRATEGY}, Compared with Current Operations`,
  )
  await expect(
    page.getByRole("group", { name: "Comparison marker legend" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Compare to Baseline" }).click()
  await expect(caption).not.toContainText("Compared with")

  // Closing the map hides the caption; a hydroclimate change while it is
  // closed must not reopen it.
  await showMap.uncheck()
  await expect(caption).toHaveCount(0)
  await page
    .getByRole("button", { name: "Moderate climate stress", exact: true })
    .click()
  // Let the new hydroclimate's tier data arrive and the grid repaint
  // before checking: the reopen came from that repaint.
  await page.waitForLoadState("networkidle")
  await expect(dots.first()).toBeVisible()
  await expect(showMap).not.toBeChecked()
  await expect(caption).toHaveCount(0)

  // A grid selection the user makes opens the closed map; caption and
  // markers agree, under the new hydroclimate.
  await dots.first().click()
  await expect(showMap).toBeChecked()
  await expect(markers).toHaveCount(1)
  await expect(
    caption.getByText("Moderate stress", { exact: true }),
  ).toBeVisible()

  // Clearing the map selection removes the markers and the caption.
  await page.getByRole("button", { name: /^Clear Map/ }).click()
  await expect(markers).toHaveCount(0)
  await expect(caption).toHaveCount(0)

  expect(apiFailures).toEqual([])
  expect(errors).toEqual([])
})
