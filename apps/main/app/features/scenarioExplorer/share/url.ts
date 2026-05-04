/**
 * Share URL schema.
 *
 * Encodes and decodes the `items=`, `story=`, `climate=`, and
 * `v=` query parameters used by the share-link feature. The
 * schema is intentionally compact (single-letter prefixes per
 * variant, tilde-separated lists, dot-separated fields) so a
 * typical share URL fits well under the 2k-character browser
 * limit.
 *
 * Versioning
 * ----------
 * `SHARE_URL_VERSION` identifies the schema of the URL body. New
 * URLs always carry it as `v=...`. Old URLs without `v=` are
 * treated as version 1 for backward compatibility. When a URL
 * declares a version that does not match `SHARE_URL_VERSION`, the
 * parser still tries to decode using the current schema and
 * surfaces `versionMismatch: true` so the UI can show a banner.
 *
 * Story round-trip
 * ----------------
 * Story membership is encoded as indices into the `items` list,
 * not as the runtime `id` field. IDs are regenerated on each
 * parse (we use `crypto.randomUUID()` to mint fresh ones), so the
 * URL must reference items by stable position. The decoder maps
 * each index back to the freshly minted id of the item at that
 * position.
 */

import type { ShareItem } from "./types"

/**
 * Current schema version for share URLs. Bump on any
 * backwards-incompatible change to the encoded item or story
 * grammar. The parser tolerates a missing `v=` and treats it as
 * version 1.
 */
export const SHARE_URL_VERSION = 1

// ---------------------------------------------------------------------------
// Items + story encoding
// ---------------------------------------------------------------------------

/**
 * Build a full share URL string for a set of share items, the
 * current hydroclimate, and the optional story arrangement.
 *
 * The URL is anchored at `window.location.origin` and always
 * pins `tab=share`. Climate is omitted when it equals
 * `"historical"`. The URL version (`v=`) is always emitted so
 * future readers can detect mismatches.
 */
export function encodeShareItems(
  items: ShareItem[],
  climate: string,
  storyIds?: string[],
): string {
  const parts: string[] = [`tab=share`, `v=${SHARE_URL_VERSION}`]
  if (climate !== "historical") parts.push(`climate=${climate}`)
  const encoded = items.map(encodeOne).filter(Boolean)
  if (encoded.length > 0) parts.push(`items=${encoded.join(",")}`)
  if (storyIds && storyIds.length > 0) {
    const idToIndex = new Map(items.map((item, i) => [item.id, i]))
    const indices = storyIds
      .map((id) => idToIndex.get(id))
      .filter((i): i is number => i != null)
    if (indices.length > 0) parts.push(`story=${indices.join(",")}`)
  }
  return `${window.location.origin}/?${parts.join("&")}`
}

function encodeOne(item: ShareItem): string {
  if (item.type === "barChart") {
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    const modeToken =
      item.viewMode === "average"
        ? "a"
        : item.viewMode === "distribution"
          ? "d"
          : "b"
    return `b.${item.scenarioId}.${modeToken}.${hc}`
  }
  if (item.type === "radar") {
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    const ids = item.scenarioIds.join("~")
    const axes = item.axes.join("~")
    let flags = ""
    if (item.showRange) flags += "r"
    if (item.highlightBaseline) flags += "b"
    if (item.showDotsOnly) flags += "d"
    if (item.showTierZones === false) flags += "n"
    return `r.${ids}.${axes}.${flags}.${hc}`
  }
  if (item.type === "equity") {
    // Note and cached image are intentionally not URL-encoded.
    // Notes are a private annotation. Images are too large to
    // fit a URL.
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    const outcomes = item.outcomeCodes.join("~")
    const cmp = item.compareToBaseline ? "c" : ""
    return `e.${item.scenarioId}.${outcomes}.${cmp}.${hc}`
  }
  if (item.type === "resilience") {
    const view = item.view
    const encoding = item.cellEncoding
    const ids = item.scenarioIds.join("~")
    const climates = item.hydroclimates.join("~")
    const outcomes = item.outcomeCodes.join("~")
    // Optional 7th segment "n" when numeric cell values were on
    // at save. tileScope / tileId / tileLabel and the visual /
    // chart caches are not encoded. Round-tripped items
    // rehydrate with partial context.
    const num = item.view !== "quadrant" && item.showCellNumbers ? ".n" : ""
    return `q.${view}.${encoding}.${ids}.${climates}.${outcomes}${num}`
  }
  return ""
}

