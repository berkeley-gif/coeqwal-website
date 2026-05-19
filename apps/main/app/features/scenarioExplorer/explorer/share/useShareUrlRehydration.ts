"use client"

import { useEffect } from "react"

import { useExplorerStore } from "../store"
import { parseShareUrl } from "./url"

/**
 * Mount-once rehydration of the scenario-explorer store from share-link
 * query params!
 *
 * Reads `window.location.search` directly. Designed to
 * run once at app mount, before any tab content depends on store state.
 *
 * Honors the URL params written by `encodeShareItems` in `./url`:
 *   - `?climate=<key>` sets the explorer hydroclimate filter.
 *   - `?items=...` plus optional `?story=...` and `?v=...` rehydrate share
 *     items, story order, and detect a schema-version mismatch via
 *     `parseShareUrl`.
 */
export function useShareUrlRehydration(): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const climateParam = params.get("climate")
    if (climateParam) {
      useExplorerStore.getState().setHydroclimate(climateParam)
    }

    const itemsParam = params.get("items")
    if (!itemsParam) return

    const { items, storyItemIds, versionMismatch } = parseShareUrl(params)
    const store = useExplorerStore.getState()

    if (items.length > 0) {
      store.setShareItems(items)
      if (storyItemIds.length > 0) {
        store.reorderStory(storyItemIds)
      }
    }
    if (versionMismatch) {
      store.setShareUrlVersionMismatch(true)
    }
  }, [])
}
