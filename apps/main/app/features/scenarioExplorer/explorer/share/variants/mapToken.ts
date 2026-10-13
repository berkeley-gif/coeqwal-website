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

export function decodeMapToken(parts: string[]): MapItemFields | null {
  const outcomeCodes = (parts[0] ?? "").split("~").filter(Boolean)
  if (outcomeCodes.length === 0) return null
  return {
    outcomeCodes,
    scenarioId: parts[1] ?? "",
    hydroclimate: parts[2] || "historical",
    tool: parts[3] || "bar",
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
