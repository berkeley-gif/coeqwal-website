/**
 * mapToken - URL token and filename for saved maps. Pure (no React), so
 * Node-side specs can import it; variants/map.ts wires it into the
 * registry. Token: outcomes (~-joined) . scenarioId . hydroclimate ("" for
 * historical) . tool . comparedWithBaseline ("1" or "").
 */

import type { CsvLookups } from "../variants"
import type { ShareItemOfType } from "../types"
import { hydroclimateSlug, slugifyForFilename } from "../utils/filename"

type MapItem = ShareItemOfType<"map">

export type MapItemFields = Pick<
  MapItem,
  | "outcomeCodes"
  | "scenarioId"
  | "hydroclimate"
  | "tool"
  | "comparedWithBaseline"
>

export function encodeMapToken(item: MapItemFields): string {
  return [
    item.outcomeCodes.join("~"),
    item.scenarioId,
    item.hydroclimate === "historical" ? "" : item.hydroclimate,
    item.tool,
    item.comparedWithBaseline ? "1" : "",
  ].join(".")
}

/** Explore tools that save maps; a link naming any other tool is dropped */
const MAP_TOOLS: readonly string[] = ["bar", "radar", "equity", "resilience"]

export function decodeMapToken(parts: string[]): MapItemFields | null {
  const outcomeCodes = (parts[0] ?? "").split("~").filter(Boolean)
  if (outcomeCodes.length === 0) return null
  const tool = parts[3] || "bar"
  if (!MAP_TOOLS.includes(tool)) return null
  return {
    outcomeCodes,
    scenarioId: parts[1] ?? "",
    hydroclimate: parts[2] || "historical",
    tool,
    comparedWithBaseline: parts[4] === "1",
  }
}

export function mapFilenameLabel(
  item: MapItemFields,
  lookups: CsvLookups,
): string {
  return [
    "coeqwal-map",
    slugifyForFilename(
      item.outcomeCodes.map(lookups.outcomeNameLookup).join(" "),
    ),
    item.scenarioId
      ? slugifyForFilename(lookups.scenarioShortLabelLookup(item.scenarioId))
      : "",
    hydroclimateSlug(item.hydroclimate),
  ]
    .filter(Boolean)
    .join("-")
}
