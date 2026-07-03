"use client"

/**
 * useVariableData - member data for the Data-in-Depth explorer chart card.
 *
 * Reads the current explorer selection (variable, view, compare axis, and the
 * pinned / multi-selected members) from the data store slice plus the
 * workspace scenario selection, and returns one normalized member per series
 * to draw, with the summary stats and context strings the ChartCard and the
 * interpretive sentence need. The caller maps these members onto the concrete
 * `@repo/viz` chart props (ExceedanceChart / BoxPlot / CategoricalBarChart /
 * PercentileBandChart).
 *
 * Data source
 * -----------
 * Every member is currently produced by the deterministic sample-data engine
 * and the result is labeled `source: "mock"`. The live path (reservoir batch
 * percentiles for `data: "live"` variables) is deferred to the live-data
 * widening PR, where the Playwright HAR harness can verify it against
 * api.coeqwal.org (that origin CORS-blocks localhost, so a plain dev run
 * cannot exercise it). The return shape already carries `source` so a live
 * branch can set it per variable without changing this hook's signature.
 *
 * This hook does not hand-resolve scenario ids to API ids: mock members use
 * the opaque scenario/climate/location ids as deterministic seeds only. The
 * future live path will resolve through `useResolvedIdMapping` /
 * `useResolvedSelectedScenarios` per the repo hydroclimate invariant.
 */

import { useMemo } from "react"
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

/** Default count of locations seeded into a "compare by locations" set. */
const DEFAULT_LOCATION_COUNT = 3

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
      const others = selectedScenarios.filter(
        (id) => id !== BASELINE_SCENARIO_ID,
      )
      const ids = [BASELINE_SCENARIO_ID, ...others].slice(
        0,
        MAX_DATA_IN_DEPTH_SCENARIOS,
      )
      for (const id of ids) {
        specs.push({
          id,
          label: scenarioLabel(id),
          isReference: id === BASELINE_SCENARIO_ID,
          scenarioId: id,
          climateKey: heldClimate,
          locationId: heldLocation,
        })
      }
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
      return {
        id: spec.id,
        label: spec.label,
        isReference: spec.isReference,
        series,
        stats,
        bands,
        value,
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
      source: "mock",
      ...emptyContext,
      isLoading: false,
      error: null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitive deps below fully capture the object/array inputs (joined ids); recompute only when the selection actually changes
  }, [
    selectedVariableId,
    view,
    compareBy,
    heldScenario,
    heldClimate,
    heldLocation,
    climateKeysJoined,
    locationIdsJoined,
    scenarioIdsJoined,
  ])
}
