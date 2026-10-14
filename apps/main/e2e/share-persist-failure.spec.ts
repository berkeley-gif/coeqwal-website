import { test, expect } from "@playwright/test"
import { collectConsoleErrors, setupNetwork } from "./support/network"
import { selectCurrentOperations } from "./support/scenarioSelection"

// When the browser refuses to store the share tray (quota), the user is
// told, instead of losing the tray silently on reload.
test("a tray that cannot be saved shows a warning", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "coeqwal-share-v2") {
        throw new DOMException("quota", "QuotaExceededError")
      }
      return original.call(this, key, value)
    }
  })
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await selectCurrentOperations(page)
  await page.getByRole("button", { name: "save snapshot" }).click()
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "could not save your share tray" }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

// The durability half of the contract: normal saving keeps a populated
// tray, notes included, across a new save and a reload, with no warning.
test("a populated tray keeps every card and note across a reload", async ({
  page,
}) => {
  const errors = collectConsoleErrors(page)
  await setupNetwork(page)
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return
    sessionStorage.setItem("seeded", "1")
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#ddd"/></svg>'
    const items = [1, 2, 3].map((n) => ({
      id: `data-seed-${n}`,
      type: "data",
      variableId: "res_apr",
      view: "dist",
      distKind: "box",
      compareBy: "scenarios",
      memberIds: ["s0020"],
      memberLabels: ["Current operations"],
      source: "live",
      hydroclimate: "historical",
      note: `Seed note ${n}`,
      cachedSvg: svg,
      cachedChartData: { members: [{ isLive: true }] },
    }))
    localStorage.setItem(
      "coeqwal-share-v2",
      JSON.stringify({ version: 2, shareItems: items, storyItemIds: [] }),
    )
  })
  await page.goto("/explore")
  await page
    .getByRole("tab", { name: "Data in depth: Explore underlying data" })
    .click()
  await selectCurrentOperations(page)
  const readTray = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("coeqwal-share-v2") ?? "{}")
          .shareItems as { note?: string }[],
    )
  await page.getByRole("button", { name: "save snapshot" }).click()
  // The snapshot is captured before it is stored; wait for the write.
  await expect.poll(async () => (await readTray()).length).toBe(4)
  await page.reload()
  const stored = await readTray()
  expect(stored).toHaveLength(4)
  expect(stored.map((i) => i.note).filter(Boolean)).toEqual([
    "Seed note 1",
    "Seed note 2",
    "Seed note 3",
  ])
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "could not save your share tray" }),
  ).toHaveCount(0)
  expect(errors).toEqual([])
})
