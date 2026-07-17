import { test, expect } from "@playwright/test"
import { setupNetwork } from "./support/network"

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
  // Panel is mounted and hydrated once the Explorer chart card renders: the
  // by-variable Explorer is the default mode and draws from the Current
  // Operations reference before any scenario selection, so the data-source
  // chip is the reliable ready marker (same wait as smoke.spec.ts).
  await expect(page.getByText(/^(Sample|Live) data$/)).toBeVisible()

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
