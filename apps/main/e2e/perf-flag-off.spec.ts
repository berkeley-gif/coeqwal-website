import { test, expect } from "@playwright/test"
import { setupNetwork } from "./support/network"
import { selectCurrentOperations } from "./support/scenarioSelection"

// Default builds (no NEXT_PUBLIC_PERF_LOG) must carry zero perf
// instrumentation surface: no window global, no perf marks. The explore
// route exercises every gate: DataProvider (registerPerfGlobal + SWR
// middleware), the explorer storeInstance subscription (select: marks and
// the selectScenarios action), and the Data in Depth panel mount
// (paint: marks, bench registration).
test("perf instrumentation is absent from the default build", async ({
  page,
}) => {
  await setupNetwork(page)
  await page.goto("/explore")
  await page.getByRole("tab", { name: /Data in depth/ }).click()
  await selectCurrentOperations(page)
  // Panel is mounted and hydrated once the Explorer chart card draws the
  // selected scenario (same wait as smoke.spec.ts).
  await expect(page.locator('[data-did-chart-state="drawn"]')).toBeVisible()

  const hasPerfGlobal = await page.evaluate(() => "__coeqwalPerf" in window)
  expect(hasPerfGlobal).toBe(false)
  const perfMarks = await page.evaluate(() =>
    performance
      .getEntriesByType("mark")
      .filter(
        (m) => m.name.startsWith("select:") || m.name.startsWith("paint:"),
      )
      .map((m) => m.name),
  )
  expect(perfMarks).toEqual([])
})
