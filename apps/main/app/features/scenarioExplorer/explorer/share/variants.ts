/**
 * Per-variant registry for the share system
 *
 * Each share item type maps to one VariantHandler that owns the
 * variant-specific work: render its card, encode and decode its URL
 * token, name its downloads, size its raster, and export its CSV. To
 * add a variant, add one row to VARIANT_REGISTRY and the files that
 * row points to (capture adapter, card, snapshot wrapper, dimensions
 * entry).
 */

import type React from "react"
import type { Theme } from "@repo/ui/mui"
import type { ShareItem, ShareItemOfType, ShareItemPatch } from "./types"
import type { CaptureDimensionKey, CaptureSize } from "./capture/dimensions"
import type {
  ShareRadarHydroKey,
  ShareRadarLiveDataFields,
} from "./utils/shareRadarLiveData"

import barChartHandler from "./variants/barChart"
import radarHandler from "./variants/radar"
import equityHandler from "./variants/equity"
import resilienceHandler from "./variants/resilience"

export interface ShareItemScenarioInfo {
  name: string
  description: string
  definition: string
  shortLabel: string
}

export interface RenderContext {
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<string, ShareItemScenarioInfo>
  allChartData: Record<string, Record<string, unknown> | undefined>
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  theme: Theme
  onNoteChange?: (note: string) => void
  onRemove?: (id: string) => void
}

/**
 * Display-name lookups passed into CSV exports and filenames so users
 * see real scenario and outcome names, not internal codes.
 */
export interface CsvLookups {
  scenarioNameLookup: (id: string) => string
  /** Short label for filenames. Falls back to the full name, then the id. */
  scenarioShortLabelLookup: (id: string) => string
  outcomeNameLookup: (code: string) => string
}

/** Resources passed to every VariantHandler.DataRehydrator. */
export interface DataRehydrationContext {
  /** Bar-chart data keyed by scenarioId, from useResolvedScenarioTiers. */
  allChartData: Record<string, Record<string, unknown> | undefined>
  /** Radar live fields per hydroclimate, from useTierChartData(hc, true). */
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  /** Write resolved data back to one share item in the store. */
  updateShareItem: (id: string, patch: ShareItemPatch) => void
}

/**
 * Everything specific to one share variant. Generic over the
 * variant's narrowed ShareItem so each method sees the right fields.
 */
export interface VariantHandler<T extends ShareItem> {
  /** Matches ShareItem["type"] for this variant. */
  type: T["type"]
  /**
   * One-letter prefix that starts this variant's URL token. Must be
   * unique across the registry. The decoder looks handlers up by it.
   */
  urlPrefix: string
  /**
   * Default CAPTURE_DIMENSIONS key for rasterizing cachedSvg to PNG
   * when the live card is not mounted (URL-restored items).
   */
  rasterDimensionsKey: CaptureDimensionKey
  /**
   * Optional per-item raster size. Use when the size depends on the
   * item (resilience tile vs full panel). Otherwise the default
   * rasterDimensionsKey is used.
   */
  rasterSizeFor?: (item: T) => CaptureSize
  renderCard: (item: T, ctx: RenderContext) => React.ReactNode
  /** Encodes the URL token body, without the prefix. */
  encodeUrlToken: (item: T) => string
  /**
   * Reverses encodeUrlToken. parts is the token split on ".", with
   * the prefix removed, so parts[0] is the first body segment.
   */
  decodeUrlToken: (parts: string[]) => T | null
  /**
   * Basename (no extension) for this variant's downloads: PNG, SVG,
   * and per-item CSV. The caller adds the extension.
   */
  filenameLabel: (item: T, lookups: CsvLookups) => string
  /**
   * Optional CSV builder. Returns the CSV body, or null when there is
   * nothing to export. The caller writes the file or bundles it into
   * the bulk ZIP.
   */
  exportCsv?: (item: T, lookups: CsvLookups) => string | null
  /**
   * Optional rehydration component, mounted once per variant with the
   * items missing cachedChartData. It backfills that data via
   * context.updateShareItem. Items it cannot resolve are skipped from
   * the bulk ZIP.
   *
   * It is a component, not a hook, so each variant can mount one inner
   * component per item and call hooks scoped to that item without
   * breaking the rules of hooks.
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
 * The registry. The satisfies clause makes a missing variant a
 * compile error here instead of a silent failure downstream.
 */
export const VARIANT_REGISTRY = {
  barChart: barChartHandler,
  radar: radarHandler,
  equity: equityHandler,
  resilience: resilienceHandler,
} as const satisfies ShareVariantRegistry

/**
 * Finds a handler by URL prefix. Returns null for an unknown prefix
 * (e.g. a token from a newer schema), so the decoder can drop the
 * unknown item instead of failing the whole parse.
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
 * Narrows the registry entry to the concrete handler for item.type
 * so its methods see the correctly narrowed item.
 */
export function handlerForItem<T extends ShareItem>(
  item: T,
): VariantHandler<T> {
  return VARIANT_REGISTRY[
    item.type as T["type"]
  ] as unknown as VariantHandler<T>
}
