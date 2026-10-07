import { fileURLToPath } from "node:url"
import { test, expect } from "@playwright/test"
import {
  API_URL_PATTERN,
  collectConsoleErrors,
  setupNetwork,
} from "./support/network"

// The Bar tour with nothing selected. Its steps anchor on a card's glyphs,
// pin and share controls, which only exist while a card is drawn, so the
// panel draws the current-operations card for the tour and brings the
// prompt back when the tour ends. This spec has its own fixture; it shares
// the fixture directory with explore-tools.spec.ts so identical response
// bodies are stored once.
//
// Re-record after changing the flow (needs network):
//   RECORD_BAR_TOUR_FIXTURES=1 pnpm exec playwright test explore-bar-tour.spec.ts --workers=1

const BAR_TOUR_HAR = fileURLToPath(
  new URL("./fixtures/tools/bar-tour.har", import.meta.url),
)
const RECORDING = !!process.env.RECORD_BAR_TOUR_FIXTURES
/** Background per-scenario location prefetches, refused like the tools spec */
const PREFETCH_LOCATIONS = /\/api\/tiers\/scenarios\/[^/]+\/locations/
/** Anchored steps of the Bar tour, in order, after the centered hero */
const ANCHORED_STEPS = 8

test("the bar tour draws a card to anchor on, then the prompt returns", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page, { ignoreUrls: PREFETCH_LOCATIONS })
  await setupNetwork(page, { har: BAR_TOUR_HAR, recording: RECORDING })
  const apiFailures: string[] = []
  const isTracked = (url: string) =>
    API_URL_PATTERN.test(url) && !PREFETCH_LOCATIONS.test(url)
  page.on("requestfailed", (request) => {
    if (isTracked(request.url())) apiFailures.push(request.url())
  })
  page.on("response", (response) => {
    if (isTracked(response.url()) && response.status() >= 400) {
      apiFailures.push(`${response.status()} ${response.url()}`)
    }
  })
  await page.route(PREFETCH_LOCATIONS, (route) => route.abort())
  await page.addInitScript(() => {
    // Every tour counts as seen; the Bar tour is started by hand below.
    for (const tool of ["radar", "bar", "equity", "resilience", "list"]) {
      window.localStorage.setItem(`coeqwal-tour-seen-${tool}`, "true")
    }
  })
  await page.goto("/explore")
  await page.getByRole("tab", { name: /^Bar: / }).click()

  const prompt = page.getByText(
    "Select scenarios in the sidebar to compare their bar charts here.",
  )
  const panel = page.getByRole("main")
  // Outcome names only render with a card (header row and glyph labels).
  // The label breaks across two lines with no space in its text content.
  const outcomeLabel = panel.getByText(/Community\s*surface water/)
  await expect(prompt).toBeVisible()
  await expect(outcomeLabel).toHaveCount(0)

  await page
    .getByRole("button", { name: "Take the tour for this chart" })
    .click()
  const tour = page.getByRole("dialog")
  await expect(tour).toBeVisible()
  // The prompt gives way to the current-operations card...
  await expect(page.locator("[data-select-scenario-prompt]")).toHaveCount(0)
  await expect(outcomeLabel.first()).toBeVisible()
  // ...and the sidebar selection is untouched.
  await expect(
    page.getByRole("checkbox", { name: /^Select .+ scenario$/, checked: true }),
  ).toHaveCount(0)

  // Every anchored step finds its element: the highlight ring is drawn only
  // when the step's anchor resolved (a missing anchor centers the card).
  const ring = page.locator("[data-tour-highlight-ring]")
  for (let step = 1; step <= ANCHORED_STEPS; step++) {
    await tour.getByRole("button", { name: "Next" }).click()
    await expect(ring, `step ${step} should be anchored`).toHaveCount(1)
  }

  // Ending the tour brings the prompt back and clears the card.
  await page.keyboard.press("Escape")
  await expect(tour).toHaveCount(0)
  await expect(prompt).toBeVisible()
  await expect(outcomeLabel).toHaveCount(0)

  expect(apiFailures).toEqual([])
  expect(errors).toEqual([])
})
