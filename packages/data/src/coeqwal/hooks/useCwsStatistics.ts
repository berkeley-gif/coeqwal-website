"use client"

/**
 * Hooks for fetching CWS aggregate, M&I contractor, and demand unit statistics data
 *
 * Used for M&I delivery and shortage charts in the Data Explorer.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchCwsAggregatesList,
  fetchCwsAggregatesMonthly,
  fetchCwsAggregatesPeriod,
  fetchMiContractorsList,
  fetchMiContractorsMonthly,
  fetchMiContractorsPeriod,
  fetchDemandUnitsList,
  fetchDemandUnitsGroups,
  fetchDemandUnitStatistics,
  fetchDemandUnitsMonthly,
  fetchDemandUnitsPeriod,
} from "../fetchers"
import type {
  CwsAggregatesListResponse,
  CwsAggregateMonthlyResponse,
  CwsAggregatePeriodResponse,
  MiContractorsListResponse,
  MiContractorMonthlyResponse,
  MiContractorPeriodResponse,
  DemandUnitsListResponse,
  DemandUnitsGroupedResponse,
  DemandUnitStatisticsResponse,
  DemandUnitMonthlyResponse,
  DemandUnitPeriodResponse,
} from "../types"

/**
 * Fetch and cache the list of CWS aggregate entities
 *
 * @returns CWS aggregates list with loading and error states
 *
 * @example
 * ```typescript
 * function AggregateSelector() {
 *   const { aggregates, isLoading } = useCwsAggregatesList()
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Select>
 *       {aggregates.map((agg) => (
 *         <Option key={agg.short_code} value={agg.short_code}>
 *           {agg.label}
 *         </Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useCwsAggregatesList() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<CwsAggregatesListResponse>(
    CACHE_KEYS.CWS_AGGREGATES_LIST,
    fetchCwsAggregatesList,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    aggregates: data?.aggregates ?? [],
    isLoading,
    error,
  }
}

/**
 * Fetch monthly delivery and shortage statistics for CWS aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param aggregate - Optional filter by aggregate short_code
 * @returns Monthly statistics for CWS aggregates
 *
 * @example
 * ```typescript
 * function DeliveryChart({ scenarioId }) {
 *   const { aggregates, isLoading } = useCwsAggregatesMonthly(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(aggregates).map(([code, data]) => (
 *         <PercentileChart
 *           key={code}
 *           label={data.label}
 *           monthlyData={data.monthly_delivery}
 *         />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useCwsAggregatesMonthly(
  scenarioId: string | null,
  aggregate?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<CwsAggregateMonthlyResponse>(
    scenarioId ? CACHE_KEYS.cwsAggregatesMonthly(scenarioId, aggregate) : null,
    () => fetchCwsAggregatesMonthly(scenarioId!, aggregate),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    aggregates: data?.aggregates ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.aggregates).length > 0,
  }
}

/**
 * Fetch period-of-record summary for CWS aggregates
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param aggregate - Optional filter by aggregate short_code
 * @returns Period summary with annual averages, reliability, and exceedance values
 *
 * @example
 * ```typescript
 * function ReliabilityDashboard({ scenarioId }) {
 *   const { aggregates, isLoading } = useCwsAggregatesPeriod(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Table>
 *       {Object.entries(aggregates).map(([code, summary]) => (
 *         <Row key={code}>
 *           <Cell>{summary.label}</Cell>
 *           <Cell>{summary.reliability_pct}%</Cell>
 *           <Cell>{summary.annual_delivery_avg_taf} TAF</Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   )
 * }
 * ```
 */
export function useCwsAggregatesPeriod(
  scenarioId: string | null,
  aggregate?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<CwsAggregatePeriodResponse>(
    scenarioId ? CACHE_KEYS.cwsAggregatesPeriod(scenarioId, aggregate) : null,
    () => fetchCwsAggregatesPeriod(scenarioId!, aggregate),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    aggregates: data?.aggregates ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.aggregates).length > 0,
  }
}

// ============================================================================
// M&I Contractors Hooks (30 SWP water agency contractors)
// ============================================================================

