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
 * Reservoir, river-flow, and X2 variables (mapped in `didMapping`) use LIVE data
 * on the compare-by-scenarios and compare-by-climates axes: each member's raw
 * annual series is fetched from the matching /api/data-in-depth/* endpoint
 * (per-scenario parallel fan-out), and every derived value the chart needs
 * (exceedance curve, box, mean, CV) is computed on the frontend from that
 * series via `seriesStats` and `toExceedancePoints` - the same path the mock
 * engine feeds. So the live and mock members are shaped identically; only the
 * origin of `series` differs.
 *
 * Everything else - the locations compare axis, and any variable not served by
 * a data-in-depth endpoint - uses the deterministic sample-data engine. Each
 * member falls back to mock individually if its live series is absent, and the
 * card is labeled per the resolved `source`.
 *
 * Member ids resolve to concrete scenario short_codes before fetching:
 * - scenarios axis: each compared scenario through the active workspace
 *   hydroclimate (`useResolvedIdMapping`). A pinned climate that differs from
 *   the workspace hydroclimate falls back to mock.
 * - climates axis: the held scenario through EVERY compared climate
 *   (`useResolvedIdMappings` + `climateFanoutIds`), one variant id per member,
 *   since a climate future is baked into the scenario id.
 */

import { useMemo } from "react"
import {
  useReservoirStorageDataInDepth,
  useRiverFlowsDataInDepth,
  useDeltaSalinityDataInDepth,
  useSystemDeliveriesDataInDepth,
  useGroundwaterStorageDataInDepth,
  useSalmonDataInDepth,
  useCwsDataInDepth,
} from "@repo/data/coeqwal/hooks"
import { useDataSlice, useWorkspaceSlice } from "../../../../store"
import {
  useResolvedIdMapping,
  useResolvedIdMappings,
} from "../../../../../../scenarios/hooks"
import { BASELINE_SCENARIO_ID } from "../../../../../constants"
import {
  getScenarioShortLabel,
  HYDROCLIMATE_ID_MAP,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../../../content/scenarios"
import {
  getLocation,
  getLocationTitle,
  getVariable,
  LOCATION_GROUPS,
  type VariableDef,
  type VariableView,
} from "../config/variableRegistry"
import {
  cwsShortagePctFromSeries,
  gwLevelFromStorage,
  mockAnnualSeries,
  mockMonthlyBands,
  mockSummaryValue,
  mockWaterYearType,
  seriesStats,
  type MonthlyBand,
  type SeriesStats,
} from "../config/mockDataEngine"
import { effectiveWytSelection, filterSeriesByWyt } from "../config/wytFilter"
import {
  comparedClimateKeys,
  climateFanoutIds,
  liveAxisEligible,
} from "../config/climateAxis"
import {
  didDomainForVariable,
  didPeriodForVariable,
  didLiveScaleForVariable,
  toDidSubject,
  unitTokenForView,
  includeForView,
  pickLiveSeriesPoints,
  viewHasLiveSource,
} from "../config/didMapping"
import { MAX_DATA_IN_DEPTH_SCENARIOS } from "../config/scenarioLimit"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"

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
  /** Water years aligned with `series` (live members only; absent for mock) */
  waterYears?: number[]
  /** True when this member's series came from the live API (mock fallback = false) */
  isLive?: boolean
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
  /** Held location as a figure-title name ("Shasta Reservoir"; "" if none) */
  locationTitleName: string
  /** Held-constant climate label (scenarios / locations axes) */
  climateName: string
  /** Held-constant scenario label (climates / locations axes) */
  scenarioName: string
  /** Whether water-year typing applies to the selected variable (false =
   *  registry opt-out: chips disabled, no wyt filtering, no title clause) */
  wytApplicable: boolean
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
  /** Index into the per-scenario live fan-out slots (scenarios and climates axes) */
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
    selectedWaterYearTypes,
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
  const wytJoined = selectedWaterYearTypes.join(",")

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

  // Live request mapping for the current variable (null domain -> mock only).
  const domain = variable ? didDomainForVariable(variable.id) : null
  const period = variable ? didPeriodForVariable(variable.id) : null
  const subject = domain
    ? toDidSubject(domain, heldLocation, variable?.id)
    : null
  const unitToken = domain
    ? unitTokenForView(domain, view, variable?.id)
    : "volume"
  const include = includeForView(view)

  // Resolve member ids to concrete scenario short_codes for the live fetch.
  // Scenarios axis: each compared scenario through the active workspace
  // hydroclimate (live is only correct when the held climate matches the
  // climate the resolver ran for). Climates axis: the held scenario through
  // every compared climate, one variant id per member.
  const resolved = useResolvedIdMapping()
  const resolvedAll = useResolvedIdMappings()
  const liveEligible =
    domain != null &&
    subject != null &&
    period != null &&
    viewHasLiveSource(view) &&
    liveAxisEligible(compareBy, heldClimate, resolved.hydroclimate)

  // Compared climate keys, shared by the fan-out and the member specs below
  // so slot indexes and ids stay aligned.
  const comparedClimates = comparedClimateKeys(selectedClimates)

  // Resolved short_code (or null) per member, in member order.
  const fanoutIds = !liveEligible
    ? []
    : compareBy === "scenarios"
      ? compareScenarioIds.map((id) => resolved.idMapping[id] ?? null)
      : climateFanoutIds(
          Object.fromEntries(
            Object.entries(resolvedAll).map(([k, m]) => [k, m.idMapping]),
          ),
          comparedClimates,
          heldScenario,
        )

  // Whether water-year typing applies to this variable at all (salmon
  // population metrics and welfare loss opt out via the registry flag).
  const wytApplicable = variable?.wytApplicable !== false
  const wyt = effectiveWytSelection(wytApplicable, selectedWaterYearTypes)

  // Fan out each domain's endpoint across the comparison scenarios. Only the
  // active domain passes real ids; the others pass [] so every slot defers.
  // The hook count stays constant across renders (Rules of Hooks).
  const reservoirSlots = useMultiScenarioSlots(
    domain === "reservoir" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useReservoirStorageDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        periods:
          period === "annual" ? undefined : period ? [period] : undefined,
        units: view === "pct" ? ["pct_capacity"] : ["volume"],
        include,
        wyt,
      }),
  )
  const riverSlots = useMultiScenarioSlots(
    domain === "river" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useRiverFlowsDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        units: ["volume"],
        include,
        wyt,
      }),
  )
  const deltaSlots = useMultiScenarioSlots(
    domain === "delta" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useDeltaSalinityDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        periods:
          period === "annual" ? undefined : period ? [period] : undefined,
        units: ["km"],
        include,
        wyt,
      }),
  )
  const sysdelSlots = useMultiScenarioSlots(
    domain === "sysdel" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useSystemDeliveriesDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        units: ["volume"],
        include,
        wyt,
      }),
  )

  const gwSlots = useMultiScenarioSlots(
    domain === "gw" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useGroundwaterStorageDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        measures: [unitToken === "level" ? "level" : "volume"],
        include,
        wyt,
      }),
  )
  const salmonSlots = useMultiScenarioSlots(
    domain === "salmon" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useSalmonDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        units: ["nof_3yr_avg"],
        include,
      }),
  )
  const cwsSlots = useMultiScenarioSlots(
    domain === "cws" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useCwsDataInDepth(id ? [id] : [], {
        subjects: subject ? [subject] : undefined,
        // The cws request token IS the measure name (delivery /
        // shortage_total / shortage_pct); anything else defers to delivery.
        measures: [
          unitToken === "shortage_pct"
            ? "shortage_pct"
            : unitToken === "shortage_total"
              ? "shortage_total"
              : "delivery",
        ],
        // No wyt: the CWS series aggregate by calendar year, so the filter
        // does not apply. It is not a field on CwsDataInDepthOptions, and the
        // endpoint builder throws if one is smuggled past that.
        include,
      }),
  )

  const activeSlots =
    domain === "reservoir"
      ? reservoirSlots
      : domain === "river"
        ? riverSlots
        : domain === "delta"
          ? deltaSlots
          : domain === "sysdel"
            ? sysdelSlots
            : domain === "gw"
              ? gwSlots
              : domain === "salmon"
                ? salmonSlots
                : domain === "cws"
                  ? cwsSlots
                  : []
  const liveSignature = activeSlots
    .map((r) => (r?.hasData ? "1" : "0"))
    .join("")
  const liveLoading = activeSlots.some((r) => r?.isLoading)

  return useMemo<VariableData>(() => {
    const emptyContext = {
      locationName:
        getLocation(groupId ?? "reservoirs", heldLocation)?.name ?? "",
      locationTitleName: groupId ? getLocationTitle(groupId, heldLocation) : "",
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
        wytApplicable,
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
      // Same helper as the fan-out above, so member order and slot order
      // always agree.
      comparedClimateKeys(selectedClimates).forEach((key, i) => {
        specs.push({
          id: key,
          label: climateLabel(key),
          isReference: false,
          scenarioId: heldScenario,
          climateKey: key,
          locationId: heldLocation,
          slotIndex: i,
        })
      })
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
    const isLevel = view === "level"
    const isPctDemand = view === "pct_demand"

    let anyLive = false
    const members: VariableMember[] = specs.map((spec) => {
      // Mock baseline (also the fallback when a live series is absent).
      const raw = mockAnnualSeries(
        variable.id,
        spec.scenarioId,
        spec.climateKey,
        spec.locationId,
      )
      const location = getLocation(groupId, spec.locationId)
      let series: number[]
      if (isPct && location?.capacityTaf) {
        const cap = location.capacityTaf
        series = raw.map((v) => (v / cap) * 100)
      } else if (isLevel && location) {
        series = gwLevelFromStorage(raw, location)
      } else if (isPctDemand) {
        // Sample percent-of-demand: shortage over shortage-plus-delivery,
        // both from the sample engine. Live members overwrite this with the
        // endpoint's served shortage_pct measure below.
        series = cwsShortagePctFromSeries(
          raw,
          mockAnnualSeries(
            "cws_del",
            spec.scenarioId,
            spec.climateKey,
            spec.locationId,
          ),
        )
      } else {
        series = raw
      }
      let waterYears: number[] | undefined
      let adoptedLive = false

      // Live override: the endpoint already returns the requested unit
      // (TAF / PCT_CAP / km), so no capacity math is applied to live series.
      if (
        liveEligible &&
        subject &&
        period &&
        domain &&
        spec.slotIndex != null
      ) {
        const block = activeSlots[spec.slotIndex]?.scenarios?.[0]
        const points = pickLiveSeriesPoints(
          block,
          domain,
          subject,
          period,
          unitToken,
        )
        if (points.series.length > 0) {
          // Served units -> display units (e.g. the salmon habitat-occupancy
          // ratio displays as percent); 1 for every other variable.
          const liveScale = didLiveScaleForVariable(variable.id)
          series =
            liveScale === 1
              ? points.series
              : points.series.map((v) => v * liveScale)
          waterYears =
            points.waterYears.length > 0 ? points.waterYears : undefined
          anyLive = true
          adoptedLive = true
        }
      }

      // Mock members: apply the water-year-type filter client-side with the
      // deterministic sample classification. Live members arrive already
      // filtered by the wyt request parameter, in EVERY view (the hooks pass
      // wyt unconditionally), so the mock path filters in every view too:
      // the displayed summary value never derives from the series, but the
      // exported series and stats must match what the capture's provenance
      // header claims.
      if (!adoptedLive && wyt) {
        series = filterSeriesByWyt(series, wyt, mockWaterYearType)
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
        waterYears,
        isLive: adoptedLive,
        stats,
        bands,
        value,
      }
    })

    const viewUnit = variable.viewUnits?.[view]
    const unit = isPct
      ? "%"
      : view === "cv"
        ? ""
        : (viewUnit?.unit ?? variable.unit)
    const unitLabel = isPct
      ? "percent of capacity"
      : view === "cv"
        ? "coefficient of variation"
        : (viewUnit?.unitLabel ?? variable.unitLabel)

    return {
      variable,
      members,
      view,
      unit,
      unitLabel,
      provisional: variable.provisional ?? false,
      source: anyLive ? "live" : "mock",
      ...emptyContext,
      wytApplicable,
      isLoading: liveEligible ? liveLoading : false,
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
    liveEligible,
    subject,
    period,
    domain,
    unitToken,
    liveSignature,
    liveLoading,
    wytJoined,
  ])
}
