"use client"

/**
 * ShareDataRehydrationHost
 *
 * Mounts each variant's `DataRehydrator` once, with the share items
 * of that variant + a shared `DataRehydrationContext`. Renders no
 * visible UI; its only job is to keep the rules-of-hooks-bound
 * data-fetching machinery alive while the share panel is open so
 * URL-restored items end up with `cachedChartData` populated before
 * the user clicks "Download all data".
 *
 * Why this lives here (and not in each card):
 * - Cards re-mount as the share tab is opened / closed and as items
 *   are added or removed; running fetches in card mounts would race
 *   the bulk-export trigger.
 * - The bulk export needs `cachedChartData` for *every* item, not
 *   just the ones currently rendered into the story canvas. The host
 *   sits one level above the canvas so off-canvas tray items get
 *   rehydrated too.
 *
 * `useShareDataReady` is the companion hook the share panel uses to
 * gate its "Download all data" button until every item with a
 * registered rehydrator has either resolved its data or been
 * classified as unavailable (resilience quadrant). For variants
 * without a registered `DataRehydrator`, an item with no cached data
 * is treated as ready (it will be silently skipped by the bulk
 * exporter) so the button never blocks indefinitely.
 *
 * Adding a new variant: implement `DataRehydrator?` on the variant's
 * handler. The host iterates the registry by type, so a new variant
 * is picked up automatically.
 */

import React, { useMemo } from "react"
import type { ShareItem } from "./types"
import {
  VARIANT_REGISTRY,
  handlerForItem,
  type DataRehydrationContext,
  type VariantHandler,
} from "./variants"

export interface ShareDataRehydrationHostProps {
  items: ShareItem[]
  context: DataRehydrationContext
}

/**
 * Group share items by `type` so each variant's rehydrator gets
 * exactly the items it owns. The bucket map iterates the registry
 * (not the items) so a variant with zero items still receives an
 * empty list, keeping its hook order stable across renders.
 */
function bucketByType(items: ShareItem[]): Record<string, ShareItem[]> {
  const buckets: Record<string, ShareItem[]> = {}
  for (const key of Object.keys(VARIANT_REGISTRY)) {
    buckets[key] = []
  }
  for (const item of items) {
    const arr = buckets[item.type] ?? []
    arr.push(item)
    buckets[item.type] = arr
  }
  return buckets
}

export default function ShareDataRehydrationHost({
  items,
  context,
}: ShareDataRehydrationHostProps) {
  const buckets = useMemo(() => bucketByType(items), [items])
  const entries = Object.entries(VARIANT_REGISTRY) as Array<
    [string, VariantHandler<ShareItem>]
  >
  return (
    <>
      {entries.map(([type, handler]) => {
        const Rehydrator = handler.DataRehydrator
        if (!Rehydrator) return null
        const variantItems = buckets[type] ?? []
        return (
          <Rehydrator
            key={type}
            items={variantItems as never}
            context={context}
          />
        )
      })}
    </>
  )
}

/**
 * Predicate used by the bulk-export gate. An item is "ready" when:
 *   - its handler has no `DataRehydrator` registered (the bulk
 *     exporter will silently skip it if it has no cached data, but
 *     the user shouldn't be blocked waiting on a resolver that
 *     doesn't exist), OR
 *   - it already has `cachedChartData`, OR
 *   - it's a resilience quadrant capture (no resolver today; the
 *     bulk exporter just skips it).
 *
 * The button is enabled when every item is ready by this definition.
 */
function isItemRehydrated(item: ShareItem): boolean {
  if (item.cachedChartData) return true
  const handler = handlerForItem(item)
  if (!handler.DataRehydrator) return true
  if (item.type === "resilience" && item.view === "quadrant") return true
  return false
}

export function useShareDataReady(items: ShareItem[]): boolean {
  return useMemo(() => items.every(isItemRehydrated), [items])
}
