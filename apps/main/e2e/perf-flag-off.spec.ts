import { test, expect } from "@playwright/test"
import { setupNetwork } from "./support/network"

// Default builds (no NEXT_PUBLIC_PERF_LOG) must carry zero perf
// instrumentation surface: no window global, no perf marks.
test("perf instrumentation is absent from the default build", async ({
  page,
}) => {
  await setupNetwork(page)
  await page.goto("/")
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
