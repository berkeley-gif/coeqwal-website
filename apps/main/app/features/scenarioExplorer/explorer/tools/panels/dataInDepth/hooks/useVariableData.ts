"use client"

/**
 * useVariableData - member data for the Data-in-Depth explorer chart card.
 *
 * Reads the current explorer selection (variable, view, distribution style,
 * compare axis, and the pinned / multi-selected members) from the data store
 * slice plus the workspace scenario selection, and returns one normalized
 * member per series to draw, with the summary stats and context strings the
 * ChartCard and the interpretive sentence need. The caller maps these members
 * onto the concrete `@repo/viz` chart props.
 *
 * Data source
 * -----------
 * Reservoir variables (`data: "live"`) use LIVE API data on the compare-by-
 * scenarios axis for the exceedance view: the per-scenario reservoir percentile
 * grid (q0..q100, values in percent-of-capacity) is adapted to exceedance
 * points, used directly for the "% capacity" view or multiplied by the
 * reservoir capacity for the "storage" (TAF) view. Everything else - the box
 * plot (the API grid has no q25/q75), the CV view (no per-year sd), the climate
 * and location compare axes (the resolver resolves one hydroclimate), and all
 * non-reservoir variables - uses the deterministic sample-data engine. The
 * card is labeled per the resolved `source`.
 *
 * Scenario ids are used as opaque seeds for mock members and passed straight to
 * the reservoir endpoint for live members; hydroclimate id resolution for the
 * (still mock) climate axis is left to a later live-widening pass.
 */

