import { test, expect } from "@playwright/test"
import {
  CHIP_CLOUD_MAX,
  levelUnavailableIds,
  levelViewBlockedReason,
  locationOptionGroups,
  usesLocationPicker,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/explorer/locationOptions"
import {
  LOCATION_GROUPS,
  LEVEL_VIEW_UNAVAILABLE_REASON,
} from "../app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/config/variableRegistry"

// Location groups with many members (the 132 ag demand units, the 74 and 63
// community water systems, the 44 groundwater basins) render as a grouped
// select instead of a chip cloud. The option groups are built by a pure
// helper: aggregates first, then North of Delta, then South of Delta, with
// optional exclusions (already-selected members) and disabled ids (T3's
// aggregates on the Level view). Node-side spec, runs in e2e-core.

test("large groups use the picker and small groups keep the chip cloud", () => {
  expect(CHIP_CLOUD_MAX).toBe(12)
  expect(usesLocationPicker(LOCATION_GROUPS.agregions)).toBe(true)
  expect(usesLocationPicker(LOCATION_GROUPS.cws)).toBe(true)
  expect(usesLocationPicker(LOCATION_GROUPS.cwsShortage)).toBe(true)
  expect(usesLocationPicker(LOCATION_GROUPS.basins)).toBe(true)
  expect(usesLocationPicker(LOCATION_GROUPS.reservoirs)).toBe(false)
  expect(usesLocationPicker(LOCATION_GROUPS.rivers)).toBe(false)
  expect(usesLocationPicker(LOCATION_GROUPS.sysregions)).toBe(false)
})

test("locationOptionGroups orders aggregates, North of Delta, South of Delta", () => {
  const groups = locationOptionGroups(LOCATION_GROUPS.cws)
  expect(groups.map((g) => g.label)).toEqual([
    "Aggregates",
    "North of Delta",
    "South of Delta",
  ])
  expect(groups[0]?.options.map((o) => o.value)).toEqual([
    "AGG_CWS_NOD",
    "AGG_CWS_SOD",
  ])
  const north = groups[1]?.options ?? []
  const south = groups[2]?.options ?? []
  expect(north.length + south.length).toBe(74)
  expect(north.map((o) => o.value)).toContain("26N_NU1")
  expect(south.map((o) => o.value)).toContain("MWD")
  expect(south.find((o) => o.value === "MWD")?.label).toBe(
    "MWD - Metropolitan Water District of Southern California",
  )
})

test("locationOptionGroups can exclude selected ids and disable others, dropping empty groups", () => {
  const groups = locationOptionGroups(LOCATION_GROUPS.cws, {
    exclude: ["AGG_CWS_NOD", "AGG_CWS_SOD"],
    disabled: ["MWD"],
  })
  expect(groups.map((g) => g.label)).toEqual([
    "North of Delta",
    "South of Delta",
  ])
  const mwd = groups[1]?.options.find((o) => o.value === "MWD")
  expect(mwd?.disabled).toBe(true)
  expect(groups.every((g) => g.options.length > 0)).toBe(true)
})

test("locationOptionGroups keeps a group with no regional split as one list", () => {
  // A small group without NOD/SOD entities is still expressible: the
  // reservoirs have regions, so they split; the salmon group has one item.
  const salmon = locationOptionGroups(LOCATION_GROUPS.salmon)
  expect(salmon.map((g) => g.label)).toEqual(["North of Delta"])
})

// The Level view rule, as pure functions the pickers and the view bar share:
// which members of a group cannot show the Level view, and why the Level
// toggle is blocked for the current selection (or null when it is not).
test("levelUnavailableIds names the groundwater totals and nothing else", () => {
  expect(levelUnavailableIds(LOCATION_GROUPS.basins)).toEqual([
    "AGG_GW_NOD",
    "AGG_GW_SOD",
  ])
  expect(levelUnavailableIds(LOCATION_GROUPS.reservoirs)).toEqual([])
  const groups = locationOptionGroups(LOCATION_GROUPS.basins, {
    disabled: levelUnavailableIds(LOCATION_GROUPS.basins),
  })
  expect(groups[0]?.options.every((o) => o.disabled)).toBe(true)
  expect(groups[1]?.options.some((o) => o.disabled)).toBe(false)
})

test("levelViewBlockedReason blocks Level for a pinned or selected total, never for a basin", () => {
  const basins = LOCATION_GROUPS.basins
  expect(levelViewBlockedReason(basins, "scenarios", "AGG_GW_NOD", [])).toBe(
    LEVEL_VIEW_UNAVAILABLE_REASON,
  )
  expect(levelViewBlockedReason(basins, "climates", "AGG_GW_SOD", [])).toBe(
    LEVEL_VIEW_UNAVAILABLE_REASON,
  )
  expect(levelViewBlockedReason(basins, "scenarios", "WBA10", [])).toBeNull()
  // On the Locations axis the compared members decide, not the pin.
  expect(
    levelViewBlockedReason(basins, "locations", "AGG_GW_NOD", [
      "WBA10",
      "WBA20",
    ]),
  ).toBeNull()
  expect(
    levelViewBlockedReason(basins, "locations", "WBA10", [
      "WBA10",
      "AGG_GW_SOD",
    ]),
  ).toBe(LEVEL_VIEW_UNAVAILABLE_REASON)
  // Groups without the capability flag are never blocked.
  expect(
    levelViewBlockedReason(
      LOCATION_GROUPS.reservoirs,
      "scenarios",
      "AGG_NOD",
      [],
    ),
  ).toBeNull()
})
