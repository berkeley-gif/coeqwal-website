import { fileURLToPath } from "node:url"
import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

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
/** Background per-scenario location prefetches (see the route below) */
const PREFETCH_LOCATIONS = /\/api\/tiers\/scenarios\/[^/]+\/locations/

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
  const errors = collectConsoleErrors(page, { ignoreUrls: PREFETCH_LOCATIONS })
  // This spec replays its own fixture: the shared api.har predates the
  // Explore tools' data calls. Replay aborts on a miss, so this fixture
  // alone must cover the whole flow.
  await setupNetwork(page, { har: TOOLS_HAR, recording: RECORDING })
  // The explorer warms a per-scenario location cache for every scenario in
  // the background (errors swallowed by design). Those responses are
  // megabytes and nothing here reads them, so they are refused in both
  // recording and replay; registered last, this route is consulted first.
  await page.route(PREFETCH_LOCATIONS, (route) => route.abort())
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

  // One selection clears the prompt on Radar.
  await openTool(page, /^Radar: /)
  await page
    .getByRole("checkbox", { name: /^Select .+ scenario$/ })
    .first()
    .check()
  await expect(page.locator("[data-select-scenario-prompt]")).toHaveCount(0)

  expect(errors).toEqual([])
})
