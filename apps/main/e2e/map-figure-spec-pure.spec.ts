import { test, expect } from "@playwright/test"
import {
  getMapFigureInput,
  getMapSaveRequest,
  mapFigureSpec,
  type MapFigureState,
} from "../app/features/scenarioExplorer/explorer/tools/chrome/layout/mapFigureSpec"
import { buildFigureTemplate } from "../app/features/scenarioExplorer/explorer/share/figureTemplate"

test("nothing on the map means no caption", () => {
  expect(
    mapFigureSpec({
      mode: "bar",
      outcomeNames: [],
      scenarioLabel: "Current operations",
      hydroclimateLabel: "Historical",
      comparedWithBaseline: false,
    }),
  ).toBeNull()
})

test("one outcome from Bar names outcome, strategy, hydroclimate", () => {
  const spec = mapFigureSpec({
    mode: "bar",
    outcomeNames: ["Environmental flows"],
    scenarioLabel: "Current operations",
    hydroclimateLabel: "Moderate stress",
    comparedWithBaseline: false,
  })
  const t = buildFigureTemplate(spec!)
  expect(t.toolLabel).toBe("Map")
  expect(t.chartKindLabel).toBe("Bar tool")
  expect(t.rows.map((r) => [r.label, r.value])).toEqual([
    ["Outcome", "Environmental flows"],
    ["Strategy", "Current Operations"],
    ["Hydroclimate", "Moderate stress"],
  ])
  expect(t.legendHeading).toBe("Tier")
})

test("distribution comparison names the baseline", () => {
  const t = buildFigureTemplate(
    mapFigureSpec({
      mode: "equity",
      outcomeNames: ["Agricultural revenue", "Community surface water"],
      scenarioLabel: "Groundwater pumping limits in the San Joaquin Valley",
      hydroclimateLabel: "Historical",
      comparedWithBaseline: true,
    })!,
  )
  expect(t.chartKindLabel).toBe("Distribution tool")
  expect(t.rows[0]?.value).toBe("Agricultural revenue, Community surface water")
  expect(t.rows[1]?.value).toBe(
    "Groundwater Pumping Limits in the San Joaquin Valley, Compared with Current Operations",
  )
})

test("unknown scenario label is omitted, not printed as null", () => {
  const t = buildFigureTemplate(
    mapFigureSpec({
      mode: "radar",
      outcomeNames: ["Reservoir storage"],
      scenarioLabel: null,
      hydroclimateLabel: null,
      comparedWithBaseline: false,
    })!,
  )
  expect(t.rows.map((r) => r.label)).toEqual(["Outcome"])
})

// Scenario list rows: s0020 is the historical variant (API hydroclimate 2),
// s0020_ecv-like ids stand for its other variants. "s9999" has no local
// metadata, so its label comes from the list.
const SCENARIOS: MapFigureState["scenarios"] = [
  { scenarioId: "s0020", hydroclimateId: 2, shortLabel: "Current operations" },
  { scenarioId: "v-ecv", hydroclimateId: 7, shortLabel: "Current operations" },
  { scenarioId: "s9999", hydroclimateId: 2, shortLabel: "A strategy" },
]

function rowsFor(state: MapFigureState) {
  const spec = mapFigureSpec(getMapFigureInput(state))
  return spec
    ? buildFigureTemplate(spec).rows.map((r) => [r.label, r.value])
    : null
}

