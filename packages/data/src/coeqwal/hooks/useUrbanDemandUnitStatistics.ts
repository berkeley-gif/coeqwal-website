"use client"

/**
 * useUrbanDemandUnitStatistics.ts - Hooks for fetching urban demand-unit statistics (46 urban demand units).
 *
 * "Demand units" without a qualifier means urban in this API (the unqualified
 * `/demand-units` URL pattern is urban-only by convention). Agricultural DUs
 * live in `useAgStatistics.ts` and hit `/ag-demand-units/*`. Refuge DUs live
 * in `useRefugeStatistics.ts` and hit `/refuge-demand-units/*`.
 *
 * The merged `/demand-units/monthly` endpoint returns both delivery and
 * shortage percentile bands.`useDemandUnitsMonthly` and
 * `useDemandUnitsShortageMonthly` both hit that URL and rely on SWR dedup, so
 * a page that needs both bands costs one HTTP request.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchDemandUnitsList,
  fetchDemandUnitsMonthly,
  fetchDemandUnitsShortageMonthly,
  fetchDemandUnitsPeriod,
} from "../fetchers"
import type {
  DemandUnitsListResponse,
  DemandUnitMonthlyResponse,
  DemandUnitShortageMonthlyResponse,
  DemandUnitPeriodResponse,
} from "../types"

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
 * Fetch monthly shortage statistics for urban demand units.
 *
 * Companion to `useDemandUnitsMonthly`. Both hooks hit the merged
 * `/demand-units/monthly` endpoint, which returns delivery and shortage in a
 * single payload. SWR dedup means a page using both costs one request
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @param duId - Optional filter by demand unit ID
 * @param group - Optional group filter
 */
export function useDemandUnitsShortageMonthly(
  scenarioId: string | null,
  duId?: string,
  group?: string,
) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<DemandUnitShortageMonthlyResponse>(
    scenarioId
      ? CACHE_KEYS.demandUnitsShortageMonthly(scenarioId, duId, group)
      : null,
    () => fetchDemandUnitsShortageMonthly(scenarioId!, duId, group),
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
