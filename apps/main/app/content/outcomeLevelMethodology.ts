/**
 * Outcome Level Methodology documentation
 *
 * Maps each outcome-level-methodology PDF (in
 * public/documents/Outcome_Level_Methodology/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug.
 *
 * These documents are standalone reference material — they are not resolved
 * against the scenario API/hooks, so no scenario_id/short_code mapping is
 * involved here.
 *
 * To add a new outcome level doc: drop the PDF in that folder and add one
 * entry below.
 */

export interface OutcomeLevelDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Outcome_Level_Methodology/. */
  file: string
}

/** Base path (under public/) where outcome level methodology PDFs are served from. */
const OUTCOME_LEVEL_DOCS_PATH = "/documents/Outcome_Level_Methodology"

export const OUTCOME_LEVEL_DOCUMENTS: OutcomeLevelDocument[] = [
  {
    id: "community-water-deliveries",
    label: "Community water deliveries outcome level brief",
    file: "community-water-deliveries.pdf",
  },
  {
    id: "agricultural-revenues",
    label: "Agricultural revenues outcome level brief",
    file: "agricultural-revenues.pdf",
  },
  {
    id: "environmental-flows",
    label: "Environmental flows outcome level brief",
    file: "environmental-flows.pdf",
  },
  {
    id: "winter-run-chinook-salmon",
    label: "Winter run Chinook salmon outcome level brief",
    file: "winter-run-chinook-salmon.pdf",
  },
  {
    id: "bay-delta-estuary-ecology",
    label: "Bay Delta estuary ecology outcome level brief",
    file: "bay-delta-estuary-ecology.pdf",
  },
  {
    id: "freshwater-for-in-delta-uses",
    label: "Freshwater for in-Delta uses outcome level brief",
    file: "freshwater-for-in-delta-uses.pdf",
  },
  {
    id: "freshwater-for-delta-exports",
    label: "Freshwater for Delta exports outcome level brief",
    file: "freshwater-for-delta-exports.pdf",
  },
  {
    id: "groundwater-storage",
    label: "Groundwater storage outcome level brief",
    file: "groundwater-storage.pdf",
  },
  {
    id: "reservoir-storage",
    label: "Reservoir storage outcome level brief",
    file: "reservoir-storage.pdf",
  },
]

/** Resolve an outcome level document's public URL from its filename. */
export function getOutcomeLevelDocumentUrl(file: string): string {
  return `${OUTCOME_LEVEL_DOCS_PATH}/${file}`
}

/** Look up an outcome level document by its stable id. */
export function getOutcomeLevelDocumentById(
  id: string,
): OutcomeLevelDocument | undefined {
  return OUTCOME_LEVEL_DOCUMENTS.find((doc) => doc.id === id)
}
