import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { DATA_TOUR } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/tour/steps"

// The Data in Depth tour auto-starts on the tool's first visit. The shared
// network setup marks it seen for every other spec, so this one clears the
// key to get the real first-visit behavior, then walks every step.

test("the data in depth tour auto-starts, walks every step, and closes", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.addInitScript(() => {
    window.localStorage.removeItem("coeqwal-tour-seen-data")
  })
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()

  const first = DATA_TOUR[0]
  const last = DATA_TOUR[DATA_TOUR.length - 1]
  expect(first).toBeDefined()
  expect(last).toBeDefined()

  // Scoped to the tour card: a step title can repeat a control's own label
  // (the save-snapshot step does), which would otherwise match two elements.
  const card = page.getByRole("dialog")
  await expect(card.getByText(first!.title)).toBeVisible()

  // Every step renders its own card, in order, without throwing.
  for (let i = 1; i < DATA_TOUR.length; i++) {
    await page.getByRole("button", { name: "Next" }).click()
    await expect(card.getByText(DATA_TOUR[i]!.title)).toBeVisible()
  }

  // The last step finishes rather than advancing.
  await page.getByRole("button", { name: "Finish" }).click()
  await expect(card).toHaveCount(0)

  // The journey strip offers the tour again for a second run.
  await page
    .getByRole("button", { name: "Take the tour for this chart" })
    .click()
  await expect(card.getByText(first!.title)).toBeVisible()
  await page.getByRole("button", { name: "Close tour" }).click()
  await expect(card).toHaveCount(0)

  expect(errors).toEqual([])
})

test("every anchored tour step resolves to an element on the tool", async ({
  page,
}) => {
  await setupNetwork(page)
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()
  await page
    .getByRole("button", { name: "Take the tour for this chart" })
    .click()

  // A step whose anchor never registers falls back to a centered card, which
  // is easy to miss in review. The runner tags the resolved anchor element
  // with data-tour-highlight, so assert exactly one tagged element on every
  // anchored step and none on the bookends.
  const card = page.getByRole("dialog")
  for (let i = 0; i < DATA_TOUR.length; i++) {
    const step = DATA_TOUR[i]!
    if (i > 0) await page.getByRole("button", { name: "Next" }).click()
    await expect(card.getByText(step.title)).toBeVisible()
    await expect(page.locator("[data-tour-highlight]")).toHaveCount(
      step.anchorId ? 1 : 0,
    )
  }
})
