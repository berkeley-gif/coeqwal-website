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
  // Focus the baseline scenario (Distribution is single-select).
  await page.getByText("Current operations", { exact: true }).first().click()
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
  await expect(
    caption.getByText("Current Operations", { exact: true }),
  ).toBeVisible()
  await expect(caption.getByText("Historical", { exact: true })).toBeVisible()

  // Comparison mode repaints the markers and says what they compare with.
  await page.getByRole("button", { name: "Compare to Baseline" }).click()
  await expect(caption).toContainText(
    "Current Operations, Compared with Current Operations",
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
  await expect(dots.first()).toBeVisible()
  await expect(showMap).not.toBeChecked()
  await expect(caption).toHaveCount(0)

  // Reopened, caption and markers agree, under the new hydroclimate.
  await showMap.check()
  await dots.first().click()
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
