/**
 * Per-variant registry for the share system.
 *
 * Each `ShareItem["type"]` resolves to one `VariantHandler` that owns
 * everything specific to that variant: card render, URL encode/decode,
 * download filename fragment, the capture-dimensions key used to size
 * raster downloads, and the optional CSV exporter. Adding a new
 * visualization is one row in {@link VARIANT_REGISTRY} plus the four
 * implementation files referenced by that row (capture adapter, card,
 * snapshot wrapper, dimensions entry).
 *
 * The compiler enforces exhaustiveness via the
 * `satisfies Record<ShareItem["type"], …>` annotation on
 * {@link VARIANT_REGISTRY}: a new variant added to the `ShareItem`
 * union without a registry entry is a build error in this file.
 *
 * Dispatchers (ShareItemView, url.ts, Share.tsx download paths,
 * exportUtils.ts CSV exporters) read from this registry instead of
 * branching on `item.type` directly so a missing variant cannot fail
 * silently at runtime.
 */

import type React from "react"
import type { Theme } from "@repo/ui/mui"
import type { ShareItem, ShareItemOfType, ShareItemPatch } from "./types"
import type { CaptureDimensionKey } from "./capture/dimensions"
import type {
  ShareRadarHydroKey,
  ShareRadarLiveDataFields,
} from "./utils/shareRadarLiveData"

import barChartHandler from "./variants/barChart"
import radarHandler from "./variants/radar"
import equityHandler from "./variants/equity"
import resilienceHandler from "./variants/resilience"

/**
 * Scenario context the share cards look up by id. The dispatcher
 * builds this map once per render of the share panel and passes it
 * through every handler so cards can show consistent display names,
 * descriptions, and short legend labels.
 */
export interface ShareItemScenarioInfo {
  name: string
  description: string
  definition: string
  shortLabel: string
}

/**
 * Read-only context handed to {@link VariantHandler.renderCard}. The
 * dispatcher rebuilds this once per share item so `onNoteChange` and
 * `onRemove` can carry the item's id without each handler having to
 * re-curry. The other fields are stable across items in one render.
 */
export interface RenderContext {
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<string, ShareItemScenarioInfo>
  allChartData: Record<string, Record<string, unknown> | undefined>
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  theme: Theme
  /** Pre-curried per the current item; pass straight to the card. */
  onNoteChange?: (note: string) => void
  /** Un-curried; the handler decides whether to wrap with the item id. */
  onRemove?: (id: string) => void
}

/**
 * Display-name lookups threaded into CSV exports so column headers
 * carry human-readable labels instead of the internal codes the
 * runtime stores. Also reused by `filenameLabel` so download
 * filenames can use the same scenario short labels users see in
 * the share UI.
 */
export interface CsvLookups {
  scenarioNameLookup: (id: string) => string
  /**
   * Short label used in filenames and compact UI affordances.
   * Falls back to `scenarioNameLookup` (and ultimately the id) when
   * the display layer has not registered a short label.
   */
  scenarioShortLabelLookup: (id: string) => string
  outcomeNameLookup: (code: string) => string
}

/**
 * Shared bag of resources every {@link VariantHandler.DataRehydrator}
 * receives. The host computes these once on the share panel and
 * forwards them to each variant's rehydrator. Mirrors the live render
 * context (`RenderContext`) so a rehydrator can use the same data the
 * card's live fallback already consumes.
 */
export interface DataRehydrationContext {
  /**
   * Per-scenario resolved bar-chart data keyed by scenarioId. Same
   * structure the bar-chart card consumes; sourced from
   * `useResolvedScenarioTiers().allChartData`.
   */
  allChartData: Record<string, Record<string, unknown> | undefined>
  /**
   * Per-hydroclimate radar live fields. Each entry already carries
   * the scenario-keyed plot data the radar exporter needs. Sourced
   * from `useComparisonData(hc, true)`.
   */
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  /**
   * Update one share item in the explorer store. Rehydrators write
   * back through this so resolved data lives next to the rest of
   * the share-item state and survives the next render / reload.
   */
  updateShareItem: (id: string, patch: ShareItemPatch) => void
}


