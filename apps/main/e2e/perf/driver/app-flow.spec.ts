import { test, expect } from "@playwright/test"
import { appendResult } from "../support/results"
import { clearPerf, harvestPerf, waitForMark } from "../support/harvest"

// End-to-end app flow against a flag-on build/dev server at PERF_BASE_URL.
// Cold cells use a fresh browser context per run; warm cells re-select the
// same scenarios in the same page (SWR cache + 60s dedupe window).
//
// Scenario ids are workspace-format sibling-group ids (validated against the
// running app: the List-tab checkboxes commit exactly these into
// workspace.selectedScenarios). Override with PERF_SCENARIOS=a,b,c.
// `|| 10` also covers empty/non-numeric PERF_RUNS (Number("") is 0, NaN is
// falsy), so a bad value cannot silently produce a zero-iteration green run.
const RUNS = Math.max(1, Number(process.env.PERF_RUNS) || 10)
const SCENARIO_IDS = (process.env.PERF_SCENARIOS ?? "s0020,s0025,s0030").split(
  ",",
)

const DID_TAB = /Data in depth/

async function openDataInDepth(page: import("@playwright/test").Page) {
  await page.goto("/explore")
  await page.getByRole("tab", { name: DID_TAB }).click({ timeout: 30_000 })
  // Explicit timeout: with no configured actionTimeout this would otherwise
  // inherit the (long) test timeout and hang for the full hour when the
  // target app is broken instead of failing the run fast.
  await page.waitForFunction(() => !!window.__coeqwalPerf, undefined, {
    timeout: 30_000,
  })
}

async function selectScenarios(
  page: import("@playwright/test").Page,
  ids: string[],
) {
  await page.evaluate(
    (sel) => window.__coeqwalPerf?.actions.selectScenarios?.(sel),
    ids,
  )
}

test.describe("app flow latency", () => {
  test("cold and warm selection to paint", async ({ browser }) => {
    test.setTimeout(60 * 60_000)
    const startedAt = new Date().toISOString()
    const n = SCENARIO_IDS.length

    for (let run = 0; run < RUNS; run++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await openDataInDepth(page)

      // Cold: fresh context, single-commit selection, wait for paint.
      // The explorer chart is the tool's only surface since the category
      // view left the default flow (July 30 content round), so the
      // explorer-chart mark is the "charts on screen" signal.
      await clearPerf(page)
      await selectScenarios(page, SCENARIO_IDS)
      await waitForMark(page, "paint:explorer-chart")
      appendResult("app-flow.jsonl", {
        suite: "app-flow",
        cell: `cold n=${n}`,
        run,
        startedAt,
        records: await harvestPerf(page),
      })

      // Warm: clear selection, re-select the same ids inside the SWR
      // dedupe window, wait for the re-armed paint mark
      await selectScenarios(page, [])
      await clearPerf(page)
      await selectScenarios(page, SCENARIO_IDS)
      await waitForMark(page, "paint:explorer-chart")
      appendResult("app-flow.jsonl", {
        suite: "app-flow",
        cell: `warm n=${n}`,
        run,
        startedAt,
        records: await harvestPerf(page),
      })

      await context.close()
    }
  })

  test("compute bench", async ({ page }) => {
    await openDataInDepth(page)
    await page.waitForFunction(() => !!window.__coeqwalPerf?.bench)
    const results = await page.evaluate(() => window.__coeqwalPerf?.bench?.(10))
    expect(Array.isArray(results)).toBeTruthy()
    appendResult("compute-bench.jsonl", {
      suite: "compute-bench",
      startedAt: new Date().toISOString(),
      results,
    })
  })
})