// ---------------------------------------------------------------------------
// Items + story decoding
// ---------------------------------------------------------------------------

/**
 * Result of `parseShareUrl`. `items` and `storyItemIds` are the
 * runtime state to seed the store with; `versionMismatch` is true
 * when the URL declared a version that did not equal
 * `SHARE_URL_VERSION` so the UI can warn the user. An absent or
 * unparseable version is treated as 1 and is not considered a
 * mismatch unless `SHARE_URL_VERSION` itself differs from 1.
 */
export interface ParsedShareUrl {
  items: ShareItem[]
  storyItemIds: string[]
  climate: string | null
  versionMismatch: boolean
}

/**
 * Parse the share-relevant query parameters off a `URLSearchParams`-
 * compatible input. Tolerates missing parameters and returns empty
 * state in that case so the caller can pass any URL through this
 * without pre-checking.
 */
export function parseShareUrl(params: URLSearchParams): ParsedShareUrl {
  const itemsParam = params.get("items") ?? ""
  const storyParam = params.get("story") ?? ""
  const climate = params.get("climate")
  const versionParam = params.get("v")
  const declaredVersion = parseVersion(versionParam)
  const versionMismatch = declaredVersion !== SHARE_URL_VERSION

  const { items, storyItemIds } = parseShareItemsParam(itemsParam, storyParam)
  return { items, storyItemIds, climate, versionMismatch }
}

function parseVersion(v: string | null): number {
  if (!v) return 1
  const n = Number.parseInt(v, 10)
  if (!Number.isFinite(n)) return 1
  return n
}

/**
 * Lower-level item parser. Useful when the caller already has the
 * raw `items=` and `story=` strings and does not want a full
 * `parseShareUrl` round trip. Existing call sites in
 * `TabPanels.tsx` use this directly.
 */
export function parseShareItemsParam(
  param: string,
  storyParam?: string,
): { items: ShareItem[]; storyItemIds: string[] } {
  if (!param) return { items: [], storyItemIds: [] }
  const items = param
    .split(",")
    .map(decodeOne)
    .filter((x): x is ShareItem => x !== null)

  let storyItemIds: string[] = []
  if (storyParam) {
    storyItemIds = storyParam
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((i) => !Number.isNaN(i) && i >= 0 && i < items.length)
      .map((i) => items[i]!.id)
  }
  return { items, storyItemIds }
}

function decodeOne(token: string): ShareItem | null {
  const parts = token.split(".")
  if (parts[0] === "b" && parts.length >= 3) {
    const modeToken = parts[2]
    return {
      id: crypto.randomUUID(),
      type: "barChart",
      scenarioId: parts[1]!,
      viewMode:
        modeToken === "a"
          ? "average"
          : modeToken === "d"
            ? "distribution"
            : "bar",
      hydroclimate: parts[3] || "historical",
    }
  }
  if (parts[0] === "r" && parts.length >= 3) {
    const scenarioIds = parts[1]!.split("~").filter(Boolean)
    const axes = parts[2]!.split("~").filter(Boolean)
    const flags = parts[3] ?? ""
    return {
      id: crypto.randomUUID(),
      type: "radar",
      scenarioIds,
      axes,
      showRange: flags.includes("r"),
      showTierZones: !flags.includes("n"),
      highlightBaseline: flags.includes("b"),
      showDotsOnly: flags.includes("d"),
      hydroclimate: parts[4] || "historical",
    }
  }
  if (parts[0] === "e" && parts.length >= 3) {
    const outcomeCodes = (parts[2] ?? "").split("~").filter(Boolean)
    return {
      id: crypto.randomUUID(),
      type: "equity",
      scenarioId: parts[1] ?? "",
      outcomeCodes,
      compareToBaseline: (parts[3] ?? "").includes("c"),
      hydroclimate: parts[4] || "historical",
    }
  }
  if (parts[0] === "q" && parts.length >= 3) {
    const showCellNumbers = parts[6] === "n"
    return {
      id: crypto.randomUUID(),
      type: "resilience",
      view: parts[1] ?? "aggregate",
      cellEncoding: parts[2] ?? "tier",
      scenarioIds: (parts[3] ?? "").split("~").filter(Boolean),
      hydroclimates: (parts[4] ?? "").split("~").filter(Boolean),
      outcomeCodes: (parts[5] ?? "").split("~").filter(Boolean),
      ...(showCellNumbers ? { showCellNumbers: true } : {}),
    }
  }
  return null
}
