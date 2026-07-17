"use client"

import { useCallback, useMemo, useRef } from "react"
import type { ShareItem } from "../types"
import type { CsvLookups } from "../variants"
import { withExt } from "../utils/filename"
import { exportShareItemAsCSV, exportAllShareItemsAsZip } from "../export"
import {
  shareItemFilenameLabel,
  exportAllShareItemImagesAsZip,
} from "../export/shareItemDownload"

interface UseShareDownloadsArgs {
  csvLookups: CsvLookups
  /** Story canvas cards take precedence, falling back to all share items. */
  storyItems: ShareItem[]
  shareItems: ShareItem[]
  /** Canvas background painted behind transparent chart areas. */
  backgroundColor: string
}

/**
 * Download behavior for the share panel: a live-element ref registry
 * plus the per-card data export and the bulk "download all" handlers.
 *
 * Story-canvas card refs are the primary live-element source for the
 * bulk image path. Tray refs are registered too so tray-only items
 * (not added to a story) still produce a styled-card export rather
 * than the bare `cachedSvg` fallback.
 */
export function useShareDownloads({
  csvLookups,
  storyItems,
  shareItems,
  backgroundColor,
}: UseShareDownloadsArgs) {
  const cardContentRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const trayContentRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const registerCardRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) cardContentRefs.current.set(id, el)
      else cardContentRefs.current.delete(id)
    },
    [],
  )

  const registerTrayCardRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) trayContentRefs.current.set(id, el)
      else trayContentRefs.current.delete(id)
    },
    [],
  )

  const resolveLiveCardEl = useCallback(
    (id: string): HTMLDivElement | null =>
      cardContentRefs.current.get(id) ??
      trayContentRefs.current.get(id) ??
      null,
    [],
  )

  // The bulk handlers act on the story canvas when it has cards, and
  // on the full tray otherwise. Computed once so both stay in sync.
  const exportItems = useMemo(
    () => (storyItems.length > 0 ? storyItems : shareItems),
    [storyItems, shareItems],
  )

  const handleDownloadData = useCallback(
    (item: ShareItem) => {
      if (
        !item.cachedChartData ||
        Object.keys(item.cachedChartData).length === 0
      )
        return
      // Reuse the same filename label PNG/SVG already use, with a
      // `-data` suffix so the CSV sits next to its sibling `.png`
      // and `.svg` files in the user's downloads folder.
      const filename = withExt(
        `${shareItemFilenameLabel(item, csvLookups)}-data`,
        "csv",
      )
      exportShareItemAsCSV(item, filename, csvLookups)
    },
    [csvLookups],
  )

  const handleDownloadAllImages = useCallback(async () => {
    await exportAllShareItemImagesAsZip(
      exportItems,
      withExt("coeqwal-share-images", "zip"),
      backgroundColor,
      csvLookups,
      resolveLiveCardEl,
    )
  }, [exportItems, backgroundColor, csvLookups, resolveLiveCardEl])

  const handleDownloadAllData = useCallback(async () => {
    await exportAllShareItemsAsZip(
      exportItems,
      withExt("coeqwal-share-export", "zip"),
      csvLookups,
    )
  }, [exportItems, csvLookups])

  return {
    registerCardRef,
    registerTrayCardRef,
    handleDownloadData,
    handleDownloadAllImages,
    handleDownloadAllData,
  }
}
