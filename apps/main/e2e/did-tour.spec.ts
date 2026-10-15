import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { DATA_TOUR } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/tour/steps"
import { selectCurrentOperations } from "./support/scenarioSelection"
import { TOUR_EXAMPLE_NOTE } from "../app/features/scenarioExplorer/explorer/tools/components/scenarioPrompt"

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
  // Nothing is selected: the tour draws current operations for its steps
  // to point at, and the selection itself stays empty.
  await expect(page.locator('[data-did-chart-state="drawn"]')).toBeVisible()
  await expect(
    page.getByRole("checkbox", { name: "Select Current operations scenario" }),
  ).not.toBeChecked()

  const first = DATA_TOUR[0]
  const last = DATA_TOUR[DATA_TOUR.length - 1]
  expect(first).toBeDefined()
  expect(last).toBeDefined()

  // Scoped to the tour card: a step title can repeat a control's own label
  // (the save-snapshot step does), which would otherwise match two elements.
  const card = page.getByRole("dialog")
  await expect(card.getByText(first!.title)).toBeVisible()
  // The drawn chart goes away when the tour ends, so every card says it is
  // an example, and the dialog's description includes that note.
  const note = card.getByTestId("tour-example-note")
  await expect(note).toHaveText(TOUR_EXAMPLE_NOTE)
  const noteInDescription = new RegExp(
    TOUR_EXAMPLE_NOTE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  )
  await expect(card).toHaveAccessibleDescription(noteInDescription)

  // The note must be readable. Axe cannot judge contrast under the tour's
  // scrim, so compute the WCAG ratio from the note's own colors (it paints
  // its own background).
  const ratio = await note.evaluate((el) => {
    const cs = getComputedStyle(el)
    const lum = (rgb: string) => {
      const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
      const lin = (c: number) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!)
    }
    const [hi, lo] = [lum(cs.color), lum(cs.backgroundColor)].sort(
      (a, b) => b - a,
    )
    return (hi! + 0.05) / (lo! + 0.05)
  })
  expect(ratio).toBeGreaterThanOrEqual(4.5)

  // Ticking a scenario mid-tour draws the user's own choice, so the note
  // goes; unticking brings it back. The step does not change.
  const currentOps = page.getByRole("checkbox", {
    name: "Select Current operations scenario",
  })
  await currentOps.check()
  await expect(note).toHaveCount(0)
  await currentOps.uncheck()
  await expect(note).toBeVisible()
  await expect(card.getByText(first!.title)).toBeVisible()

  // Every step renders its own card, in order, without throwing. The note
  // makes cards taller, so each card, note included, must stay on screen
  // and keep the note in its description.
  const viewport = page.viewportSize()!
  const isOnScreen = async (
    box: Awaited<ReturnType<typeof note.boundingBox>>,
  ) =>
    !!box &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  for (let i = 1; i < DATA_TOUR.length; i++) {
    await page.getByRole("button", { name: "Next" }).click()
    await expect(card.getByText(DATA_TOUR[i]!.title)).toBeVisible()
    await expect(note).toBeVisible()
    await expect(card).toHaveAccessibleDescription(noteInDescription)
    await expect
      .poll(async () => isOnScreen(await card.boundingBox()), {
        message: `step ${i} card stays on screen`,
      })
      .toBe(true)
  }

  // The last step finishes rather than advancing.
  await page.getByRole("button", { name: "Finish" }).click()
  await expect(card).toHaveCount(0)
  // With the tour over and nothing selected, the tool asks for a scenario.
  await expect(page.locator("[data-select-scenario-prompt]")).toBeVisible()

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
  await selectCurrentOperations(page)
  await expect(page.locator('[data-did-chart-state="drawn"]')).toBeVisible()
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
    // The chart is the user's own selection, so no example note.
    await expect(card.getByTestId("tour-example-note")).toHaveCount(0)
  }
})
