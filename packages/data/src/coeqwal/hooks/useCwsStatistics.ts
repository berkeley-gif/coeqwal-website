"use client"

/**
 * Hooks for fetching M&I contractor and urban demand unit statistics.
 *
 * Used for M&I delivery and shortage charts in the Data Explorer. CWS aggregate
 * data is served through the batch endpoint.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchMiContractorsMonthly,
  fetchMiContractorsPeriod,
  fetchDemandUnitsList,
  fetchDemandUnitStatistics,
  fetchDemandUnitsMonthly,
  fetchDemandUnitsPeriod,
} from "../fetchers"
import type {
  MiContractorMonthlyResponse,
  MiContractorPeriodResponse,
  DemandUnitsListResponse,
  DemandUnitStatisticsResponse,
  DemandUnitMonthlyResponse,
  DemandUnitPeriodResponse,
} from "../types"

// ============================================================================
// M&I Contractors Hooks (30 SWP water agency contractors)
// ============================================================================

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
