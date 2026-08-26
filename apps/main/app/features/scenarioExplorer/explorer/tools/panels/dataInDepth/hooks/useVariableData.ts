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
 * The locations axis is live too: ONE request for the held scenario carries
 * every selected location's subject, and each member picks its own series by
 * subject id (`locationAxisRequest`). Any variable not served by a
 * data-in-depth endpoint uses the deterministic sample-data engine. Each
 * member falls back to mock individually if its live series is absent, and the
 * card is labeled per the resolved `source`.
 *
 * Member ids resolve to concrete scenario short_codes before fetching:
 * - scenarios axis: each compared scenario through the PINNED
 *   hydroclimate (`useResolvedIdMappings()[heldClimate]`), so pinning a
 *   climate other than the workspace selection keeps the chart live.
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
  useAgDataInDepth,
} from "@repo/data/coeqwal/hooks"
import type { DidAgMeasure } from "@repo/data/coeqwal"
import { useDataSlice, useWorkspaceSlice } from "../../../../store"
import { useResolvedIdMappings } from "../../../../../../scenarios/hooks"
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
  LEVEL_VIEW_UNAVAILABLE_REASON,
  LOCATION_GROUPS,
  type VariableDef,
  type VariableView,
} from "../config/variableRegistry"
import {
  shortagePctOfDemand,
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
  companionUnitTokensForView,
  includeForView,
  pickLiveSeriesPoints,
  sumAlignedSeriesPoints,
  blockHasSubject,
  trimPointsToYearRange,
  locationAxisRequest,
  SSJV_ALL_ROUTES_LOCATION,
  SSJV_ROUTE_SUBJECTS,
  viewHasLiveSource,
  hasEmptyScenariosResponse,
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
  /** True when the variable IS live-eligible and this member's request
   *  resolved, but the endpoint served no block for the scenario: the
   *  scenario is not modeled for this variable (salmon under the Delta
   *  Conveyance Project). Distinct from a plain mock fallback, which means
   *  "not wired yet" rather than "does not exist". `isLive` stays false. */
  liveDataMissing?: boolean
  /** True while this member's own live request is still in flight. Its
   *  series is the sample engine's stand-in until the answer lands, so it
   *  is neither drawn nor quoted; the card shows it as loading. */
  pending?: boolean
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
  /** True when some members are live and others are not, so a single
   *  chart-level provenance badge would misdescribe part of the figure */
  mixedSource: boolean
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
  /** Set when the selection cannot be shown at all (a groundwater total on
   *  the Level view): the card shows this reason instead of a chart, and
   *  no request is made. Members are still listed so the legend reads. */
  unavailableReason?: string
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
  /** Index into the per-scenario live fan-out slots (every axis) */
  slotIndex?: number
  /** Locations axis: this member's subject in the shared block, the SSJV
   *  route list for the synthetic total, or null when unmapped (sample). */
  subject?: string | readonly string[] | null
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

  // A groundwater total on the Level view cannot be shown: no request goes
  // out for it and the card renders the reason (the locations axis checks
  // its compared members instead of the pin).
  const heldLocationDef = groupId
    ? getLocation(groupId, heldLocation)
    : undefined
  const comparedLocationIds = (
    (groupId ? selectedLocationsByGroup[groupId] : undefined) ?? []
  ).filter((id) => group?.items.some((l) => l.id === id))
  const levelUnavailable =
    view === "level" &&
    (compareBy === "locations"
      ? (comparedLocationIds.length > 0
          ? comparedLocationIds
          : (group?.items.slice(0, DEFAULT_LOCATION_COUNT).map((l) => l.id) ??
            [])
        ).some((id) => groupId && getLocation(groupId, id)?.levelView === false)
      : heldLocationDef?.levelView === false)
  const unavailableReason = levelUnavailable
    ? LEVEL_VIEW_UNAVAILABLE_REASON
    : undefined

  // Live request mapping for the current variable (null domain -> mock only).
  const domain = variable ? didDomainForVariable(variable.id) : null
  const period = variable ? didPeriodForVariable(variable.id) : null
  const subject =
    domain && !levelUnavailable
      ? toDidSubject(domain, heldLocation, variable?.id)
      : null
  // The synthetic SSJV total has no served subject of its own: it fetches
  // all three route subjects and sums them fail-closed at adoption time.
  const isSsjvTotal =
    variable?.id === "ssjv_exp" && heldLocation === SSJV_ALL_ROUTES_LOCATION
  // Locations axis: the compared location ids (chosen, or the seeded first
  // few) and the single request they share. Hoisted so the request and the
  // member specs below cannot disagree.
  const isLocationsAxis = compareBy === "locations"
  const locationMemberIds =
    comparedLocationIds.length > 0
      ? comparedLocationIds
      : (group?.items.slice(0, DEFAULT_LOCATION_COUNT).map((l) => l.id) ?? [])
  const locationRequest =
    isLocationsAxis && domain && variable && !levelUnavailable
      ? locationAxisRequest(domain, variable.id, locationMemberIds)
      : null
  const locationRequestSignature = locationRequest?.subjects.join(",") ?? ""
  const unitToken = domain
    ? unitTokenForView(domain, view, variable?.id)
    : "volume"
  // Extra measures the request needs beyond the primary one. Only the ag
  // percent-of-demand view has any: it is derived from two served series.
  const companionTokens = domain
    ? companionUnitTokensForView(domain, view, variable?.id)
    : []
  const companionSignature = companionTokens.join(",")
  const include = includeForView(view)

  // Resolve member ids to concrete scenario short_codes for the live fetch,
  // always through the PINNED hydroclimate. Scenarios axis: each compared
  // scenario's variant under the held climate. Locations axis: the held
  // scenario's variant under the held climate. Climates axis: the held
  // scenario through every compared climate, one variant id per member. A
  // climate whose scenario list has not loaded, or a scenario with no variant
  // under it, yields null, which keeps that member on labeled sample data
  // rather than borrowing another climate's series.
  const resolvedAll = useResolvedIdMappings()
  const heldMapping = resolvedAll[heldClimate]?.idMapping
  const liveEligible =
    domain != null &&
    (isLocationsAxis
      ? locationRequest != null && locationRequest.subjects.length > 0
      : subject != null || isSsjvTotal) &&
    period != null &&
    viewHasLiveSource(view) &&
    liveAxisEligible(compareBy)

  // Compared climate keys, shared by the fan-out and the member specs below
  // so slot indexes and ids stay aligned.
  const comparedClimates = comparedClimateKeys(selectedClimates)

  // Resolved short_code (or null) per member, in member order.
  const fanoutIds = !liveEligible
    ? []
    : compareBy === "scenarios"
      ? compareScenarioIds.map((id) => heldMapping?.[id] ?? null)
      : isLocationsAxis
        ? [heldMapping?.[heldScenario] ?? null]
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
  // The subject list every domain hook requests: the shared locations-axis
  // list, or the held location's subject (the SSJV total's three routes).
  const requestSubjects: string[] | undefined = isLocationsAxis
    ? locationRequest?.subjects
    : isSsjvTotal
      ? [...SSJV_ROUTE_SUBJECTS]
      : subject
        ? [subject]
        : undefined

  // Fan out each domain's endpoint across the comparison scenarios. Only the
  // active domain passes real ids; the others pass [] so every slot defers.
  // The hook count stays constant across renders (Rules of Hooks).
  const reservoirSlots = useMultiScenarioSlots(
    domain === "reservoir" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useReservoirStorageDataInDepth(id ? [id] : [], {
        subjects: requestSubjects,
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
        subjects: requestSubjects,
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
        subjects: requestSubjects,
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
        subjects: requestSubjects,
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
        subjects: requestSubjects,
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
        subjects: requestSubjects,
        units: ["nof_3yr_avg"],
        include,
      }),
  )
  const cwsSlots = useMultiScenarioSlots(
    domain === "cws" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useCwsDataInDepth(id ? [id] : [], {
        subjects: requestSubjects,
        // The cws request token IS the measure name (delivery /
        // shortage_total / shortage_pct / welfare_loss); anything else
        // defers to delivery.
        measures: [
          unitToken === "shortage_pct"
            ? "shortage_pct"
            : unitToken === "shortage_total"
              ? "shortage_total"
              : unitToken === "welfare_loss"
                ? "welfare_loss"
                : "delivery",
        ],
        // No wyt: the CWS series aggregate by calendar year, so the filter
        // does not apply. It is not a field on CwsDataInDepthOptions, and the
        // endpoint builder throws if one is smuggled past that.
        include,
      }),
  )
  const agSlots = useMultiScenarioSlots(
    domain === "ag" ? fanoutIds : [],
    (id) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiScenarioSlots calls this a fixed number of times per render
      useAgDataInDepth(id ? [id] : [], {
        subjects: requestSubjects,
        // Like cws, the ag request token IS the measure name; anything else
        // defers to the delivery measure. Unlike cws, ag IS water-year data,
        // so the water-year-type filter applies and rides along.
        measures: [
          unitToken === "gw_pumping"
            ? "gw_pumping"
            : unitToken === "shortage"
              ? "shortage"
              : unitToken === "revenue"
                ? "revenue"
                : "net_diversion",
          // The percent-of-demand view needs net_diversion alongside
          // shortage, because the endpoint serves no percent measure.
          ...(companionSignature ? (companionTokens as DidAgMeasure[]) : []),
        ],
        include,
        wyt,
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
                  : domain === "ag"
                    ? agSlots
                    : []
  const liveSignature = activeSlots
    .map((r) => (r?.hasData ? "1" : "0"))
    .join("")
  // Per-slot "resolved but served nothing for this scenario". Kept as its own
  // signal because hasData cannot express it: the endpoint answers 200 with an
  // empty scenarios array, so hasData is true either way.
  const emptyResponseBySlot = activeSlots.map((r) =>
    hasEmptyScenariosResponse(r),
  )
  const emptyResponseSignature = emptyResponseBySlot
    .map((v) => (v ? "1" : "0"))
    .join("")
  const liveLoading = activeSlots.some((r) => r?.isLoading)
  // Per-slot in-flight state, so a member can be marked pending on its own.
  const loadingSignature = activeSlots
    .map((r) => (r?.isLoading ? "1" : "0"))
    .join("")

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
        mixedSource: false,
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
      // One shared slot; each member picks its own subject from it.
      locationMemberIds.forEach((id, i) => {
        specs.push({
          id,
          label: getLocation(groupId, id)?.name ?? id,
          isReference: false,
          scenarioId: heldScenario,
          climateKey: heldClimate,
          locationId: id,
          slotIndex: 0,
          subject: locationRequest?.memberSubjects[i] ?? null,
        })
      })
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
        // Sample percent-of-demand: shortage over shortage-plus-delivered,
        // both from the sample engine. The delivered term is the sector's own
        // delivery variable. For CWS a live member overwrites this with the
        // endpoint's served shortage_pct measure below; for ag there is no
        // served percent measure, so the live path derives it the same way.
        series = shortagePctOfDemand(
          raw,
          mockAnnualSeries(
            variable.id === "ag_short" ? "ag_del" : "cws_del",
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
      // The served block exists but lacks this member's subject: not
      // modeled for this scenario, reported like an empty response.
      let subjectAbsent = false

      // Live override: the endpoint already returns the requested unit
      // (TAF / PCT_CAP / km), so no capacity math is applied to live series.
      if (liveEligible && period && domain && spec.slotIndex != null) {
        const slot = activeSlots[spec.slotIndex]
        const block = slot?.scenarios?.[0]
        // What this member picks from the block: on the locations axis its
        // own subject (or route list); elsewhere the held location's.
        const memberSubject: string | readonly string[] | null = isLocationsAxis
          ? (spec.subject ?? null)
          : isSsjvTotal
            ? SSJV_ROUTE_SUBJECTS
            : subject
        const memberSingle =
          typeof memberSubject === "string" ? memberSubject : null
        subjectAbsent =
          !!block &&
          !!slot?.hasData &&
          !slot.isLoading &&
          memberSingle != null &&
          !blockHasSubject(block, domain, memberSingle)
        // Served stub years (the CWS delivery family) are dropped before
        // anything is computed from the series.
        const range = variable.servedYearRange
        const pick = (code: string, token: typeof unitToken) => {
          const p = pickLiveSeriesPoints(block, domain, code, period, token)
          return range ? trimPointsToYearRange(p, range) : p
        }
        // The synthetic SSJV total sums the three served route series,
        // FAIL-CLOSED: a null sum (missing route, misaligned years) falls
        // back to sample labeling, never a partial total.
        const points =
          memberSubject == null
            ? null
            : typeof memberSubject === "string"
              ? pick(memberSubject, unitToken)
              : sumAlignedSeriesPoints(
                  memberSubject.map((code) => pick(code, unitToken)),
                )
        // The ag percent-of-demand view has no served percent measure, so it
        // is derived from the primary shortage series and the companion
        // net_diversion series in the SAME response block. If either is
        // missing the member falls back to sample data rather than showing a
        // half-derived number.
        if (isPctDemand && companionTokens.length > 0 && memberSingle) {
          const companion = pick(
            memberSingle,
            companionTokens[0] as typeof unitToken,
          )
          if (
            points &&
            points.series.length > 0 &&
            companion.series.length > 0
          ) {
            series = shortagePctOfDemand(points.series, companion.series)
            waterYears =
              points.waterYears.length > 0 ? points.waterYears : undefined
            anyLive = true
            adoptedLive = true
          }
        } else if (points && points.series.length > 0) {
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

      // "Not modeled for this scenario", as distinct from "not wired yet".
      // Only meaningful when the variable IS live-eligible and this member's
      // own request resolved; adoptedLive / anyLive / source semantics are
      // deliberately unchanged.
      const liveDataMissing =
        liveEligible &&
        spec.slotIndex != null &&
        (emptyResponseBySlot[spec.slotIndex] === true || subjectAbsent)

      // In flight: this member's own request has not answered yet, so the
      // series it carries is the sample engine's stand-in. It is flagged so
      // the card neither draws nor quotes it until the answer lands.
      const pending =
        liveEligible &&
        !adoptedLive &&
        spec.slotIndex != null &&
        activeSlots[spec.slotIndex]?.isLoading === true

      return {
        id: spec.id,
        label: spec.label,
        isReference: spec.isReference,
        series,
        waterYears,
        isLive: adoptedLive,
        ...(liveDataMissing ? { liveDataMissing: true } : {}),
        ...(pending ? { pending: true } : {}),
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
      // A live request that served nothing for every member (the scenario, or
      // the subject, is not modeled) is still a live answer: the card shows
      // the no-data notice under a "Live data" badge rather than a "Sample
      // data" badge over an empty chart.
      source:
        anyLive ||
        (members.length > 0 && members.every((m) => m.liveDataMissing))
          ? "live"
          : "mock",
      // A single chart-level badge misdescribes the figure the moment one
      // series is live and another is not.
      mixedSource: anyLive && members.some((m) => !m.isLive),
      ...emptyContext,
      wytApplicable,
      ...(unavailableReason ? { unavailableReason } : {}),
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
    companionSignature,
    liveSignature,
    emptyResponseSignature,
    liveLoading,
    loadingSignature,
    wytJoined,
    unavailableReason,
    locationRequestSignature,
  ])
}
