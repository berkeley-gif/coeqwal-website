/**
 * Result Summary Briefs — by Outcome
 *
 * Maps each key-outcome-summary HTML page (in
 * public/documents/Result_Summary/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug. Each HTML
 * page links to its underlying PDF, which lives in the
 * Result_Summary/pdf/ subfolder.
 *
 * These briefs summarize outcome level results grouped by outcome — they
 * are not resolved against the scenario API/hooks, so no
 * scenario_id/short_code mapping is involved here.
 *
 * To add a new result summary brief: drop the HTML file in that folder and
 * add one entry below.
 */

import type { ResultSummaryDocument } from "./resultSummaryStrategy"

/** Base path (under public/) where result summary pages are served from. */
const RESULT_SUMMARY_OUTCOME_DOCS_PATH = "/documents/Result_Summary"

export const RESULT_SUMMARY_OUTCOME_DOCUMENTS: ResultSummaryDocument[] = [
  {
    id: "agricultural-revenue",
    label: "Agricultural revenue",
    file: "key_outcome_summary_agricultural-revenue.html",
  },
  {
    id: "community-water-systems",
    label: "Community water systems",
    file: "key_outcome_summary_community-water-systems.html",
  },
  {
    id: "delta-estuary-ecology",
    label: "Delta estuary ecology",
    file: "key_outcome_summary_delta-estuary-ecology.html",
  },
  {
    id: "environmental-flows",
    label: "Environmental flows",
    file: "key_outcome_summary_environmental-flows.html",
  },
  {
    id: "freshwater-for-delta-exports",
    label: "Freshwater for Delta exports",
    file: "key_outcome_summary_freshwater-for-delta-exports.html",
  },
  {
    id: "freshwater-for-in-delta-uses",
    label: "Freshwater for in-Delta uses",
    file: "key_outcome_summary_freshwater-for-in-delta-uses.html",
  },
  {
    id: "groundwater-storage",
    label: "Groundwater storage",
    file: "key_outcome_summary_groundwater-storage.html",
  },
  {
    id: "reservoir-storage",
    label: "Reservoir storage",
    file: "key_outcome_summary_reservoir-storage.html",
  },
  {
    id: "winter-run-salmon",
    label: "Winter-run salmon",
    file: "key_outcome_summary_winter-run-salmon.html",
  },
]

/** Resolve a result summary document's public URL from its filename. */
export function getResultSummaryOutcomeDocumentUrl(file: string): string {
  return `${RESULT_SUMMARY_OUTCOME_DOCS_PATH}/${file}`
}

/** Look up a result summary document by its stable id. */
export function getResultSummaryOutcomeDocumentById(
  id: string,
): ResultSummaryDocument | undefined {
  return RESULT_SUMMARY_OUTCOME_DOCUMENTS.find((doc) => doc.id === id)
}
