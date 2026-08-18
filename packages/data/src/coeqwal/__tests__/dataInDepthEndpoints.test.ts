import test from "node:test"
import assert from "node:assert/strict"

import { ENDPOINTS } from "../api"

test("salmon and system-deliveries endpoint builders match the shared data-in-depth contract", () => {
  assert.equal(
    ENDPOINTS.salmonDataInDepth(["s0065"], { include: ["values"] }),
    "/data-in-depth/salmon?scenarios=s0065&include=values",
  )

  assert.equal(
    ENDPOINTS.systemDeliveriesDataInDepth(["s0065"], { wyt: [3, 1] }),
    "/data-in-depth/system-deliveries?scenarios=s0065&wyt=1,3",
  )
})
