"use client"

/* useStoryboardLayout: the Beat 2 grid layout
 *
 * Turns screen polygons into the two-column outcome grid, the morph
 * windows, and the per-outcome feature hide schedule the engine reads.
 * One of the TierAnimationSection hooks (see README.md).
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
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../../content/outcomes"
import { BACKDROP_FADE_IN_PROGRESS } from "../animationTiming"
import type { HideScheduleEntry } from "../engine"
import type { OutcomeLocationData } from "../useTierAnimationData"
import type { ScreenPolygon } from "./useScreenPolygonProjection"
import type {
  Beat2Layout,
  Beat2LayoutItem,
  GlyphRect,
} from "../overlayTypes"

interface LayoutParams {
  allScreenPolygons: Map<string, ScreenPolygon>
  outcomeLocations: Record<string, OutcomeLocationData>
  tierOverrides: Record<string, OutcomeLocationData>
  panelSize: { width: number; height: number } | null
  outcomeDisplayOrder: readonly { code: string; label: string }[]
  activeOutcomes: ReadonlySet<string>
  /** Per-outcome map-feature hide schedule, written here and read by the
   *  engine context in the parent (`getHideSchedule`). */
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

/** Turns screen polygons and outcome data into the Beat 2 grid layout: the
 *  active outcome shape groups, the morph windows, the two-column glyph
 *  layout, and the per-outcome feature hide schedule the engine reads. */
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
          // RES_STOR: API returns CalSim IDs. Screen map uses gnisidlabel
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
              override?.colorMap[locId] ??
              locData.colorMap[locId] ??
              "#888888",
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
      // AG_REV is excluded
      if (group.code === "AG_REV") continue
      const locData = outcomeLocations[group.code]
      if (!locData || locData.ids.size === 0) continue
      const config = getOutcomeConfig(group.code)
      if (!config) continue
      const [morphStart] = getOutcomeProgressRange(group.code, activeCodes)
      const fadeStart = morphStart - 0.005

      // For RES_STOR, translate CalSim IDs to gnisidlabel for Mapbox matching
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

  const describeLocations = useCallback(
    (code: string, count: number): string => {
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
    },
    [],
  )

  const outcomeLayout = useMemo<Beat2Layout | null>(() => {
    if (!panelSize) return null
    const sqPerRow = theme.scenarios.tierGrid.squaresPerRow
    // Estimate the per-column inner width so the distribution height
    // heuristic uses a realistic number of columns. The precise width is
    // measured from the DOM later. This is only used to decide row count.
    const approxColWidth = Math.max(80, (panelSize.width * (1 / 3)) / 2 - 36)

    // Left column renders in this explicit order (AG_REV before CWS_DEL).
    // Don't touch OUTCOME_CODE_ORDER globally, since radar axes and
    // NOD/SOD helpers depend on that list. So we just prepend the
    // left-column codes in their desired order and iterate the rest of
    // OUTCOME_CODE_ORDER after.
    const LEFT_COLUMN_ORDER = ["AG_REV", "CWS_DEL"] as const
    const LEFT_COLUMN_CODES = new Set<string>(LEFT_COLUMN_ORDER)
    const orderedCodes: string[] = [
      ...LEFT_COLUMN_ORDER,
      ...OUTCOME_CODE_ORDER.filter((c) => !LEFT_COLUMN_CODES.has(c)),
    ]

    // Eyebrow labels fade in alongside the right-panel backdrop, sharing
    // its onset. The fade width is applied by the narration frame handler.
    const EYEBROW_FADE_IN = BACKDROP_FADE_IN_PROGRESS
    const eyebrows = [
      {
        label: "Consumptive uses",
        x: 0,
        y: 0,
        columnWidth: approxColWidth,
        animationStart: EYEBROW_FADE_IN,
      },
      {
        label: "Non-consumptive uses",
        x: 0,
        y: 0,
        columnWidth: approxColWidth,
        animationStart: EYEBROW_FADE_IN,
      },
    ]

    const items: Beat2LayoutItem[] = []

    for (let idx = 0; idx < orderedCodes.length; idx++) {
      const code = orderedCodes[idx]! as (typeof OUTCOME_CODE_ORDER)[number]
      const label = getOutcomeName(code)
      const isActive = activeOutcomes.has(code)
      const col: 0 | 1 = LEFT_COLUMN_CODES.has(code) ? 0 : 1

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
          const SQUARE_GAP_PX = 6
          targetHeight = Math.max(0, distributionHeight - SQUARE_GAP_PX)
        }
      }

      items.push({
        code,
        label,
        column: col,
        columnWidth: approxColWidth,
        isActive,
        locationCount,
        targetHeight,
        locationDescription: describeLocations(code, locationCount),
      })
    }

    return { items, eyebrows }
  }, [
    panelSize,
    outcomeGroups,
    theme.scenarios.tierGrid.squaresPerRow,
    describeLocations,
    activeOutcomes,
  ])

  const [glyphLayout, setGlyphLayout] = useState<Record<string, GlyphRect>>({})

  const handleGlyphLayoutChange = useCallback(
    (layout: Record<string, GlyphRect>) => {
      setGlyphLayout((prev) => {
        // Shallow-compare to avoid redundant state updates (ResizeObserver
        // can fire frequently, and identical rects should skip re-render).
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
