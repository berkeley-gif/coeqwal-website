import { test, expect } from "@playwright/test"
import type { ResilienceHeatmapCell } from "@repo/viz"
import {
  getIsCellMapped,
  getMappedCell,
} from "../app/features/scenarioExplorer/explorer/tools/panels/resilience/heatmap/cellUtils"

// Which Heatmap cell is the one on the map: the cell drawn outlined, and
// the one a second click takes off the map. Node-side spec (no browser).

function getCell(
  overrides: Partial<ResilienceHeatmapCell>,
): ResilienceHeatmapCell {
  return {
    rowKey: "CWS_DEL",
    colKey: "historical",
    continuousValue: 1.5,
    tierLevel: 2,
    available: true,
    rowLabel: "Community surface water",
    colLabel: "Historical",
    subjectLabel: "Current operations",
    scenarioId: "s0020",
    outcomeCode: "CWS_DEL",
    hydroclimate: "historical",
    ...overrides,
  }
}

// The map shows CWS_DEL for s0020's historical variant (id s0020); the
// group's moderate-stress variant resolves to s0025, and s0011 has no
// extreme-stress variant.
const MAPPED = { outcomeCode: "CWS_DEL", scenarioId: "s0020" }
const RESOLVED: Record<string, Record<string, string>> = {
  historical: { s0020: "s0020", s0011: "s0011" },
  ecv: { s0020: "s0025", s0011: "s0016" },
}
const getResolvedId = (groupId: string, hc: string) => RESOLVED[hc]?.[groupId]

function isMapped(
  cell: ResilienceHeatmapCell,
  active: { outcomeCode: string; scenarioId: string } | null = MAPPED,
  hydroclimate = "historical",
) {
  return getIsCellMapped(cell, active, getResolvedId, "s0020", hydroclimate)
}

test("a cell is mapped when it resolves to the scenario the map shows", () => {
  expect(isMapped(getCell({}))).toBe(true)
  // Nothing on the map.
  expect(isMapped(getCell({}), null)).toBe(false)
  // Same outcome and group under another hydroclimate: a different
  // resolved scenario, whatever hydroclimate the toolbar asks for.
  const ecvCell = getCell({ colKey: "ecv", hydroclimate: "ecv" })
  expect(isMapped(ecvCell)).toBe(false)
  expect(
    isMapped(ecvCell, { outcomeCode: "CWS_DEL", scenarioId: "s0025" }),
  ).toBe(true)
  // A climate that has not resolved never claims the map.
  expect(
    isMapped(getCell({ colKey: "tai", hydroclimate: "tai" }), {
      outcomeCode: "CWS_DEL",
      scenarioId: "s0020",
    }),
  ).toBe(false)
  // Another outcome, another scenario.
  expect(isMapped(getCell({ outcomeCode: "AG_REV" }))).toBe(false)
  expect(isMapped(getCell({ scenarioId: "s0011" }))).toBe(false)
  // An unavailable cell is never the mapped one.
  expect(isMapped(getCell({ available: false }))).toBe(false)
  // A cell without a scenario maps the fallback group; one without a
  // hydroclimate uses the current one.
  expect(
    isMapped(
      getCell({ scenarioId: undefined, hydroclimate: undefined }),
      { outcomeCode: "CWS_DEL", scenarioId: "s0025" },
      "ecv",
    ),
  ).toBe(true)
})

test("the mapped cell is found by tile and cell key", () => {
  const tiles = [
    { id: "s0011", title: "A", cells: [getCell({ scenarioId: "s0011" })] },
    {
      id: "s0020",
      title: "B",
      cells: [getCell({ colKey: "ecv", hydroclimate: "ecv" }), getCell({})],
    },
  ]
  expect(getMappedCell(tiles, (cell) => isMapped(cell))).toEqual({
    tileId: "s0020",
    cellKey: "CWS_DEL|historical",
  })
  expect(getMappedCell(tiles, () => false)).toBeNull()
})