import { useMemo } from "react"
import { useReservoirPercentiles } from "@repo/data/coeqwal/hooks"
import { useDataSlice, useWorkspaceSlice } from "../../../../store"
import { BASELINE_SCENARIO_ID } from "../../../../../constants"
import {
  getScenarioShortLabel,
  HYDROCLIMATES,
  HYDROCLIMATE_ID_MAP,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../../../content/scenarios"
import {
  getLocation,
  getVariable,
  LOCATION_GROUPS,
  type VariableDef,
  type VariableView,
} from "../config/variableRegistry"
import {
  mockAnnualSeries,
  mockMonthlyBands,
  mockSummaryValue,
  seriesStats,
  type MonthlyBand,
  type SeriesStats,
} from "../config/mockDataEngine"
import { MAX_DATA_IN_DEPTH_SCENARIOS } from "../config/scenarioLimit"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"

/** Default count of locations seeded into a "compare by locations" set. */
const DEFAULT_LOCATION_COUNT = 3

/**
 * Registry reservoir-location id -> API reservoir short_code. Most match; only
 * the two San Luis basins differ. Aggregates (AGG_*) have no API reservoir, so
 * they resolve to null and fall back to mock.
 */
const RESERVOIR_ID_MAP: Record<string, string> = {
  SLCVP: "SLUIS_CVP",
  SLSWP: "SLUIS_SWP",
}
const AGGREGATE_RESERVOIRS = new Set(["AGG_NOD", "AGG_SOD"])

/** Water-month key (1=Oct..12=Sep) for each live reservoir variable. */
const WATER_MONTH_BY_VARIABLE: Record<string, string> = {
  res_apr: "7",
  res_sep: "12",
}

/** Map a registry reservoir-location id to its API reservoir id, or null. */
function toApiReservoirId(locationId: string): string | null {
  if (AGGREGATE_RESERVOIRS.has(locationId)) return null
  return RESERVOIR_ID_MAP[locationId] ?? locationId
}

/** An exceedance-curve point (probability of being at least this value). */
export interface ExceedanceCurvePoint {
  probability: number
  value: number
}

/** One comparison member (a scenario, a climate, or a location). */
export interface VariableMember {
  /** Unique member id (scenario / climate / location id) */
  id: string
  /** Display label */
  label: string
  /** True for the locked reference (Current Operations, scenarios axis only) */
  isReference: boolean
  /** Annual series in display units (percent-of-capacity applied for "pct") */
  series: number[]
  /** Summary stats of `series` */
  stats: SeriesStats
  /** Monthly p10/p50/p90 bands (populated only for the "monthly" view) */
  bands: MonthlyBand[]
  /** Single value for the "cv" and "value" views */
  value: number
  /**
   * Live exceedance points from the reservoir percentile grid. Present only for
   * live reservoir members; the caller draws these instead of deriving points
   * from `series`.
   */
  livePoints?: ExceedanceCurvePoint[]
}

export interface VariableData {
  variable: VariableDef | undefined
  members: VariableMember[]
  view: VariableView
  /** Effective unit for axes/labels (view-aware: "%" for pct, "" for cv) */
  unit: string
  unitLabel: string
  /** Whether the variable's scope is still under discussion */
  provisional: boolean
  /** Data provenance for the card label */
  source: "live" | "mock"
  /** Held-constant location name (scenarios / climates axes) */
  locationName: string
  /** Held-constant climate label (scenarios / locations axes) */
  climateName: string
  /** Held-constant scenario label (climates / locations axes) */
  scenarioName: string
  isLoading: boolean
  error: unknown
}

interface MemberSpec {
  id: string
  label: string
  isReference: boolean
  scenarioId: string
  climateKey: string
  locationId: string
  /** Index into the reservoir fan-out slots (scenarios axis only) */
  slotIndex?: number
}

/** A valid hydroclimate key, falling back to historical. */
function resolveClimate(key: string | null | undefined): string {
  return key && key in HYDROCLIMATE_ID_MAP ? key : "historical"
}

function climateLabel(key: string): string {
  return HYDROCLIMATE_SHORT_LABELS[key] ?? key
}

function scenarioLabel(id: string): string {
  return getScenarioShortLabel(id) ?? id
}

export function useVariableData(): VariableData {
  const {
    selectedVariableId,
    view,
    distKind,
    compareBy,
    pinnedScenario,
    pinnedClimate,
    pinnedLocationByGroup,
    selectedClimates,
    selectedLocationsByGroup,
  } = useDataSlice()
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)
  const workspaceHydroclimate = useWorkspaceSlice((s) => s.hydroclimate)

  const variable = getVariable(selectedVariableId)
  const groupId = variable?.locationGroup
  const group = groupId ? LOCATION_GROUPS[groupId] : undefined
  const firstLocationId = group?.items[0]?.id ?? ""

  // Held-constant members for the two axes that are not being compared.
  // Clamp the pinned scenario to a still-available one (reference, or a current
  // workspace selection) so it self-heals if the selection later shrinks.
  const heldScenario =
    pinnedScenario &&
    (pinnedScenario === BASELINE_SCENARIO_ID ||
      selectedScenarios.includes(pinnedScenario))
      ? pinnedScenario
      : BASELINE_SCENARIO_ID
  const heldClimate = resolveClimate(pinnedClimate ?? workspaceHydroclimate)
  const heldLocation =
    (groupId ? pinnedLocationByGroup[groupId] : undefined) ?? firstLocationId

  // Stable primitive keys for the multi-select member lists so the memo below
  // recomputes only when the actual comparison set changes.
  const climateKeysJoined = selectedClimates.join(",")
  const locationIdsJoined = (
    (groupId ? selectedLocationsByGroup[groupId] : undefined) ?? []
  ).join(",")
  const scenarioIdsJoined = selectedScenarios.join(",")

  // Scenario comparison set (reference first), shared by the fan-out and specs.
  const compareScenarioIds = useMemo(
    () =>
      [
        BASELINE_SCENARIO_ID,
        ...selectedScenarios.filter((id) => id !== BASELINE_SCENARIO_ID),
      ].slice(0, MAX_DATA_IN_DEPTH_SCENARIOS),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scenarioIdsJoined captures selectedScenarios
    [scenarioIdsJoined],
  )

  // Live reservoir data: only for `data:"live"` variables on the scenarios axis.
  const liveReservoirId =
    variable?.data === "live" && compareBy === "scenarios"
      ? toApiReservoirId(heldLocation)
      : null

  // Fan out the reservoir percentile fetch across the comparison scenarios. The
  // hook is always invoked MAX_FETCH_SLOTS times (inactive slots pass null and
  // never fetch); passing [] when not live yields no results but keeps the hook
  // count constant.
  const reservoirSlots = useMultiScenarioSlots(
    liveReservoirId ? compareScenarioIds : [],
    (scenarioId) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- helper guarantees stable hook order
      useReservoirPercentiles(scenarioId, liveReservoirId),
  )
  const liveDataSignature = reservoirSlots
    .map((r) => (r?.hasData ? "1" : "0"))
    .join("")
  const liveLoading = reservoirSlots.some((r) => r?.isLoading)

  return useMemo<VariableData>(() => {
    const emptyContext = {
      locationName:
        getLocation(groupId ?? "reservoirs", heldLocation)?.name ?? "",
      climateName: climateLabel(heldClimate),
      scenarioName: scenarioLabel(heldScenario),
    }

    if (!variable || !groupId || !group) {
      return {
        variable: undefined,
        members: [],
        view,
        unit: "",
        unitLabel: "",
        provisional: false,
        source: "mock",
        ...emptyContext,
        isLoading: false,
        error: null,
      }
    }

    // Build the member specs for the active compare axis.
    const specs: MemberSpec[] = []
    if (compareBy === "scenarios") {
      compareScenarioIds.forEach((id, i) => {
        specs.push({
          id,
          label: scenarioLabel(id),
          isReference: id === BASELINE_SCENARIO_ID,
          scenarioId: id,
          climateKey: heldClimate,
          locationId: heldLocation,
          slotIndex: i,
        })
      })
    } else if (compareBy === "climates") {
      const keys =
        selectedClimates.length > 0
          ? selectedClimates.filter((k) => k in HYDROCLIMATE_ID_MAP)
          : [...HYDROCLIMATES]
      for (const key of keys) {
        specs.push({
          id: key,
          label: climateLabel(key),
          isReference: false,
          scenarioId: heldScenario,
          climateKey: key,
          locationId: heldLocation,
        })
      }
    } else {
      const chosen = (selectedLocationsByGroup[groupId] ?? []).filter((id) =>
        group.items.some((l) => l.id === id),
      )
      const ids =
        chosen.length > 0
          ? chosen
          : group.items.slice(0, DEFAULT_LOCATION_COUNT).map((l) => l.id)
      for (const id of ids) {
        specs.push({
          id,
          label: getLocation(groupId, id)?.name ?? id,
          isReference: false,
          scenarioId: heldScenario,
          climateKey: heldClimate,
          locationId: id,
        })
      }
    }

    const isPct = view === "pct"
    // Live only covers the exceedance view of a reservoir variable on the
    // scenarios axis (the q-grid maps cleanly to an exceedance curve).
    const useLive =
      liveReservoirId != null &&
      compareBy === "scenarios" &&
      (view === "dist" || view === "pct") &&
      distKind === "exceedance"
    const liveMonth = WATER_MONTH_BY_VARIABLE[variable.id] ?? "7"

    let anyLive = false
    const members: VariableMember[] = specs.map((spec) => {
      const raw = mockAnnualSeries(
        variable.id,
        spec.scenarioId,
        spec.climateKey,
        spec.locationId,
      )
      const capacity = getLocation(groupId, spec.locationId)?.capacityTaf
      let series: number[]
      if (isPct && capacity) {
        const cap = capacity
        series = raw.map((v) => (v / cap) * 100)
      } else {
        series = raw
      }
      const stats = seriesStats(series)
      const bands =
        view === "monthly"
          ? mockMonthlyBands(
              variable.id,
              spec.scenarioId,
              spec.climateKey,
              spec.locationId,
            )
          : []
      let value: number
      if (view === "cv") value = stats.cv
      else if (view === "value")
        value = mockSummaryValue(
          variable.id,
          spec.scenarioId,
          spec.climateKey,
          spec.locationId,
        )
      else value = stats.p50

      // Live override for the exceedance view when reservoir data is present.
      let livePoints: ExceedanceCurvePoint[] | undefined
      if (useLive && spec.slotIndex != null) {
        const pv =
          reservoirSlots[spec.slotIndex]?.data?.monthly_percentiles?.[liveMonth]
        if (pv) {
          const toUnit = (p: number) =>
            isPct ? p : capacity ? (p / 100) * capacity : p
          livePoints = [
            { probability: 1.0, value: toUnit(pv.q0) },
            { probability: 0.9, value: toUnit(pv.q10) },
            { probability: 0.7, value: toUnit(pv.q30) },
            { probability: 0.5, value: toUnit(pv.q50) },
            { probability: 0.3, value: toUnit(pv.q70) },
            { probability: 0.1, value: toUnit(pv.q90) },
            { probability: 0.0, value: toUnit(pv.q100) },
          ]
          value = toUnit(pv.q50)
          // Point the member series at the live percentile grid so the summary
          // sentence (which derives its median from `series`) matches the chart:
          // seriesStats of the 7 sorted values yields p50 === live q50.
          series = [
            toUnit(pv.q0),
            toUnit(pv.q10),
            toUnit(pv.q30),
            toUnit(pv.q50),
            toUnit(pv.q70),
            toUnit(pv.q90),
            toUnit(pv.q100),
          ]
          anyLive = true
        }
      }

      return {
        id: spec.id,
        label: spec.label,
        isReference: spec.isReference,
        series,
        stats,
        bands,
        value,
        livePoints,
      }
    })

    const unit = isPct ? "%" : view === "cv" ? "" : variable.unit
    const unitLabel = isPct
      ? "percent of capacity"
      : view === "cv"
        ? "coefficient of variation"
        : variable.unitLabel

    return {
      variable,
      members,
      view,
      unit,
      unitLabel,
      provisional: variable.provisional ?? false,
      source: anyLive ? "live" : "mock",
      ...emptyContext,
      isLoading: useLive ? liveLoading : false,
      error: null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitive deps below fully capture the object/array inputs (joined ids, live signature); recompute only when the selection or live data changes
  }, [
    selectedVariableId,
    view,
    distKind,
    compareBy,
    heldScenario,
    heldClimate,
    heldLocation,
    climateKeysJoined,
    locationIdsJoined,
    scenarioIdsJoined,
    compareScenarioIds,
    liveReservoirId,
    liveDataSignature,
    liveLoading,
  ])
}
