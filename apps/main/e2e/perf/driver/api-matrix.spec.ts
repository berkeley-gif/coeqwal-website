import { test, expect } from "@playwright/test"
import { appendResult } from "../support/results"

// Direct-API latency matrix: times the live endpoints behind the three load
// strategies (batch-all, per-scenario, per-subject) without the app in the
// loop. Complements the app-flow suite, which measures the same strategies
// end to end. Endpoint paths verified against
// packages/data/src/coeqwal/api.ts (DEFAULT_API_BASE + ENDPOINTS).
const API = "https://api.coeqwal.org/api"
const RUNS = Number(process.env.PERF_RUNS ?? 10)
const TYPES = ["storage", "cws", "ag", "env_flow"] as const

test("api latency matrix", async ({ request }) => {
  test.setTimeout(30 * 60_000)

  const scenariosResp = await request.get(`${API}/scenarios`)
  expect(scenariosResp.ok()).toBeTruthy()
  const scenarios = (await scenariosResp.json()) as Array<{
    short_code: string
    is_active: boolean
  }>
  const ids = scenarios
    .filter((s) => s.is_active)
    .map((s) => s.short_code)
    .slice(0, 6)
  expect(ids.length).toBeGreaterThanOrEqual(3)

  const startedAt = new Date().toISOString()

  async function timeGet(cell: string, run: number, url: string) {
    const t0 = Date.now()
    const resp = await request.get(url)
    const body = await resp.body()
    appendResult("api-matrix.jsonl", {
      suite: "api-matrix",
      cell,
      run,
      ms: Date.now() - t0,
      bytes: body.byteLength,
      status: resp.status(),
      url,
      startedAt,
    })
  }

  for (const n of [1, 3, 6]) {
    const subset = ids.slice(0, n)
    for (let run = 0; run < RUNS; run++) {
      // Strategy (a): one batch request for n scenarios, all types
      await timeGet(
        `batch-all n=${n}`,
        run,
        `${API}/statistics/batch?scenarios=${subset.join(",")}&types=${TYPES.join(",")}`,
      )

      // Strategy (b): per-scenario batch requests (all types each)
      const tb0 = Date.now()
      for (const id of subset) {
        await timeGet(
          `per-scenario n=${n} (each)`,
          run,
          `${API}/statistics/batch?scenarios=${id}&types=${TYPES.join(",")}`,
        )
      }
      appendResult("api-matrix.jsonl", {
        suite: "api-matrix",
        cell: `per-scenario n=${n} (sequential total)`,
        run,
        ms: Date.now() - tb0,
        bytes: null,
        status: null,
        url: null,
        startedAt,
      })

      // Strategy (c): per-scenario per-subject (one type per request)
      const tc0 = Date.now()
      for (const id of subset) {
        for (const type of TYPES) {
          await timeGet(
            `per-subject n=${n} (each)`,
            run,
            `${API}/statistics/batch?scenarios=${id}&types=${type}`,
          )
        }
      }
      appendResult("api-matrix.jsonl", {
        suite: "api-matrix",
        cell: `per-subject n=${n} (sequential total)`,
        run,
        ms: Date.now() - tc0,
        bytes: null,
        status: null,
        url: null,
        startedAt,
      })
    }
  }
})