/**
 * Fetch and cache the list of M&I contractors
 *
 * @param group - Optional filter by group (e.g., "swp")
 * @returns M&I contractors list with loading and error states
 *
 * @example
 * ```typescript
 * function ContractorSelector() {
 *   const { contractors, isLoading } = useMiContractorsList()
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Select>
 *       {contractors.map((c) => (
 *         <Option key={c.short_code} value={c.short_code}>
 *           {c.label}
 *         </Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useMiContractorsList(group?: string) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<MiContractorsListResponse>(
    CACHE_KEYS.miContractorsList(group),
    () => fetchMiContractorsList(group),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    contractors: data?.contractors ?? [],
    isLoading,
    error,
  }
}

/**
 * Fetch monthly delivery and shortage statistics for M&I contractors
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param contractor - Optional filter by contractor short_code
 * @returns Monthly statistics for M&I contractors
 *
 * @example
 * ```typescript
 * function ContractorDeliveryChart({ scenarioId }) {
 *   const { contractors, isLoading } = useMiContractorsMonthly(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(contractors).map(([code, data]) => (
 *         <PercentileChart
 *           key={code}
 *           label={data.label}
 *           monthlyData={data.monthly_delivery}
 *         />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useMiContractorsMonthly(
  scenarioId: string | null,
  contractor?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<MiContractorMonthlyResponse>(
    scenarioId ? CACHE_KEYS.miContractorsMonthly(scenarioId, contractor) : null,
    () => fetchMiContractorsMonthly(scenarioId!, contractor),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    contractors: data?.contractors ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.contractors).length > 0,
  }
}

/**
 * Fetch period-of-record summary for M&I contractors
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param contractor - Optional filter by contractor short_code
 * @returns Period summary with annual averages, reliability, and exceedance values
 *
 * @example
 * ```typescript
 * function ContractorReliability({ scenarioId }) {
 *   const { contractors, isLoading } = useMiContractorsPeriod(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Table>
 *       {Object.entries(contractors).map(([code, summary]) => (
 *         <Row key={code}>
 *           <Cell>{summary.label}</Cell>
 *           <Cell>{summary.reliability_pct}%</Cell>
 *           <Cell>{summary.annual_delivery_avg_taf} TAF</Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   )
 * }
 * ```
 */
export function useMiContractorsPeriod(
  scenarioId: string | null,
  contractor?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<MiContractorPeriodResponse>(
    scenarioId ? CACHE_KEYS.miContractorsPeriod(scenarioId, contractor) : null,
    () => fetchMiContractorsPeriod(scenarioId!, contractor),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    contractors: data?.contractors ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.contractors).length > 0,
  }
}

// ============================================================================
// Urban Demand Units Hooks (46 demand units)
// ============================================================================

/**
 * Map hydrologic region codes to display groups
 * API returns: SAC, SJR, SOD, TULARE
 */
function mapRegionToGroup(region: string): string {
  const regionMap: Record<string, string> = {
    SAC: "Sacramento Region",
    SJR: "San Joaquin Region",
    SOD: "South of Delta",
    TULARE: "Tulare Region",
  }
  return regionMap[region.toUpperCase()] ?? region
}

/**
 * Fetch and cache the list of urban demand units
 *
 * @param group - Optional filter by group (e.g., "swp", "cvp")
 * @returns Demand units list with loading and error states
 *
 * @example
 * ```typescript
 * function DemandUnitSelector() {
 *   const { demandUnits, isLoading } = useDemandUnitsList()
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Select>
 *       {demandUnits.map((du) => (
 *         <Option key={du.du_id} value={du.du_id}>
 *           {du.label}
 *         </Option>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useDemandUnitsList(group?: string) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DemandUnitsListResponse>(
    CACHE_KEYS.demandUnitsList(group),
    () => fetchDemandUnitsList(group),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  // Handle both possible API response structures:
  // 1. { demand_units: [...] } - wrapped format
  // 2. [...] - direct array format
  // Also normalize field names (API may use 'name' instead of 'label', etc.)
  let demandUnits: Array<{ du_id: string; label: string; group?: string }> = []

  if (data) {
    let rawUnits: unknown[] = []

    if (Array.isArray(data.demand_units)) {
      rawUnits = data.demand_units
    } else if (Array.isArray(data)) {
      rawUnits = data as unknown[]
    }

    // Normalize field names from API response
    // API returns: du_id, community_agency, hydrologic_region
    demandUnits = rawUnits
      .filter(
        (item): item is Record<string, unknown> =>
          item != null && typeof item === "object",
      )
      .map((item) => ({
        du_id: String(item.du_id ?? item.id ?? ""),
        // API uses 'community_agency' for the display name
        label: String(
          item.label ?? item.community_agency ?? item.name ?? item.du_id ?? "",
        ),
        // API uses 'hydrologic_region' (SAC, SJR, SOD, TULARE) - map to SWP/CVP based on region
        group: mapRegionToGroup(
          String(item.group ?? item.hydrologic_region ?? "other"),
        ),
      }))
      .filter((du) => du.du_id) // Filter out entries without an ID
  }

  return {
    data,
    demandUnits,
    isLoading,
    error,
  }
}

/**
 * Fetch and cache the list of urban demand units organized by group
 *
 * @returns Demand units grouped by category with loading and error states
 *
 * @example
 * ```typescript
 * function GroupedDemandUnitSelector() {
 *   const { groups, isLoading } = useDemandUnitsGroups()
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Select>
 *       {Object.entries(groups).map(([groupName, units]) => (
 *         <OptGroup key={groupName} label={groupName}>
 *           {units.map((du) => (
 *             <Option key={du.du_id} value={du.du_id}>
 *               {du.label}
 *             </Option>
 *           ))}
 *         </OptGroup>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */
