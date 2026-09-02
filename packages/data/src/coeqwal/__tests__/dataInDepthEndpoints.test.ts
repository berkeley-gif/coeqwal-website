import test from "node:test"
import assert from "node:assert/strict"

import { ENDPOINTS } from "../api"

// KNOWN LIMITATION: this file does not execute today. `node --test` cannot
// resolve the extensionless `../api` import (ERR_MODULE_NOT_FOUND before any
// test runs), and adding the `.ts` extension to fix that trips tsc
// (TS5097) unless the package opts into allowImportingTsExtensions. No repo
// script invokes it either: turbo has no test task and `test:ci-scripts`
// globs only `.github/scripts/*.test.mjs`. It is kept as executable
// documentation of the request contract; the assertions that actually GATE
// merges live in apps/main/e2e/did-mapping.spec.ts, which imports these same
// builders from source and runs in the e2e-core job.
//
// The wyt serialization below was corrected on 2026-08-21: URLSearchParams
// percent-encodes the separator, so the built path carries `wyt=1%2C3`, not
// `wyt=1,3`. Because nothing runs this file, the wrong expectation sat here
// undetected; that is the concrete cost of the limitation above.

test("salmon and system-deliveries endpoint builders match the shared data-in-depth contract", () => {
  assert.equal(
    ENDPOINTS.salmonDataInDepth(["s0065"], { include: ["values"] }),
    "/data-in-depth/salmon?scenarios=s0065&include=values",
  )

  assert.equal(
    ENDPOINTS.systemDeliveriesDataInDepth(["s0065"], { wyt: [3, 1] }),
    "/data-in-depth/system-deliveries?scenarios=s0065&wyt=1%2C3",
  )
})

test("cwsDataInDepth omits wyt by default", () => {
  const path = ENDPOINTS.cwsDataInDepth(["s0020"], { subjects: ["NOD_CWS"] })
  assert.ok(!path.includes("wyt="))
})

test("cwsDataInDepth throws on a smuggled wyt param", () => {
  // The CWS series aggregate by calendar year, so the filter cannot apply.
  // Throwing (rather than silently stripping) keeps a coordination failure
  // visible to the caller instead of buried in a request that quietly did
  // not filter.
  assert.throws(() =>
    ENDPOINTS.cwsDataInDepth(["s0020"], {
      subjects: ["NOD_CWS"],
      wyt: [1, 2],
    } as Parameters<typeof ENDPOINTS.cwsDataInDepth>[1] & { wyt: number[] }),
  )
})
