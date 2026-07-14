import { test, expect } from "@playwright/test"

// Node-side specs for the perf core module. No browser, no webServer.
// The flag is read dynamically from process.env, so tests toggle it inline.

test.beforeEach(async () => {
  process.env.NEXT_PUBLIC_PERF_LOG = "1"
  const { clearPerfRecords } = await import("@repo/data/perf")
  clearPerfRecords()
})

test("pushPerfRecord buffers records when the flag is on", async () => {
  const { pushPerfRecord, getPerfRecords } = await import("@repo/data/perf")
  pushPerfRecord({ kind: "mark", name: "t", t: 1 })
  expect(getPerfRecords()).toHaveLength(1)
  expect(getPerfRecords()[0]).toMatchObject({ kind: "mark", name: "t" })
})

test("pushPerfRecord is a no-op when the flag is off", async () => {
  process.env.NEXT_PUBLIC_PERF_LOG = "0"
  const { pushPerfRecord, getPerfRecords } = await import("@repo/data/perf")
  pushPerfRecord({ kind: "mark", name: "t", t: 1 })
  expect(getPerfRecords()).toHaveLength(0)
})

test("perfMark records a mark with detail", async () => {
  const { perfMark, getPerfRecords } = await import("@repo/data/perf")
  perfMark("select:scenarios", { count: 3 })
  const records = getPerfRecords()
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({
    kind: "mark",
    name: "select:scenarios",
    detail: { count: 3 },
  })
})

test("perfTime returns the fn result and records a measure", async () => {
  const { perfTime, getPerfRecords } = await import("@repo/data/perf")
  const out = perfTime("transform:test", () => 42)
  expect(out).toBe(42)
  const records = getPerfRecords()
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({ kind: "measure", name: "transform:test" })
  expect((records[0] as { durMs?: number }).durMs).toBeGreaterThanOrEqual(0)
})

test("perfTime does not record when the flag is off but still runs fn", async () => {
  process.env.NEXT_PUBLIC_PERF_LOG = "0"
  const { perfTime, getPerfRecords } = await import("@repo/data/perf")
  expect(perfTime("x", () => "y")).toBe("y")
  expect(getPerfRecords()).toHaveLength(0)
})

test("buffer is bounded", async () => {
  const { pushPerfRecord, getPerfRecords } = await import("@repo/data/perf")
  for (let i = 0; i < 5100; i++) {
    pushPerfRecord({ kind: "mark", name: `m${i}`, t: i })
  }
  const records = getPerfRecords()
  expect(records.length).toBeLessThanOrEqual(5000)
  expect(records[records.length - 1]).toMatchObject({ name: "m5099" })
})
