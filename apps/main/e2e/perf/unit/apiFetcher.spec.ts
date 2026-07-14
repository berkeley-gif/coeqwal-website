import { test, expect } from "@playwright/test"

// Node-side specs driving apiFetcher against a stubbed global fetch.
// Asserts the PerfApiRecord contract from the latency measurement plan.

const realFetch = global.fetch

function jsonResponse(body: unknown, status = 200): Response {
  const text = JSON.stringify(body)
  return new Response(text, {
    status,
    headers: { "content-length": String(text.length) },
  })
}

test.beforeEach(async () => {
  process.env.NEXT_PUBLIC_PERF_LOG = "1"
  const { clearPerfRecords } = await import("@repo/data/perf")
  clearPerfRecords()
})

test.afterEach(() => {
  global.fetch = realFetch
})

test("success emits one api record with parse and size fields", async () => {
  global.fetch = (async () => jsonResponse({ ok: true })) as typeof fetch
  const { apiFetcher } = await import("@repo/data/fetching")
  const { getPerfRecords } = await import("@repo/data/perf")

  const data = await apiFetcher<{ ok: boolean }>("/api/x", {
    baseUrl: "http://test.local",
  })

  expect(data).toEqual({ ok: true })
  const apiRecords = getPerfRecords().filter((r) => r.kind === "api")
  expect(apiRecords).toHaveLength(1)
  expect(apiRecords[0]).toMatchObject({
    url: "http://test.local/api/x",
    status: 200,
    attempts: 1,
    timedOut: false,
    transferBytes: 11,
    decodedChars: 11,
  })
  expect((apiRecords[0] as { totalMs: number }).totalMs).toBeGreaterThanOrEqual(
    0,
  )
  expect((apiRecords[0] as { parseMs: number }).parseMs).toBeGreaterThanOrEqual(
    0,
  )
})

test("non-retryable failure emits a failure record", async () => {
  global.fetch = (async () => jsonResponse({ err: 1 }, 500)) as typeof fetch
  const { apiFetcher } = await import("@repo/data/fetching")
  const { getPerfRecords } = await import("@repo/data/perf")

  await expect(
    apiFetcher("/api/x", { baseUrl: "http://test.local" }),
  ).rejects.toThrow("HTTP 500")

  const apiRecords = getPerfRecords().filter((r) => r.kind === "api")
  expect(apiRecords).toHaveLength(1)
  expect(apiRecords[0]).toMatchObject({
    status: 500,
    attempts: 1,
    timedOut: false,
    netMs: null,
    parseMs: null,
  })
})

test("retryable failure then success counts attempts", async () => {
  let calls = 0
  global.fetch = (async () => {
    calls += 1
    return calls === 1 ? jsonResponse({}, 503) : jsonResponse({ ok: 1 })
  }) as typeof fetch
  const { apiFetcher } = await import("@repo/data/fetching")
  const { getPerfRecords } = await import("@repo/data/perf")

  const data = await apiFetcher<{ ok: number }>("/api/x", {
    baseUrl: "http://test.local",
  })

  expect(data).toEqual({ ok: 1 })
  const apiRecords = getPerfRecords().filter((r) => r.kind === "api")
  expect(apiRecords).toHaveLength(1)
  expect(apiRecords[0]).toMatchObject({ status: 200, attempts: 2 })
  // includes the 1s backoff sleep
  expect((apiRecords[0] as { totalMs: number }).totalMs).toBeGreaterThan(900)
})

test("flag off: no records, response.json path", async () => {
  process.env.NEXT_PUBLIC_PERF_LOG = "0"
  let jsonCalled = false
  const resp = jsonResponse({ ok: true })
  const origJson = resp.json.bind(resp)
  resp.json = async () => {
    jsonCalled = true
    return origJson()
  }
  global.fetch = (async () => resp) as typeof fetch
  const { apiFetcher } = await import("@repo/data/fetching")
  const { getPerfRecords } = await import("@repo/data/perf")

  const data = await apiFetcher<{ ok: boolean }>("/api/x", {
    baseUrl: "http://test.local",
  })

  expect(data).toEqual({ ok: true })
  expect(jsonCalled).toBe(true)
  expect(getPerfRecords()).toHaveLength(0)
})
