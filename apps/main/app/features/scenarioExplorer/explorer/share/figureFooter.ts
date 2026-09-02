/**
 * figureFooter - the provenance footer every share card carries, on screen
 * and in every export (the exports raster the card). Three parts: who
 * produced the data, what kind of data the figure shows, and when it was
 * captured. Pure module; the card shell renders the result.
 */

import type { ShareItem } from "./types"

export interface ShareFigureFooter {
  /** Producer and model, e.g. "COEQWAL, coeqwal.org. CalSim3 model results." */
  source: string
  /** Data provenance for figures that can show sample data (Data in Depth). */
  provenance?: string
  /** "Captured Aug 24, 2026." when the item carries a capture time. */
  capturedAt?: string
}

const SOURCE_MODEL = "COEQWAL, coeqwal.org. CalSim3 model results."
const SOURCE_TIERS =
  "COEQWAL, coeqwal.org. CalSim3 model results and key-outcome tiers."

function capturedLine(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  const label = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  return `Captured ${label}.`
}

/** Build the footer for a share item. Pure. */
export function shareFigureFooter(item: ShareItem): ShareFigureFooter {
  const capturedAt = capturedLine(item.capturedAt)
  if (item.type === "data") {
    const provenance =
      item.source === "live"
        ? "Live data from api.coeqwal.org."
        : item.source === "mixed"
          ? "Live data from api.coeqwal.org for some series; see the legend."
          : "Sample data, not model results."
    return { source: SOURCE_MODEL, provenance, capturedAt }
  }
  return { source: SOURCE_TIERS, capturedAt }
}

/** The footer as one line of text. Pure. */
export function shareFigureFooterText(footer: ShareFigureFooter): string {
  return [footer.source, footer.provenance, footer.capturedAt]
    .filter((s): s is string => Boolean(s))
    .join(" ")
}
