import { test, expect } from "@playwright/test"
import { setupNetwork } from "./support/network"
import { getTierWording } from "./support/tierWording"

// Bar chart cards saved before levels were shown by name carry "Tier N"
// labels in their stored chart data. The Share page reads them as level
// names, in the glyphs' accessible labels as well as the legend.

test("a stored bar chart card with Tier N labels never says tier", async ({
  page,
}) => {
  await setupNetwork(page)
  await page.addInitScript(() => {
    const levels = (values: number[]) =>
      values.map((value, i) => ({
        label: `Tier ${i + 1}`,
        color: ["#1ca367", "#31b2c5", "#f2944f", "#ee5d32"][i],
        value,
        rawCount: value,
        tierType: "multi_value",
      }))
    const item = {
      id: "bar-a",
      type: "barChart",
      scenarioId: "s0020",
      viewMode: "bar",
      hydroclimate: "historical",
      capturedAt: "2026-09-01T12:00:00Z",
      cachedChartData: {
        CWS_DEL: levels([40, 30, 20, 10]),
        AG_REV: levels([10, 20, 30, 40]),
      },
    }
    window.localStorage.setItem(
      "coeqwal-share-v2",
      JSON.stringify({ version: 2, shareItems: [item], storyItemIds: [] }),
    )
  })
  await page.goto("/share")
  const glyph = page
    .getByRole("img", { name: /outcome level distribution: / })
    .first()
  await expect(glyph).toBeVisible()
  await expect(glyph).toHaveAccessibleName(/40% Optimal, 30% Acceptable/)
  expect(await getTierWording(page)).toEqual([])
  // Share card glyphs carry no hover tooltip (the live tools wrap them in
  // one); the card's legend names the levels instead.
  await expect(
    page.getByRole("group", { name: "Outcome level color legend" }),
  ).toContainText("1Optimal")
})
