"use client"

/**
 * useMiContractorStatistics.ts - Hooks for fetching M&I contractor statistics (30 SWP water agency contractors).
 *
 * The merged `/mi-contractors/monthly` endpoint returns both delivery and
 * shortage percentile bands. `useMiContractorsPeriod` covers the period-of-
 * record summary (annual averages, reliability percentage, exceedance values).
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import {
  fetchMiContractorsMonthly,
  fetchMiContractorsPeriod,
} from "../fetchers"
import type {
  MiContractorMonthlyResponse,
  MiContractorPeriodResponse,
} from "../types"

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
