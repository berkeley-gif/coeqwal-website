import type { BatchStatisticsResponse } from "@repo/data/coeqwal"

/**
 * Shared props contract for Data in depth category sections.
 *
 * Every section in CategoryView is one of two shapes:
 *
 *  - BatchSectionProps: backed by the single useBatchStatistics call in
 *    CategoryView. The parent fetches once and threads batchData +
 *    isBatchLoading down. Used by CWS, AG, env flow, delta, and reservoir
 *    storage.
 *
 *  - FanoutSectionProps: backed by per-scenario fan-out hooks
 *    (useMultiScenarioSlots) because the data is not part of the batch
 *    endpoint. Used by refuge.
 *
 * Section internal layout convention (see README): SectionHeader wraps
 * ChartGridProvider, which wraps GridScenarioHeader and the body, with an
 * optional MobileModal expand.
 */
export interface FanoutSectionProps {
  /** Resolved scenario ids to compare (columns). */
  scenarios: string[]
  /** Maps scenarioId to display name. */
  scenarioNames: Record<string, string>
}

export interface BatchSectionProps extends FanoutSectionProps {
  /** Pre-fetched batch response (storage/cws/ag/env_flow keyed by scenario). */
  batchData: BatchStatisticsResponse | undefined
  /** Whether the batched fetch is still in flight. */
  isBatchLoading: boolean
}