test("the caption names the hydroclimate of the variant the map draws", () => {
  const base: MapFigureState = {
    mode: "bar",
    active: {
      outcomeCode: "CWS_DEL",
      scenarioId: "v-ecv",
      siblingGroupId: "s0020",
    },
    distribution: null,
    scenarios: SCENARIOS,
  }
  expect(rowsFor(base)).toEqual([
    ["Outcome", "Community surface water"],
    ["Strategy", "Current Operations"],
    ["Hydroclimate", "Moderate stress"],
  ])
  // The workspace moved on (a switch in flight, or a hydroclimate with no
  // variant) but the map still draws the historical variant: say so.
  expect(
    rowsFor({
      ...base,
      active: { ...base.active!, scenarioId: "s0020" },
    })?.at(-1),
  ).toEqual(["Hydroclimate", "Historical"])
  // A variant missing from the scenario list gets no hydroclimate row
  // rather than a guess from the controls.
  expect(rowsFor({ ...base, scenarios: [] })?.map(([label]) => label)).toEqual([
    "Outcome",
    "Strategy",
  ])
})

test("a scenario without local metadata is named from the scenario list", () => {
  expect(
    rowsFor({
      mode: "radar",
      active: {
        outcomeCode: "AG_REV",
        scenarioId: "s9999",
        siblingGroupId: "s9999",
      },
      distribution: null,
      scenarios: SCENARIOS,
    })?.[1],
  ).toEqual(["Strategy", "A Strategy"])
})

test("Distribution describes its painted markers, not the current controls", () => {
  const state: MapFigureState = {
    mode: "equity",
    // A leftover Bar visualization must not leak into Distribution.
    active: { outcomeCode: "RES_STOR", scenarioId: "s0020" },
    distribution: {
      outcomeCodes: ["CWS_DEL", "AG_REV"],
      scenarioId: "s0020",
      hydroclimate: "ecv",
      comparedWithBaseline: true,
      locationKeys: ["CWS_DEL:02_PU", "AG_REV:WBA_10"],
    },
    scenarios: SCENARIOS,
  }
  expect(rowsFor(state)).toEqual([
    ["Outcome", "Community surface water, Agricultural revenue"],
    ["Strategy", "Current Operations, Compared with Current Operations"],
    ["Hydroclimate", "Moderate stress"],
  ])
  expect(rowsFor({ ...state, distribution: null })).toBeNull()
})

test("a saved map carries what the caption says, for the drawn variant", () => {
  const request = getMapSaveRequest({
    mode: "bar",
    active: {
      outcomeCode: "CWS_DEL",
      scenarioId: "v-ecv",
      siblingGroupId: "s0020",
    },
    distribution: null,
    scenarios: SCENARIOS,
  })
  expect(request).toEqual({
    key: "tiers|CWS_DEL|v-ecv",
    tool: "bar",
    outcomeCodes: ["CWS_DEL"],
    scenarioId: "s0020",
    hydroclimate: "ecv",
    comparedWithBaseline: false,
    captionText:
      "Community surface water | Current Operations | Moderate stress",
  })
  // An unknown drawn variant has no hydroclimate, so it cannot be saved.
  expect(
    getMapSaveRequest({
      mode: "bar",
      active: { outcomeCode: "CWS_DEL", scenarioId: "v-unknown" },
      distribution: null,
      scenarios: SCENARIOS,
    }).hydroclimate,
  ).toBeNull()
  expect(
    getMapSaveRequest({
      mode: "radar",
      active: null,
      distribution: null,
      scenarios: SCENARIOS,
    }).key,
  ).toBe("")
})

test("a saved Distribution map carries its painted snapshot", () => {
  const request = getMapSaveRequest({
    mode: "equity",
    active: null,
    distribution: {
      outcomeCodes: ["CWS_DEL"],
      scenarioId: "s9999",
      hydroclimate: "cc95",
      comparedWithBaseline: true,
      locationKeys: ["CWS_DEL:02_PU"],
    },
    scenarios: SCENARIOS,
  })
  expect(request).toMatchObject({
    key: "equity|CWS_DEL:02_PU|s9999|1",
    tool: "equity",
    outcomeCodes: ["CWS_DEL"],
    scenarioId: "s9999",
    hydroclimate: "cc95",
    comparedWithBaseline: true,
  })
  expect(request.captionText).toBe(
    "Community surface water | A Strategy, Compared with Current Operations | High stress",
  )
})
