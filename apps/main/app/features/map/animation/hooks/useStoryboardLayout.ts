"use client"

/* useStoryboardLayout: turns screen polygons into the Beat 2 two-column outcome
 * grid, the morph windows, and the per-outcome feature hide schedule the engine
 * reads. One of the TierAnimationSection hooks (see README.md).
 */

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import type { ShapeMorphData } from "@repo/viz"
import {
  type OutcomeGroup,
  getOutcomeProgressRange,
  computeDistributionHeight,
} from "../OutcomeMorphOverlay"
import {
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../../map/config/outcomeLayerRegistry"
import { getDemandUnitDisplayName } from "../../../map/config/demandUnitNames"
import {
  OUTCOME_CODE_ORDER,
  getOutcomeName,
  type OutcomeCode,
} from "../../../../content/outcomes"
import { BACKDROP_FADE_IN_PROGRESS } from "../animationTiming"
import type { HideScheduleEntry } from "../engine"
import type { OutcomeLocationData } from "../useTierAnimationData"
import type { ScreenPolygon } from "./useScreenPolygonProjection"
import type { Beat2Layout, Beat2LayoutItem, GlyphRect } from "../overlayTypes"

interface LayoutParams {
  allScreenPolygons: Map<string, ScreenPolygon>
  outcomeLocations: Record<string, OutcomeLocationData>
  tierOverrides: Record<string, OutcomeLocationData>
  panelSize: { width: number; height: number } | null
  outcomeDisplayOrder: readonly { code: string; label: string }[]
  activeOutcomes: ReadonlySet<string>
  /** Per-outcome hide schedule, written here and read by the parent's engine
   *  context (`getHideSchedule`). */
  hideScheduleRef: React.RefObject<HideScheduleEntry[]>
}

interface LayoutResult {
  activeOutcomeGroups: OutcomeGroup[]
  locationNameMap: Record<string, string>
  locationNameMapRef: React.RefObject<Record<string, string>>
  outcomeMorphWindows: Record<string, { start: number; end: number }>
  outcomeLayout: Beat2Layout | null
  handleGlyphLayoutChange: (layout: Record<string, GlyphRect>) => void
  distributionPositionMap: Record<
    string,
    { x: number; y: number; maxWidth: number; slotHeight: number }
  >
}

/* ── Right-panel grid: order and column split ──────────────────────────────
 *
 * The nine outcomes are listed in two columns on steps 3-6.
 *
 * ORDER: LEADING_CODES come first, then the rest in OUTCOME_CODE_ORDER.
 * AG_REV leads because it is the first outcome to morph (step 3), so its
 * squares land at the top left. Don't reorder OUTCOME_CODE_ORDER itself:
 * the radar axes and the NOD/SOD helpers depend on it.
 *
 * COLUMNS: balanced by hand. FIRST_COLUMN_CODES go in the left column and
 * everything else goes in the right. We tried splitting automatically
 * (alternating, and estimating heights) and neither came out even, because
 * each outcome's height depends on how many location squares it has.
 *
 * To rebalance (for example after adding an outcome, or if the location
 * counts change a lot):
 *   1. Open the Learn tab and step the storyboard to 4 / 8.
 *   2. Compare where the two columns end.
 *   3. Move one code into or out of FIRST_COLUMN_CODES and check again.
 * A new outcome that is not listed here lands in the right column.
 */
const LEADING_CODES: readonly OutcomeCode[] = ["AG_REV", "CWS_DEL"]

const ORDERED_CODES: readonly OutcomeCode[] = [
  ...LEADING_CODES,
  ...OUTCOME_CODE_ORDER.filter((code) => !LEADING_CODES.includes(code)),
]

const FIRST_COLUMN_CODES: ReadonlySet<OutcomeCode> = new Set<OutcomeCode>([
  "AG_REV",
  "ENV_FLOWS",
  "GW_STOR",
  "FW_EXP",
])

/* computeDistributionHeight counts a gap after the last row of squares.
 * Trim it so the caption sits directly under the grid. */
const SQUARE_GAP_PX = 6

/** Caption shown under an outcome's squares. */
function describeLocations(code: string, count: number): string {
  switch (code) {
    case "ENV_FLOWS":
      return `${count} river & tributary reaches`
    case "RES_STOR":
      return `${count} major California reservoirs`
    case "DELTA_ECO":
      return "Sacramento-San Joaquin Delta"
    case "FW_EXP":
      return "Banks & Jones Pumping Plants"
    case "FW_DELTA_USES":
      return "Emmaton & Jersey Point"
    case "WRC_SALMON_AB":
      return "population health along the Sacramento"
    default:
      return `${count} locations`
  }
}

/** See the file header. */
export function useStoryboardLayout({
  allScreenPolygons,
  outcomeLocations,
  tierOverrides,
  panelSize,
  outcomeDisplayOrder,
  activeOutcomes,
  hideScheduleRef,
}: LayoutParams): LayoutResult {
  const theme = useTheme()

  const outcomeGroups: OutcomeGroup[] = useMemo(() => {
    if (allScreenPolygons.size === 0) return []
    return outcomeDisplayOrder
      .map(({ code, label }) => {
        const locData = outcomeLocations[code]
        if (!locData) return { code, label, polygons: [] }
        const override = tierOverrides[code]
        const polygons: ShapeMorphData[] = []
        for (const locId of locData.ids) {
          // RES_STOR: API returns CalSim IDs. Screen map uses gnisidlabel.
          let screenKey = locId
          if (code === "RES_STOR" && !allScreenPolygons.has(locId)) {
            const gnisName = RESERVOIR_CALSIM_TO_GNISIDLABEL[locId]
            if (gnisName) screenKey = gnisName
          }
          const screen = allScreenPolygons.get(screenKey)
          if (!screen) continue
          polygons.push({
            screenShape: screen.screenPoly,
            centroidScreen: screen.centroidScreen,
            color:
              override?.colorMap[locId] ?? locData.colorMap[locId] ?? "#888888",
            tier: override?.tierMap[locId] ?? locData.tierMap[locId] ?? 1,
            sourceId: locId,
          })
        }
        return { code, label, polygons }
      })
      .filter((g) => g.polygons.length > 0)
  }, [allScreenPolygons, outcomeLocations, tierOverrides, outcomeDisplayOrder])

  const locationNameMap = useMemo(() => {
    const names: Record<string, string> = {}
    for (const { code } of outcomeDisplayOrder) {
      const locData = outcomeLocations[code]
      if (!locData) continue
      for (const locId of locData.ids) {
        const key = `${code}:${locId}`
        const apiName = locData.nameMap[locId]
        if (apiName && apiName !== locId) {
          names[key] = apiName
          continue
        }
        if (code === "AG_REV" || code === "CWS_DEL") {
          const duName = getDemandUnitDisplayName(locId)
          if (duName !== locId) {
            names[key] = duName
          }
        }
      }
    }
    return names
  }, [outcomeLocations, outcomeDisplayOrder])

  const locationNameMapRef = useRef(locationNameMap)
  locationNameMapRef.current = locationNameMap

  const activeOutcomeGroups = useMemo(
    () => outcomeGroups.filter((g) => activeOutcomes.has(g.code)),
    [outcomeGroups, activeOutcomes],
  )

  const outcomeMorphWindows = useMemo(() => {
    const map: Record<string, { start: number; end: number }> = {}
    if (activeOutcomeGroups.length === 0) return map
    const activeCodes = activeOutcomeGroups.map((g) => g.code)
    for (const group of activeOutcomeGroups) {
      const [start, end] = getOutcomeProgressRange(group.code, activeCodes)
      map[group.code] = { start, end }
    }
    return map
  }, [activeOutcomeGroups])

  useEffect(() => {
    const schedule: HideScheduleEntry[] = []
    const activeCodes = activeOutcomeGroups.map((g) => g.code)
    for (const group of activeOutcomeGroups) {
      // AG_REV excluded.
      if (group.code === "AG_REV") continue
      const locData = outcomeLocations[group.code]
      if (!locData || locData.ids.size === 0) continue
      const config = getOutcomeConfig(group.code)
      if (!config) continue
      // Line outcomes are owned by RiversLayer and hidden until selected, so
      // they never show during the intro morph. Imperatively fading them pins
      // the layer to 0 in a way react-map-gl never restores. Skip so
      // RiversLayer stays the sole owner.
      if (config.geometryType === "line") continue
      const [morphStart] = getOutcomeProgressRange(group.code, activeCodes)
      const fadeStart = morphStart - 0.005

      // RES_STOR: translate CalSim IDs to gnisidlabel for Mapbox matching.
      let locationIds = [...locData.ids]
      if (group.code === "RES_STOR") {
        const mapped = new Set<string>()
        for (const id of locationIds) {
          const gnis = RESERVOIR_CALSIM_TO_GNISIDLABEL[id]
          if (gnis) mapped.add(gnis)
        }
        locationIds = [...mapped]
      }

      schedule.push({
        code: group.code,
        geometryType: config.geometryType as
          | "polygon"
          | "line"
          | "react-marker",
        mapboxLayerId: config.mapboxLayerId,
        idProperty: config.idProperty ?? "",
        fadeStart,
        morphStart,
        locationIds,
      })
    }
    hideScheduleRef.current = schedule
  }, [activeOutcomeGroups, outcomeLocations, hideScheduleRef])

  const lockedHeightsRef = useRef<Map<string, number>>(new Map())

  const outcomeLayout = useMemo<Beat2Layout | null>(() => {
    if (!panelSize) return null
    const sqPerRow = theme.scenarios.tierGrid.squaresPerRow

    // Estimated per-column inner width, used only to decide row count. The
    // precise width is measured from the DOM later.
    const approxColWidth = Math.max(80, (panelSize.width * (1 / 3)) / 2 - 36)

    // Invisible spacers, one per column. They reserve the slot at the top of
    // the grid that the view-mode header ("Distribution view" etc.) fades
    // into from step 5.
    const headerSpacer = { animationStart: BACKDROP_FADE_IN_PROGRESS }
    const eyebrows = [headerSpacer, headerSpacer]

    const items: Beat2LayoutItem[] = []

    for (const code of ORDERED_CODES) {
      const label = getOutcomeName(code)
      const isActive = activeOutcomes.has(code)
      const col: 0 | 1 = FIRST_COLUMN_CODES.has(code) ? 0 : 1

      let locationCount = 0
      let targetHeight = 0

      if (isActive) {
        const group = outcomeGroups.find((g) => g.code === code)
        if (group && group.polygons.length > 0) {
          locationCount = group.polygons.length
          const freshHeight = computeDistributionHeight(
            group.polygons,
            sqPerRow,
            approxColWidth,
          )
          const locked = lockedHeightsRef.current.get(code)
          const distributionHeight =
            locked !== undefined ? Math.max(locked, freshHeight) : freshHeight
          lockedHeightsRef.current.set(code, distributionHeight)
          targetHeight = Math.max(0, distributionHeight - SQUARE_GAP_PX)
        }
      }

      items.push({
        code,
        label,
        column: col,
        isActive,
        targetHeight,
        locationDescription: describeLocations(code, locationCount),
      })
    }

    return { items, eyebrows }
  }, [
    panelSize,
    outcomeGroups,
    theme.scenarios.tierGrid.squaresPerRow,
    activeOutcomes,
  ])

  const [glyphLayout, setGlyphLayout] = useState<Record<string, GlyphRect>>({})

  const handleGlyphLayoutChange = useCallback(
    (layout: Record<string, GlyphRect>) => {
      setGlyphLayout((prev) => {
        // Shallow-compare to skip redundant updates: ResizeObserver fires
        // often and identical rects should not re-render.
        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(layout)
        if (prevKeys.length === nextKeys.length) {
          let same = true
          for (const k of nextKeys) {
            const a = prev[k]
            const b = layout[k]!
            if (
              !a ||
              a.x !== b.x ||
              a.y !== b.y ||
              a.width !== b.width ||
              a.height !== b.height
            ) {
              same = false
              break
            }
          }
          if (same) return prev
        }
        return layout
      })
    },
    [],
  )

  const distributionPositionMap = useMemo(() => {
    const map: Record<
      string,
      { x: number; y: number; maxWidth: number; slotHeight: number }
    > = {}
    if (!outcomeLayout) return map
    for (const item of outcomeLayout.items) {
      if (!item.isActive || item.targetHeight <= 0) continue
      const g = glyphLayout[item.code]
      if (!g) continue
      map[item.code] = {
        x: g.x,
        y: g.y,
        maxWidth: g.width,
        slotHeight: g.height,
      }
    }
    return map
  }, [outcomeLayout, glyphLayout])

  return {
    activeOutcomeGroups,
    locationNameMap,
    locationNameMapRef,
    outcomeMorphWindows,
    outcomeLayout,
    handleGlyphLayoutChange,
    distributionPositionMap,
  }
}