/**
 * Single source of truth for everything specific to a share variant.
 * Generic over the variant's narrowed `ShareItem` arm so renderCard,
 * encodeUrlToken, etc. all see the right field set without casts at
 * the call site.
 */
export interface VariantHandler<T extends ShareItem> {
  /** Discriminator value; matches `ShareItem["type"]` for this arm. */
  type: T["type"]
  /**
   * One-letter prefix used as the first segment of an item token in
   * the share URL. Must be unique across the registry; the URL
   * dispatcher reverse-looks-up by this prefix.
   */
  urlPrefix: string
  /**
   * Capture-dimensions key used to rasterize `cachedSvg` to PNG when
   * the live card is not mounted (URL-restored items). Must point to
   * an entry in {@link CAPTURE_DIMENSIONS}.
   */
  rasterDimensionsKey: CaptureDimensionKey
  renderCard: (item: T, ctx: RenderContext) => React.ReactNode
  /** Returns the body of the URL token, without the prefix or its leading dot. */
  encodeUrlToken: (item: T) => string
  /**
   * Reverses {@link encodeUrlToken}. `parts` is the token split on
   * `.`, with the prefix already stripped, so `parts[0]` is the first
   * body segment.
   */
  decodeUrlToken: (parts: string[]) => T | null
  /**
   * Builds the basename (no extension) used by every share download
   * for this variant: PNG, SVG, and the per-item CSV. Receives the
   * shared `CsvLookups` so filenames can use the same scenario short
   * labels as the share UI. The caller adds the extension via
   * `withExt`; the per-item CSV path also appends a `-data` suffix.
   */
  filenameLabel: (item: T, lookups: CsvLookups) => string
  /**
   * Optional CSV builder. Returns a CSV body string for the item, or
   * null when there is nothing to export (no cached data, empty
   * rows). The caller decides what to do with the string: the
   * single-item path writes one file, the bulk path bundles per-item
   * CSVs into a ZIP. Returning a string instead of writing directly
   * keeps both paths going through one implementation per variant.
   */
  exportCsv?: (item: T, lookups: CsvLookups) => string | null
  /**
   * Optional rehydration component. Mounted once per variant inside
   * `ShareDataRehydrationHost` with every share item of this variant
   * that is currently missing `cachedChartData`. Expected to backfill
   * `cachedChartData` via `context.updateShareItem` once the resolver
   * has data. Items whose data cannot be resolved (e.g. resilience
   * quadrant captures with no live equivalent) are left as-is and
   * silently skipped from the bulk ZIP.
   *
   * Component-shaped (rather than hook-shaped) so each variant can
   * mount one inner component per item without violating the rules of
   * hooks: an inner component can call hooks scoped to that item's
   * id alone.
   */
  DataRehydrator?: React.FC<{
    items: T[]
    context: DataRehydrationContext
  }>
}

type ShareVariantRegistry = {
  [K in ShareItem["type"]]: VariantHandler<ShareItemOfType<K>>
}

/**
 * Registry table. The `satisfies` clause turns a missing arm into a
 * compile error here, where it's easy to fix, instead of a silent
 * `return null` in a downstream dispatcher.
 */
export const VARIANT_REGISTRY = {
  barChart: barChartHandler,
  radar: radarHandler,
  equity: equityHandler,
  resilience: resilienceHandler,
} as const satisfies ShareVariantRegistry

/**
 * Look up a handler by its URL prefix. Returns null when the prefix
 * is unknown (e.g. an item from a future schema version that this
 * client cannot decode). The decoder uses this to drop unknown items
 * rather than crashing the whole URL parse.
 */
export function getHandlerByUrlPrefix(
  prefix: string,
): VariantHandler<ShareItem> | null {
  for (const handler of Object.values(VARIANT_REGISTRY)) {
    if (handler.urlPrefix === prefix) {
      return handler as unknown as VariantHandler<ShareItem>
    }
  }
  return null
}

/**
 * Internal helper used by the dispatchers. Narrows the registry
 * entry to the concrete handler for `item.type` so its methods see
 * the correct narrowed item.
 */
export function handlerForItem<T extends ShareItem>(
  item: T,
): VariantHandler<T> {
  return VARIANT_REGISTRY[
    item.type as T["type"]
  ] as unknown as VariantHandler<T>
}
