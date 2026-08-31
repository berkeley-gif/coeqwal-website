/**
 * Outcome Level Methodology documentation
 *
 * Maps each outcome-level-methodology HTML page (in
 * public/documents/Outcome_Level_Methodology/) to a stable id and
 * human-readable label, so the UI never has to expose a raw filename or url
 * slug. Each HTML page links to its underlying PDF, which now lives in the
 * Outcome_Level_Methodology/pdf/ subfolder.
 *
 * These documents are standalone reference material — they are not resolved
 * against the scenario API/hooks, so no scenario_id/short_code mapping is
 * involved here.
 *
 * To add a new outcome level doc: drop the HTML file in that folder and add
 * one entry below.
 */

export interface OutcomeLevelDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Outcome_Level_Methodology/. */
  file: string
}

/** Base path (under public/) where outcome level methodology pages are served from. */
const OUTCOME_LEVEL_DOCS_PATH = "/documents/Outcome_Level_Methodology"

export const OUTCOME_LEVEL_DOCUMENTS: OutcomeLevelDocument[] = [
  {
    id: "community-water-deliveries",
    label: "Community surface water",
    file: "community-water-systems.html",
  },
  {
    id: "agricultural-revenues",
    label: "Agricultural revenue",
    file: "agricultural-revenue.html",
  },
  {
    id: "environmental-flows",
    label: "Environmental flows",
    file: "environmental-flows.html",
  },
  {
    id: "winter-run-chinook-salmon",
    label: "Winter-run salmon",
    file: "winter-run-salmon.html",
  },
  {
    id: "bay-delta-estuary-ecology",
    label: "Delta estuary ecology",
    file: "delta-estuary-ecology.html",
  },
  {
    id: "freshwater-for-in-delta-uses",
    label: "Freshwater for in-Delta uses",
    file: "freshwater-for-in-delta-uses.html",
  },
  {
    id: "freshwater-for-delta-exports",
    label: "Freshwater for Delta exports",
    file: "freshwater-for-delta-exports.html",
  },
  {
    id: "groundwater-storage",
    label: "Groundwater storage",
    file: "groundwater-storage.html",
  },
  {
    id: "reservoir-storage",
    label: "Reservoir storage",
    file: "reservoir-storage.html",
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