export function useDemandUnitsGroups() {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DemandUnitsGroupedResponse>(
    CACHE_KEYS.DEMAND_UNITS_GROUPS,
    fetchDemandUnitsGroups,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  // Handle both possible API response structures:
  // 1. { groups: { swp: [...], cvp: [...] } } - wrapped format
  // 2. { swp: [...], cvp: [...] } - direct format (groups at top level)
  let groups: Record<string, Array<{ du_id: string; label: string }>> = {}

  if (data) {
    if (data.groups && typeof data.groups === "object") {
      // Wrapped format: { groups: { swp: [...], cvp: [...] } }
      groups = data.groups
    } else {
      // Direct format: { swp: [...], cvp: [...] }
      // Filter out non-array properties (like metadata fields)
      const directData = data as unknown as Record<string, unknown>
      Object.entries(directData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          groups[key] = value as Array<{ du_id: string; label: string }>
        }
      })
    }
  }

  return {
    data,
    groups,
    isLoading,
    error,
  }
}

/**
 * Fetch monthly delivery and shortage statistics for urban demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID (e.g., "UD_ACWD")
 * @param group - Optional group filter (e.g., "swp")
 * @returns Monthly statistics for urban demand units
 *
 * @example
 * ```typescript
 * function DemandUnitDeliveryChart({ scenarioId }) {
 *   const { demandUnits, isLoading } = useDemandUnitsMonthly(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Grid>
 *       {Object.entries(demandUnits).map(([id, data]) => (
 *         <PercentileChart
 *           key={id}
 *           label={data.label}
 *           monthlyData={data.monthly_delivery}
 *         />
 *       ))}
 *     </Grid>
 *   )
 * }
 * ```
 */
export function useDemandUnitsMonthly(
  scenarioId: string | null,
  duId?: string,
  group?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DemandUnitMonthlyResponse>(
    scenarioId ? CACHE_KEYS.demandUnitsMonthly(scenarioId, duId, group) : null,
    () => fetchDemandUnitsMonthly(scenarioId!, duId, group),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    demandUnits: data?.demand_units ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

/**
 * Fetch period-of-record summary for urban demand units
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID
 * @param group - Optional group filter
 * @returns Period summary with annual averages, reliability, and exceedance values
 *
 * @example
 * ```typescript
 * function DemandUnitReliability({ scenarioId }) {
 *   const { demandUnits, isLoading } = useDemandUnitsPeriod(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <Table>
 *       {Object.entries(demandUnits).map(([id, summary]) => (
 *         <Row key={id}>
 *           <Cell>{summary.label}</Cell>
 *           <Cell>{summary.reliability_pct}%</Cell>
 *           <Cell>{summary.annual_delivery_avg_taf} TAF</Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   )
 * }
 * ```
 */
export function useDemandUnitsPeriod(
  scenarioId: string | null,
  duId?: string,
  group?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DemandUnitPeriodResponse>(
    scenarioId ? CACHE_KEYS.demandUnitsPeriod(scenarioId, duId, group) : null,
    () => fetchDemandUnitsPeriod(scenarioId!, duId, group),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    demandUnits: data?.demand_units ?? {},
    isLoading,
    error,
    hasData: !!data && Object.keys(data.demand_units).length > 0,
  }
}

/**
 * Fetch complete statistics for a single demand unit
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Demand unit ID (e.g., "MWD", "SBA029")
 * @returns Complete statistics including monthly delivery/shortage and period summary
 *
 * @example
 * ```typescript
 * function DemandUnitChart({ scenarioId, duId }) {
 *   const { data, isLoading } = useDemandUnitStatistics(scenarioId, duId)
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <PercentileChart
 *       label={data.community_agency}
 *       monthlyData={data.monthly_delivery}
 *     />
 *   )
 * }
 * ```
 */
export function useDemandUnitStatistics(
  scenarioId: string | null,
  duId: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DemandUnitStatisticsResponse>(
    scenarioId && duId
      ? CACHE_KEYS.demandUnitStatistics(scenarioId, duId)
      : null,
    () => fetchDemandUnitStatistics(scenarioId!, duId!),
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    scenarioId: data?.scenario_id,
    duId: data?.du_id,
    label: data?.community_agency,
    monthlyDelivery: data?.monthly_delivery ?? null,
    monthlyShortage: data?.monthly_shortage ?? null,
    periodSummary: data?.period_summary ?? null,
    isLoading,
    error,
    hasData: !!data,
  }
}
