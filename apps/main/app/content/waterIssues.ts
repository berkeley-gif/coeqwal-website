/**
 * Water Issues documentation
 *
 * Maps each water-issues HTML page (in public/documents/Background/) to a
 * stable id and human-readable label, so the UI never has to expose a raw
 * filename or url slug.
 *
 * These documents are standalone reference material — they are not resolved
 * against the scenario API/hooks, so no scenario_id/short_code mapping is
 * involved here.
 *
 * To add a new water issues brief: drop the HTML file in that folder and add
 * one entry below.
 */

export interface WaterIssueDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Background/. */
  file: string
}

/** Base path (under public/) where water issues pages are served from. */
const WATER_ISSUES_PATH = "/documents/Background"

export const WATER_ISSUE_DOCUMENTS: WaterIssueDocument[] = [
  {
    id: "strategy-hydroclimate-decomposition-brief",
    label: "Separating strategy and hydroclimate in COEQWAL results",
    file: "strategy_hydroclimate_decomposition_brief.html",
  },
  {
    id: "understanding-todays-water-system",
    label: "Understanding today's water system",
    file: "understanding-todays-water-system.html",
  },
  {
    id: "securing-community-water-supplies",
    label: "Securing community water supplies",
    file: "securing-community-water-supplies.html",
  },
  {
    id: "sustaining-farms-and-groundwater",
    label: "Sustaining farms and groundwater",
    file: "sustaining-farms-and-groundwater.html",
  },
  {
    id: "protecting-rivers-and-salmon",
    label: "Protecting rivers and salmon",
    file: "protecting-rivers-and-salmon.html",
  },
  {
    id: "balancing-needs-in-the-delta",
    label: "Balancing needs in the Delta",
    file: "balancing-needs-in-the-delta.html",
  },
]

/** Resolve a water issues document's public URL from its filename. */
export function getWaterIssueDocumentUrl(file: string): string {
  return `${WATER_ISSUES_PATH}/${file}`
}

/** Look up a water issues document by its stable id. */
export function getWaterIssueDocumentById(
  id: string,
): WaterIssueDocument | undefined {
  return WATER_ISSUE_DOCUMENTS.find((doc) => doc.id === id)
}
