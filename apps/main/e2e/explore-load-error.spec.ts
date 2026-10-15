import { test, expect } from "@playwright/test"
import { setupNetwork } from "./support/network"
import { selectCurrentOperations } from "./support/scenarioSelection"
import { getTierWording } from "./support/tierWording"
import { MODEL_RESULTS_LOAD_ERROR } from "../app/features/scenarioExplorer/explorer/tools/components/loadErrorText"

// When model results fail to load, a tool says so in a fixed sentence; the
// raw error (status line, API message) never reaches the page.

test("a failed model results request shows the fixed sentence, not the raw error", async ({
  page,
}) => {
  await setupNetwork(page)
  // The outcome list feeds every Bar card; when it fails (the data
  // provider retries twice) the tool reports the failure.
  await page.route("**/api/tiers/list", (route) =>
    route.fulfill({ status: 500, json: { detail: "tier list failed" } }),
  )
  await page.goto("/explore")
  await page.getByRole("tab", { name: /^Bar: / }).click()
  await selectCurrentOperations(page)
  await expect(page.getByText(MODEL_RESULTS_LOAD_ERROR)).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText(/tier list failed/)).toHaveCount(0)
  expect(await getTierWording(page)).toEqual([])
})
