import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { TOUR_EXAMPLE_NOTE } from "../app/features/scenarioExplorer/explorer/tools/components/scenarioPrompt"

// With nothing selected, Radar and Heatmap draw results only while their
// own tour runs. Every card says so, and the prompt returns when the tour
// ends. (Data in Depth, Bar and Distribution are covered in did-tour,
// explore-bar-tour and explore-tools.)

async function startTour(page: Page, tab: RegExp) {
  await page.getByRole("tab", { name: tab }).click()
  await expect(page.locator("[data-select-scenario-prompt]")).toBeVisible()
  await page
    .getByRole("button", { name: "Take the tour for this chart" })
    .click()
  await expect(page.getByRole("dialog")).toBeVisible()
}

for (const tool of [
  { name: "radar", tab: /^Radar: / },
  { name: "heatmap", tab: /^Heatmap: / },
]) {
  test(`the ${tool.name} tour notes example results with nothing selected`, async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page)
    await setupNetwork(page)
    await page.addInitScript(() => {
      // Started by hand below, not on the first visit.
      for (const t of ["radar", "bar", "equity", "resilience", "list"]) {
        window.localStorage.setItem(`coeqwal-tour-seen-${t}`, "true")
      }
    })
    await page.goto("/explore")
    await startTour(page, tool.tab)

    const card = page.getByRole("dialog")
    const note = card.getByTestId("tour-example-note")
    for (;;) {
      await expect(note).toHaveText(TOUR_EXAMPLE_NOTE)
      const next = card.getByRole("button", { name: "Next" })
      if ((await next.count()) === 0) break
      await next.click()
    }
    await card.getByRole("button", { name: "Finish" }).click()
    await expect(card).toHaveCount(0)
    await expect(page.locator("[data-select-scenario-prompt]")).toBeVisible()
    expect(errors).toEqual([])
  })
}
