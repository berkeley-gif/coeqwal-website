/**
 * Result Summary Briefs — by Strategy
 *
 * Maps each result-summary HTML page (in
 * public/documents/Result_Summary/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug. Each HTML
 * page links to its underlying PDF, which lives in the
 * Result_Summary/pdf/ subfolder.
 *
 * These briefs summarize outcome level results grouped by strategy — they
 * are not resolved against the scenario API/hooks, so no
 * scenario_id/short_code mapping is involved here.
 *
 * To add a new result summary brief: drop the HTML file in that folder and
 * add one entry below.
 */

export interface ResultSummaryDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Result_Summary/. */
  file: string
}

/** Base path (under public/) where result summary pages are served from. */
const RESULT_SUMMARY_STRATEGY_DOCS_PATH = "/documents/Result_Summary"

export const RESULT_SUMMARY_STRATEGY_DOCUMENTS: ResultSummaryDocument[] = [
  {
    id: "current-operations",
    label: "Current operations",
    file: "scenario_results_brief_current-operations.html",
  },
  {
    id: "current-operations-with-historical-land-use",
    label: "Current operations with historical land use",
    file: "scenario_results_brief_current-operations-with-historical-land-use.html",
  },
  {
    id: "current-operations-without-tucp-actions",
    label: "Current operations without TUCPs",
    file: "scenario_results_brief_current-operations-without-tucps.html",
  },
  {
    id: "current-usbr-operations",
    label: "Current USBR operations",
    file: "scenario_results_brief_current-usbr-operations.html",
  },
  {
    id: "current-usbr-operations-without-tucp-actions",
    label: "Current USBR operations without TUCPs",
    file: "scenario_results_brief_current-usbr-operations-without-tucps.html",
  },
  {
    id: "delta-conveyance-project",
    label: "Delta Conveyance Project",
    file: "scenario_results_brief_delta-conveyance-project.html",
  },
  {
    id: "functional-environmental-flows",
    label: "Functional environmental flows",
    file: "scenario_results_brief_functional-environmental-flows.html",
  },
  {
    id: "functional-environmental-flows-with-groundwater-regulations",
    label: "Functional environmental flows with reduced crop acreage",
    file: "scenario_results_brief_functional-environmental-flows-with-reduced-crop-acreage.html",
  },
  {
    id: "groundwater-pumping-limits-in-the-central-valley",
    label: "Groundwater pumping limits in the Central Valley",
    file: "scenario_results_brief_groundwater-pumping-limits-in-the-central-valley.html",
  },
  {
    id: "groundwater-pumping-limits-in-the-san-joaquin-valley",
    label: "Groundwater pumping limits in the San Joaquin Valley",
    file: "scenario_results_brief_groundwater-pumping-limits-in-the-san-joaquin-valley.html",
  },
  {
    id: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-central-valley",
    label:
      "Groundwater pumping limits via reduced crop acreage in the Central Valley",
    file: "scenario_results_brief_groundwater-pumping-limits-via-reduced-crop-acreage-in-the-central-valley.html",
  },
  {
    id: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-san-joaquin-valley",
    label:
      "Groundwater pumping limits via reduced crop acreage in the San Joaquin Valley",
    file: "scenario_results_brief_groundwater-pumping-limits-via-reduced-crop-acreage-in-the-san-joaquin-valley.html",
  },
  {
    id: "increase-delta-outflows-55-of-unimpaired-flow",
    label: "Increase Delta outflows (55% unimpaired flow target)",
    file: "scenario_results_brief_increase-delta-outflows-55-unimpaired-flow-target.html",
  },
  {
    id: "increase-delta-outflows-65-of-unimpaired-flow",
    label: "Increase Delta outflows (65% unimpaired flow target)",
    file: "scenario_results_brief_increase-delta-outflows-65-unimpaired-flow-target.html",
  },
  {
    id: "increase-shasta-carry-over-storage",
    label: "Increase Shasta carry-over storage",
    file: "scenario_results_brief_increase-shasta-carry-over-storage.html",
  },
  {
    id: "maintain-delta-outflows-45-of-unimpaired-flow",
    label: "Maintain Delta outflows (45% unimpaired flow target)",
    file: "scenario_results_brief_maintain-delta-outflows-45-unimpaired-flow-target.html",
  },
  {
    id: "no-minimum-flow-requirements",
    label: "No flow requirements",
    file: "scenario_results_brief_no-flow-requirements.html",
  },
  {
    id: "prioritizing-full-demands-of-community-water-systems",
    label: "Prioritizing full demands of community water systems",
    file: "scenario_results_brief_prioritizing-full-demands-of-community-water-systems.html",
  },
  {
    id: "prioritizing-human-health-delivery-levels-to-community-water-systems",
    label:
      "Prioritizing human health water deliveries to community water systems",
    file: "scenario_results_brief_prioritizing-human-health-water-deliveries-to-community-water-systems.html",
  },
  {
    id: "reduce-delta-outflows-35-of-unimpaired-flow",
    label: "Reduce Delta outflows (35% unimpaired flow target)",
    file: "scenario_results_brief_reduce-delta-outflows-35-unimpaired-flow-target.html",
  },
  {
    id: "relax-delta-salinity-standards",
    label: "Relax Delta salinity standards",
    file: "scenario_results_brief_relax-delta-salinity-standards.html",
  },
  {
    id: "winter-run-refuge-flows",
    label: "Winter-run refuge flows",
    file: "scenario_results_brief_winter-run-refuge-flows.html",
  },
  {
    id: "winter-run-refuge-flows-with-groundwater-regulations",
    label: "Winter-run refuge flows with reduced crop acreage",
    file: "scenario_results_brief_winter-run-refuge-flows-with-reduced-crop-acreage.html",
  },
  {
    id: "current-operations-with-reintroduction",
    label: "Current operations with reintroduction",
    file: "scenario_results_brief_current-operations-with-reintroduction.html",
  },
  {
    id: "winter-run-refuge-flows-with-reintroduction",
    label: "Winter-run refuge flows with reintroduction",
    file: "scenario_results_brief_winter-run-refuge-flows-with-reintroduction.html",
  },
  {
    id: "functional-environmental-flows-with-reduced-crop-acreage-and-reintroduction",
    label:
      "Functional environmental flows with reduced crop acreage and reintroduction",
    file: "scenario_results_brief_functional-environmental-flows-with-reduced-crop-acreage-and-reintroduction.html",
  },
  {
    id: "winter-run-refuge-flows-with-reduced-crop-acreage-and-reintroduction",
    label:
      "Winter-run refuge flows with reduced crop acreage and reintroduction",
    file: "scenario_results_brief_winter-run-refuge-flows-with-reduced-crop-acreage-and-reintroduction.html",
  },
  {
    id: "functional-environmental-flows-with-reintroduction",
    label: "Functional environmental flows with reintroduction",
    file: "scenario_results_brief_functional-environmental-flows-with-reintroduction.html",
  },
]

/** Resolve a result summary document's public URL from its filename. */
export function getResultSummaryStrategyDocumentUrl(file: string): string {
  return `${RESULT_SUMMARY_STRATEGY_DOCS_PATH}/${file}`
}

/** Look up a result summary document by its stable id. */
export function getResultSummaryStrategyDocumentById(
  id: string,
): ResultSummaryDocument | undefined {
  return RESULT_SUMMARY_STRATEGY_DOCUMENTS.find((doc) => doc.id === id)
}
