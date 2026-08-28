/**
 * Water Management Strategies documentation
 *
 * Maps each strategy-documentation PDF (in
 * public/documents/Strategy_Documentation/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug.
 *
 * These documents are standalone reference material — they are not resolved
 * against the scenario API/hooks, so no scenario_id/short_code mapping is
 * involved here.
 *
 * To add a new strategy doc: drop the PDF in that folder and add one entry
 * below.
 */

export interface StrategyDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Strategy_Documentation/. */
  file: string
}

/** Base path (under public/) where strategy documentation PDFs are served from. */
const STRATEGY_DOCS_PATH = "/documents/Strategy_Documentation"

export const STRATEGY_DOCUMENTS: StrategyDocument[] = [
  {
    id: "current-operations",
    label: "Current operations",
    file: "current-operations.pdf",
  },
  {
    id: "current-operations-with-historical-land-use",
    label: "Current operations with historical land use",
    file: "current-operations-with-historical-land-use.pdf",
  },
  {
    id: "current-operations-without-tucp-actions",
    label: "Current operations without TUCP actions",
    file: "current-operations-without-tucp-actions.pdf",
  },
  {
    id: "current-usbr-operations",
    label: "Current USBR operations",
    file: "current-usbr-operations.pdf",
  },
  {
    id: "current-usbr-operations-without-tucp-actions",
    label: "Current USBR operations without TUCP actions",
    file: "current-usbr-operations-without-tucp-actions.pdf",
  },
  {
    id: "delta-conveyance-project",
    label: "Delta conveyance project",
    file: "delta-conveyance-project.pdf",
  },
  {
    id: "functional-environmental-flows",
    label: "Functional environmental flows",
    file: "functional-environmental-flows.pdf",
  },
  {
    id: "functional-environmental-flows-with-groundwater-regulations",
    label: "Functional environmental flows with reduced crop acreage",
    file: "functional-environmental-flows-with-groundwater-regulations.pdf",
  },
  {
    id: "groundwater-pumping-limits-in-the-central-valley",
    label: "Groundwater pumping limits in the Central Valley",
    file: "groundwater-pumping-limits-in-the-central-valley.pdf",
  },
  {
    id: "groundwater-pumping-limits-in-the-san-joaquin-valley",
    label: "Groundwater pumping limits in the San Joaquin Valley",
    file: "groundwater-pumping-limits-in-the-san-joaquin-valley.pdf",
  },
  {
    id: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-central-valley",
    label:
      "Groundwater pumping limits via reduced crop acreage in the Central Valley",
    file: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-central-valley.pdf",
  },
  {
    id: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-san-joaquin-valley",
    label:
      "Groundwater pumping limits via reduced crop acreage in the San Joaquin Valley",
    file: "groundwater-pumping-limits-via-reduced-crop-acreage-in-the-san-joaquin-valley.pdf",
  },
  {
    id: "increase-delta-outflows-55-of-unimpaired-flow",
    label: "Increase Delta outflows (55% of unimpaired flow)",
    file: "increase-delta-outflows-55-of-unimpaired-flow.pdf",
  },
  {
    id: "increase-delta-outflows-65-of-unimpaired-flow",
    label: "Increase Delta outflows (65% of unimpaired flow)",
    file: "increase-delta-outflows-65-of-unimpaired-flow.pdf",
  },
  {
    id: "increase-shasta-carry-over-storage",
    label: "Increase Shasta carry-over storage",
    file: "increase-shasta-carry-over-storage.pdf",
  },
  {
    id: "maintain-delta-outflows-45-of-unimpaired-flow",
    label: "Maintain Delta outflows (45% of unimpaired flow)",
    file: "maintain-delta-outflows-45-of-unimpaired-flow.pdf",
  },
  {
    id: "no-minimum-flow-requirements",
    label: "No flow requirements",
    file: "no-minimum-flow-requirements.pdf",
  },
  {
    id: "prioritizing-full-demands-of-community-water-systems",
    label: "Prioritizing full demands of community water systems",
    file: "prioritizing-full-demands-of-community-water-systems.pdf",
  },
  {
    id: "prioritizing-functional-delivery-levels-to-community-water-systems",
    label: "Prioritizing functional delivery levels to community water systems",
    file: "prioritizing-functional-delivery-levels-to-community-water-systems.pdf",
  },
  {
    id: "prioritizing-human-health-delivery-levels-to-community-water-systems",
    label:
      "Prioritizing human health delivery levels to community water systems",
    file: "prioritizing-human-health-delivery-levels-to-community-water-systems.pdf",
  },
  {
    id: "reduce-delta-outflows-35-of-unimpaired-flow",
    label: "Reduce Delta outflows (35% of unimpaired flow)",
    file: "reduce-delta-outflows-35-of-unimpaired-flow.pdf",
  },
  {
    id: "relax-delta-salinity-standards",
    label: "Relax Delta salinity standards",
    file: "relax-delta-salinity-standards.pdf",
  },
  {
    id: "winter-run-refuge-flows",
    label: "Winter-run refuge flows",
    file: "winter-run-refuge-flows.pdf",
  },
  {
    id: "winter-run-refuge-flows-with-groundwater-regulations",
    label: "Winter-run refuge flows with reduced crop acreage",
    file: "winter-run-refuge-flows-with-groundwater-regulations.pdf",
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
