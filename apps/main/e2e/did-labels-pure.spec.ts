import { test, expect } from "@playwright/test"
import { axisLabelFor } from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/explorer/chartMarks"
import {
  VARIABLES,
  getVariable,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"

// Y-axis labels per Ted's Aug 23 board: every chart in thousand acre-feet
// reads "thousand acre feet (TAF)" instead of the bare unit (n91, n96, n99,
// n100 plus the consistency extension), X2 reads "distance of X2 from Golden
// Gate (km)" (n101), and percent, feet, proportion and dollar axes keep the
// unit. The helper is pure and takes the view-resolved unit the card already
// computes, so the Stats mean panel and the distribution charts cannot
// disagree. Node-side spec, runs in e2e-core.

test("TAF axes carry the long thousand acre feet label", () => {
  expect(axisLabelFor(getVariable("res_apr"), "dist", "TAF")).toBe(
    "thousand acre feet (TAF)",
  )
  expect(axisLabelFor(getVariable("gw_stor"), "dist", "TAF")).toBe(
    "thousand acre feet (TAF)",
  )
  expect(axisLabelFor(getVariable("swp_mi"), "dist", "TAF")).toBe(
    "thousand acre feet (TAF)",
  )
  expect(axisLabelFor(getVariable("ndo"), "dist", "TAF")).toBe(
    "thousand acre feet (TAF)",
  )
  for (const v of Object.values(VARIABLES)) {
    if (v.unit === "TAF" && !v.axisLabel) {
      expect(axisLabelFor(v, "dist", "TAF"), v.id).toBe(
        "thousand acre feet (TAF)",
      )
    }
  }
})

test("X2 axes read the distance from the Golden Gate", () => {
  expect(axisLabelFor(getVariable("x2_apr"), "dist", "km")).toBe(
    "distance of X2 from Golden Gate (km)",
  )
  expect(axisLabelFor(getVariable("x2_sep"), "dist", "km")).toBe(
    "distance of X2 from Golden Gate (km)",
  )
})

test("non-TAF axes keep their unit and the CV view reads CV", () => {
  expect(axisLabelFor(getVariable("res_apr"), "pct", "%")).toBe("%")
  expect(axisLabelFor(getVariable("gw_stor"), "level", "ft")).toBe("ft")
  expect(axisLabelFor(getVariable("ag_short"), "pct_demand", "%")).toBe("%")
  expect(axisLabelFor(getVariable("ag_rev"), "dist", "$M")).toBe("$M")
  expect(axisLabelFor(getVariable("res_apr"), "cv", "")).toBe("CV")
  // A registry axisLabel (salmon) still wins over the unit rule.
  expect(axisLabelFor(getVariable("salmon_abund"), "dist", "proportion")).toBe(
    getVariable("salmon_abund")!.axisLabel,
  )
  // No variable resolved: the unit rule still applies, so a TAF chart never
  // shows the bare unit and any other unit stands.
  expect(axisLabelFor(undefined, "dist", "TAF")).toBe(
    "thousand acre feet (TAF)",
  )
  expect(axisLabelFor(undefined, "dist", "%")).toBe("%")
})
