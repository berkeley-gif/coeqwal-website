import { test, expect, type Page } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"

// Share-tab layout at tablet widths (GitHub issue #253: card visualizations
// get cut off below desktop).
//
// The card artwork itself already scales - thumbnails are width 100% - so the
// cutoff is the OUTER layout: a non-responsive row of a fixed-width tray plus
// a story grid that forces two columns from MUI's md breakpoint (900px). At
// 768 to 1024px those exceed the viewport together and the page scrolls
// sideways.
//
// Measured before the fix: the page never scrolled sideways (the flex row
// clips rather than overflows), so overflow alone does not describe the bug.
// What was actually wrong is PROPORTION: the fixed 312px tray took 41% of a
// 768px viewport and 52% of a 600px one, leaving the story canvas - the
// surface the user actually works on - a strip too narrow to lay cards out
// in. So the assertions below cover both: no overflow (a regression guard
// that must keep holding) AND the canvas getting essentially the whole width
// once the tray stacks above it.

/** MUI's md breakpoint: where the tray stops stacking and sits beside the canvas. */
const DESKTOP_BREAKPOINT = 900
/** minmax() floor of the story grid's auto-fit columns. */
const STORY_CARD_MIN_WIDTH = 320

const WIDTHS = [
  { width: 768, height: 1024, name: "portrait tablet" },
  { width: 820, height: 1180, name: "larger portrait tablet" },
  { width: 1024, height: 768, name: "landscape tablet" },
]

/** Stages two share cards and lands on the Share tab. */
async function stageTwoCards(page: Page) {
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await expect(page.getByText(/^Sample data$/)).toBeVisible()

  await page.getByRole("button", { name: "save snapshot" }).click()
  // The share drawer auto-opens over the chart card and covers the save
  // button, so close it before staging a second card from another variable.
  await page
    .getByRole("button", { name: "Close share drawer" })
    .dispatchEvent("click")
  await page.getByRole("button", { name: "Groundwater storage" }).click()
  await page.getByRole("button", { name: "save snapshot" }).click()

  await page.getByRole("button", { name: "Go to Share" }).dispatchEvent("click")
  await expect(
    page.getByRole("button", { name: "Add to story" }).first(),
  ).toBeVisible()
  // Put both in the story so the canvas grid is exercised, not just the tray.
  const toggles = page.getByRole("button", { name: "Add to story" })
  const count = await toggles.count()
  for (let i = 0; i < count; i++) {
    await toggles.first().click()
  }
}

test("the share tab fits tablet widths without horizontal overflow", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await stageTwoCards(page)

  for (const size of WIDTHS) {
    await page.setViewportSize({ width: size.width, height: size.height })
    // Let the layout settle before measuring.
    await page.waitForTimeout(250)

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(
      overflow.scrollWidth,
      `page scrolls sideways at ${size.name} (${size.width}px)`,
    ).toBeLessThanOrEqual(overflow.clientWidth)

    const regions = await page.evaluate(() => {
      const box = (sel: string) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return {
          left: Math.round(r.left),
          right: Math.round(r.right),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          width: Math.round(r.width),
        }
      }
      return {
        tray: box('[data-share-region="tray"]'),
        canvas: box('[data-share-region="canvas"]'),
      }
    })
    expect(regions.tray, "tray region not found").not.toBeNull()
    expect(regions.canvas, "canvas region not found").not.toBeNull()
    const tray = regions.tray!
    const canvas = regions.canvas!

    // Both regions fit the viewport.
    expect(tray.right, `tray overhangs at ${size.name}`).toBeLessThanOrEqual(
      size.width + 1,
    )
    expect(
      canvas.right,
      `canvas overhangs at ${size.name}`,
    ).toBeLessThanOrEqual(size.width + 1)

    if (size.width < DESKTOP_BREAKPOINT) {
      // Below the desktop breakpoint the tray stacks ABOVE the canvas, so the
      // canvas gets essentially the full width instead of the remainder after
      // a fixed 312px column. 90% allows for the canvas's own padding.
      expect(
        tray.bottom,
        `tray still sits beside the canvas at ${size.name}`,
      ).toBeLessThanOrEqual(canvas.top + 1)
      expect(
        canvas.width / size.width,
        `canvas is only ${canvas.width}px of ${size.width}px at ${size.name}`,
      ).toBeGreaterThan(0.9)
    } else {
      // At and above the breakpoint the two sit side by side, and the canvas
      // must still be wide enough for the story grid to lay out two 320px
      // columns rather than collapsing to one.
      expect(
        canvas.left,
        `tray and canvas are not side by side at ${size.name}`,
      ).toBeGreaterThanOrEqual(tray.right - 1)
      expect(
        canvas.width,
        `canvas is too narrow for two story columns at ${size.name}`,
      ).toBeGreaterThan(2 * STORY_CARD_MIN_WIDTH)
    }
  }

  expect(errors).toEqual([])
})

// GitHub issue #250: the Share tab had no way to empty the tray. The store
// action already existed and the Explore drawer already used it; this was UI
// wiring only. The reload half is the part worth pinning: the store persists
// the tray, so a clear that does not flush would come back on refresh.
test("the share tab can clear the tray, and the empty state survives reload", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await stageTwoCards(page)

  const clear = page.getByRole("button", { name: "Clear share tray" })
  await expect(clear).toBeVisible()
  await clear.click()

  await expect(
    page.getByText(/No scenarios staged for sharing yet/),
  ).toBeVisible()
  // The action clears the STORY too, not just the tray, so no orphaned story
  // card can outlive the items it was built from.
  await expect(page.getByRole("button", { name: "Add to story" })).toHaveCount(
    0,
  )
  // The button itself goes away with the last item.
  await expect(clear).toHaveCount(0)

  await page.reload()
  await expect(
    page.getByText(/No scenarios staged for sharing yet/),
  ).toBeVisible()

  expect(errors).toEqual([])
})
