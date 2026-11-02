/**
 * Water Management Strategies documentation
 *
 * Maps each strategy-brief HTML page (in
 * public/documents/Strategy_Documentation/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug. Each HTML
 * page links to its underlying PDF, which now lives in the
 * Strategy_Documentation/pdf/ subfolder.
 *
 * Each entry carries the sibling-group scenario_id (the historical variant,
 * e.g. "s0020") it documents, so the explorer can link a strategy row to its
 * brief. That id is shared across hydroclimates, so one brief covers all
 * five variants of a strategy.
 *
 * To add a new strategy doc: drop the HTML file in that folder and add one
 * entry below.
 */

export interface StrategyDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Strategy_Documentation/. */
  file: string
  /** Sibling-group scenario_id this brief documents (e.g. "s0020"). */
  scenarioId: string
}

/** Base path (under public/) where strategy documentation pages are served from. */
const STRATEGY_DOCS_PATH = "/documents/Strategy_Documentation"

export const STRATEGY_DOCUMENTS: StrategyDocument[] = [
  {
    id: "current-operations",
    label: "Current operations",
    file: "strategy_brief_current-operations.html",
    scenarioId: "s0020",
  },
  {
    id: "current-operations-with-historical-land-use",
    label: "Current operations with historical land use",
    file: "strategy_brief_current-operations-with-historical-land-use.html",
    scenarioId: "s0011",
  },
  {
    id: "current-operations-with-reintroduction",
    label: "Current operations with reintroduction",
    file: "strategy_brief_current-operations-with-reintroduction.html",
    scenarioId: "s0020-R",
  },
  {
    id: "current-operations-without-tucp-actions",
    label: "Current operations without TUCP actions",
    file: "strategy_brief_current-operations-without-tucps.html",
    scenarioId: "s0021",
  },
  {
    id: "current-usbr-operations",
    label: "Current USBR operations",
    file: "strategy_brief_current-usbr-operations.html",
    scenarioId: "s0024",
  },
  {
    id: "current-usbr-operations-without-tucp-actions",
    label: "Current USBR operations without TUCP actions",
    file: "strategy_brief_current-usbr-operations-without-tucps.html",
    scenarioId: "s0023",
  },
  {
    id: "delta-conveyance-project",
    label: "Delta conveyance project",
    file: "strategy_brief_delta-conveyance-project.html",
    scenarioId: "s0065",
  },
  {
    id: "functional-environmental-flows",
    label: "Functional environmental flows",
    file: "strategy_brief_functional-environmental-flows.html",
    scenarioId: "s0046",
  },
  {
    id: "functional-environmental-flows-with-groundwater-regulations",
    label: "Functional environmental flows with reduced crop acreage",
    file: "strategy_brief_functional-environmental-flows-with-reduced-crop-acreage.html",
    scenarioId: "s0032",
  },
  {
    id: "functional-environmental-flows-with-reintroduction",
    label: "Functional environmental flows with reintroduction",
    file: "strategy_brief_functional-environmental-flows-with-reintroduction.html",
    scenarioId: "s0046-R",
  },
  {
    id: "functional-environmental-flows-with-reduced-crop-acreage-and-reintroduction",
    label:
      "Functional environmental flows with reduced crop acreage and reintroduction",
    file: "strategy_brief_functional-environmental-flows-with-reduced-crop-acreage-and-reintroduction.html",
    scenarioId: "s0032-R",
  },
  {
    id: "groundwater-pumping-limits-in-the-central-valley",
    label: "Groundwater pumping limits in the Central Valley",
    file: "strategy_brief_groundwater-pumping-limits-in-the-central-valley.html",
    scenarioId: "s0027",
  },
  {
    id: "groundwater-pumping-limits-in-the-san-joaquin-valley",
    label: "Groundwater pumping limits in the San Joaquin Valley",
    file: "strategy_brief_groundwater-pumping-limits-in-the-san-joaquin-valley.html",
    scenarioId: "s0025",
  },
  {
    id: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-central-valley",
    label:
      "Groundwater pumping limits via reduced crop acreage in the Central Valley",
    file: "strategy_brief_groundwater-pumping-limits-via-reduced-crop-acreage-in-the-central-valley.html",
    scenarioId: "s0028",
  },
  {
    id: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-san-joaquin-valley",
    label:
      "Groundwater pumping limits via reduced crop acreage in the San Joaquin Valley",
    file: "strategy_brief_groundwater-pumping-limits-via-reduced-crop-acreage-in-the-san-joaquin-valley.html",
    scenarioId: "s0026",
  },
  {
    id: "increase-delta-outflows-55-of-unimpaired-flow",
    label: "Increase Delta outflows (55% of unimpaired flow)",
    file: "strategy_brief_increase-delta-outflows-55-unimpaired-flow-target.html",
    scenarioId: "s0042",
  },
  {
    id: "increase-delta-outflows-65-of-unimpaired-flow",
    label: "Increase Delta outflows (65% of unimpaired flow)",
    file: "strategy_brief_increase-delta-outflows-65-unimpaired-flow-target.html",
    scenarioId: "s0039",
  },
  {
    id: "increase-shasta-carry-over-storage",
    label: "Increase Shasta carry-over storage",
    file: "strategy_brief_increase-shasta-carry-over-storage.html",
    scenarioId: "s0044",
  },
  {
    id: "maintain-delta-outflows-45-of-unimpaired-flow",
    label: "Maintain Delta outflows (45% of unimpaired flow)",
    file: "strategy_brief_maintain-delta-outflows-45-unimpaired-flow-target.html",
    scenarioId: "s0041",
  },
  {
    id: "no-minimum-flow-requirements",
    label: "No flow requirements",
    file: "strategy_brief_no-flow-requirements.html",
    scenarioId: "s0030",
  },
  {
    id: "prioritizing-full-demands-of-community-water-systems",
    label: "Prioritizing full demands of community water systems",
    file: "strategy_brief_prioritizing-full-demands-of-community-water-systems.html",
    scenarioId: "s0037",
  },
  {
    id: "prioritizing-human-health-delivery-levels-to-community-water-systems",
    label:
      "Prioritizing human health delivery levels to community water systems",
    file: "strategy_brief_prioritizing-human-health-water-deliveries-to-community-water-systems.html",
    scenarioId: "s0035",
  },
  {
    id: "reduce-delta-outflows-35-of-unimpaired-flow",
    label: "Reduce Delta outflows (35% of unimpaired flow)",
    file: "strategy_brief_reduce-delta-outflows-35-unimpaired-flow-target.html",
    scenarioId: "s0040",
  },
  {
    id: "relax-delta-salinity-standards",
    label: "Relax Delta salinity standards",
    file: "strategy_brief_relax-delta-salinity-standards.html",
    scenarioId: "s0045",
  },
  {
    id: "winter-run-refuge-flows",
    label: "Winter-run refuge flows",
    file: "strategy_brief_winter-run-refuge-flows.html",
    scenarioId: "s0031",
  },
  {
    id: "winter-run-refuge-flows-with-groundwater-regulations",
    label: "Winter-run refuge flows with reduced crop acreage",
    file: "strategy_brief_winter-run-refuge-flows-with-reduced-crop-acreage.html",
    scenarioId: "s0033",
  },
  {
    id: "winter-run-refuge-flows-with-reintroduction",
    label: "Winter-run refuge flows with reintroduction",
    file: "strategy_brief_winter-run-refuge-flows-with-reintroduction.html",
    scenarioId: "s0031-R",
  },
  {
    id: "winter-run-refuge-flows-with-reduced-crop-acreage-and-reintroduction",
    label:
      "Winter-run refuge flows with reduced crop acreage and reintroduction",
    file: "strategy_brief_winter-run-refuge-flows-with-reduced-crop-acreage-and-reintroduction.html",
    scenarioId: "s0033-R",
  },
]

/** Resolve a strategy document's public URL from its filename. */
export function getStrategyDocumentUrl(file: string): string {
  return `${STRATEGY_DOCS_PATH}/${file}`
}

/** Look up a strategy document by its stable id. */
export function getStrategyDocumentById(
  id: string,
): StrategyDocument | undefined {
  return STRATEGY_DOCUMENTS.find((doc) => doc.id === id)
}

/** Look up the brief for a strategy by its sibling-group scenario_id. */
export function getStrategyDocumentByScenarioId(
  scenarioId: string,
): StrategyDocument | undefined {
  return STRATEGY_DOCUMENTS.find((doc) => doc.scenarioId === scenarioId)
}