"use client"

import React, { useMemo, useState, useCallback, useRef } from "react"
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
  useTheme,
  icons,
} from "@repo/ui/mui"
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { useExplorerStore } from "../../features/scenarioExplorer/explorer/store"
import type { ShareItem } from "../../features/scenarioExplorer/store"
import { useResolvedScenarioTiers } from "../../features/scenarioExplorer/explorer/tools/hooks/useResolvedScenarioTiers"
import { useTierChartData } from "../../features/scenarioExplorer/explorer/tools/hooks/useTierChartData"
import {
  buildShareRadarLiveDataFields,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "../../features/scenarioExplorer/explorer/share/utils/shareRadarLiveData"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import ShareItemView from "../../features/scenarioExplorer/explorer/share/ShareItemView"
import ShareUrlVersionNotice from "../../features/scenarioExplorer/explorer/share/ui/ShareUrlVersionNotice"
import { CAPTURE_DIMENSIONS } from "../../features/scenarioExplorer/explorer/share/capture/dimensions"
import {
  handlerForItem,
  type CsvLookups,
} from "../../features/scenarioExplorer/explorer/share/variants"
import {
  downloadFromDataUrl,
  downloadSvgString,
  rasterizeSvgString,
  embedFontStylesInSvg,
  exportShareItemAsCSV,
  exportAllShareItemsAsZip,
} from "../../features/scenarioExplorer/explorer/tools/panels/dataInDepth/utils/exportUtils"
import { withExt } from "../../features/scenarioExplorer/explorer/share/utils/filename"
import {
  downloadCardAsPng,
  downloadCardAsSvg,
} from "../../features/scenarioExplorer/explorer/share/cardExport"
import ShareDataRehydrationHost, {
  useShareDataReady,
} from "../../features/scenarioExplorer/explorer/share/ShareDataRehydrationHost"

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------
// All encode / decode logic lives in `share/url.ts` and is re-
// exported from `share/index.ts`. Only the call site below
// (`encodeShareItems` for the "Copy link" button) imports anything
// here.

import { encodeShareItems } from "../../features/scenarioExplorer/explorer/share/url"

/**
 * Per-hydroclimate radar fields for share. See `buildShareRadarLiveDataFields`
 * and `useTierChartData(period, true)` in the share panel and drawer.
 */
export type ShareRenderLiveData = ShareRadarLiveDataFields
export type { ShareRadarHydroKey } from "../../features/scenarioExplorer/explorer/share/utils/shareRadarLiveData"

// Render dispatch lives in `share/ShareItemView`. Both the tray card
// and the story card render through that single component so per-
// variant rendering logic lives in one place.

// ---------------------------------------------------------------------------
// Transform helper for dnd-kit (translate)
// ---------------------------------------------------------------------------

function transformToCSS(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!transform) return undefined
  const { x, y } = transform
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
}

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------

/**
 * Filename fragment + raster size both come from the share variant
 * registry so a new variant only has to fill in one row in
 * `share/variants.ts` to wire its downloads. The registry's
 * `rasterDimensionsKey` indexes into {@link CAPTURE_DIMENSIONS}; this
 * is a one-size-per-variant lookup, which is fine for radar / equity
 * / barChart but currently rounds resilience tile captures up to the
 * panel size at PNG-from-cachedSvg time. See the README
 * "RASTER_SIZE per tileScope" follow-up note.
 *
 * `lookups` is forwarded straight into the handler so filenames can
 * use the same scenario short labels users see in the share UI
 * (e.g. `current-ops`) instead of internal ids (`s0042`).
 */
function shareItemFilenameLabel(item: ShareItem, lookups: CsvLookups): string {
  return handlerForItem(item).filenameLabel(item as never, lookups)
}

function shareItemRasterSize(item: ShareItem) {
  return CAPTURE_DIMENSIONS[handlerForItem(item).rasterDimensionsKey]
}

/**
 * PNG download path. Order of preference:
 *   1. live card element via html-to-image. Captures the full card
 *      (tool label, title, definition, hydroclimate badge, chart,
 *      chips, user-written note) so the downloaded image matches
 *      what the user sees in the share tray. This is the dominant
 *      path for any item rendered in the panel.
 *   2. cachedSvg → rasterize on demand. Bare-chart fallback when
 *      the card is not currently mounted (e.g. URL-restored items
 *      that have not been added to the story canvas).
 *   3. cachedImageDataUrl. Direct write of an old PNG fallback.
 */
async function downloadShareItemAsPng(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
  lookups: CsvLookups,
): Promise<void> {
  const filename = withExt(shareItemFilenameLabel(item, lookups), "png")

  if (liveEl) {
    const ok = await downloadCardAsPng(liveEl, filename, { backgroundColor })
    if (ok) return
  }

  if (item.cachedSvg) {
    try {
      const size = shareItemRasterSize(item)
      const { dataUrl } = await rasterizeSvgString(
        item.cachedSvg,
        size.width,
        size.height,
        { backgroundColor },
      )
      await downloadFromDataUrl(dataUrl, filename)
      return
    } catch (err) {
      console.warn(
        "[Share] PNG download via cachedSvg failed, falling back to cached PNG:",
        err,
      )
    }
  }

  if (item.cachedImageDataUrl) {
    await downloadFromDataUrl(item.cachedImageDataUrl, filename)
  }
}

/**
 * SVG download path. Order of preference:
 *   1. live card element via html-to-image's foreignObject SVG.
 *      Carries the full card chrome at vector resolution, modulo
 *      the legacy-renderer caveat documented on `downloadCardAsSvg`.
 *   2. cachedSvg with embedded font @import. Bare-chart fallback
 *      when the card is not mounted; the file still opens cleanly
 *      in vector tools.
 */
async function downloadShareItemAsSvg(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
  lookups: CsvLookups,
): Promise<void> {
  const filename = withExt(shareItemFilenameLabel(item, lookups), "svg")

  if (liveEl) {
    const ok = await downloadCardAsSvg(liveEl, filename, { backgroundColor })
    if (ok) return
  }

  if (item.cachedSvg) {
    downloadSvgString(embedFontStylesInSvg(item.cachedSvg), filename)
  }
}

// ---------------------------------------------------------------------------
// TrayCard - full-size card for the bottom tray (same content as StoryCard)
// ---------------------------------------------------------------------------

const TRAY_CARD_WIDTH = 280

function TrayCard({
  item,
  isInStory,
  onToggle,
  onNoteChange,
  onRegisterTrayContentRef,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
}: {
  item: ShareItem
  isInStory: boolean
  onToggle: () => void
  onNoteChange: (id: string, note: string) => void
  onRegisterTrayContentRef: (id: string, el: HTMLDivElement | null) => void
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<
    string,
    {
      name: string
      description: string
      definition: string
      shortLabel: string
    }
  >
  allChartData: Record<string, Record<string, unknown> | undefined>
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
}) {
  const theme = useTheme()

  const renderContent = () => (
    <ShareItemView
      item={item}
      outcomeNames={outcomeNames}
      scenarioLookup={scenarioLookup}
      allChartData={allChartData}
      radarLiveByHydro={radarLiveByHydro}
      onNoteChange={onNoteChange}
    />
  )

  return (
    <Box
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-share-note]")) {
          return
        }
        onToggle()
      }}
      sx={{
        position: "relative",
        width: TRAY_CARD_WIDTH,
        minWidth: TRAY_CARD_WIDTH,
        borderRadius: "8px",
        border: `2px solid ${isInStory ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
        cursor: "pointer",
        opacity: isInStory ? 0.55 : 1,
        transition: "all 150ms ease",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          opacity: isInStory ? 0.65 : 1,
        },
      }}
    >
      <Box
        ref={(el: HTMLDivElement | null) => {
          onRegisterTrayContentRef(item.id, el)
        }}
        sx={{ px: 0.5, pb: 0.5 }}
      >
        {renderContent()}
      </Box>

      {/* In-story badge */}
      {isInStory && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: theme.shadow.sm,
          }}
        >
          <icons.Check
            sx={{ fontSize: "1rem", color: theme.palette.common.white }}
          />
        </Box>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// StoryCard - sortable full-size card for the story canvas
// ---------------------------------------------------------------------------

function StoryCard({
  item,
  onRemoveFromStory,
  onDelete,
  onDownloadData,
  onRegisterContentRef,
  onNoteChange,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
  csvLookups,
}: {
  item: ShareItem
  onRemoveFromStory: (id: string) => void
  onDelete: (id: string) => void
  onDownloadData: (item: ShareItem) => void
  onRegisterContentRef: (id: string, el: HTMLDivElement | null) => void
  onNoteChange: (id: string, note: string) => void
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<
    string,
    {
      name: string
      description: string
      definition: string
      shortLabel: string
    }
  >
  allChartData: Record<string, Record<string, unknown> | undefined>
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>
  csvLookups: CsvLookups
}) {
  const theme = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const handleDownloadPng = useCallback(async () => {
    await downloadShareItemAsPng(
      item,
      contentRef.current,
      theme.palette.common.white,
      csvLookups,
    )
  }, [item, theme.palette.common.white, csvLookups])

  const handleDownloadSvg = useCallback(async () => {
    await downloadShareItemAsSvg(
      item,
      contentRef.current,
      theme.palette.common.white,
      csvLookups,
    )
  }, [item, theme.palette.common.white, csvLookups])

  const style: React.CSSProperties = {
    transform: transformToCSS(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
    zIndex: isDragging ? 100 : "auto",
  }

  const renderContent = () => (
    <Box sx={{ px: 0.5, pb: 0.5 }}>
      <ShareItemView
        item={item}
        outcomeNames={outcomeNames}
        scenarioLookup={scenarioLookup}
        allChartData={allChartData}
        radarLiveByHydro={radarLiveByHydro}
        onNoteChange={onNoteChange}
      />
    </Box>
  )

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 0.5,
          color: theme.palette.grey[400],
          "&:hover": { color: theme.palette.grey[600] },
        }}
      >
        <icons.DragIndicator sx={{ fontSize: "1rem" }} />
      </Box>

      <Box
        ref={(el: HTMLDivElement | null) => {
          ;(
            contentRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = el
          onRegisterContentRef(item.id, el)
        }}
      >
        {renderContent()}
      </Box>

      {/* Actions */}
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 1,
            alignItems: "center",
          }}
        >
          <Tooltip title="Download as PNG" arrow>
            <IconButton
              size="small"
              onClick={handleDownloadPng}
              sx={{ p: 0.75, color: theme.palette.grey[600] }}
            >
              <icons.Image sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download as SVG" arrow>
            <IconButton
              size="small"
              onClick={handleDownloadSvg}
              sx={{ p: 0.75, color: theme.palette.grey[600] }}
            >
              <icons.Code sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </Tooltip>
          {(() => {
            const hasData =
              !!item.cachedChartData &&
              Object.keys(item.cachedChartData).length > 0
            return (
              <Tooltip
                title={
                  hasData
                    ? "Download data"
                    : "No data available. Try re-sharing."
                }
                arrow
              >
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onDownloadData(item)}
                    disabled={!hasData}
                    sx={{
                      p: 0.75,
                      color: hasData
                        ? theme.palette.grey[600]
                        : theme.palette.grey[300],
                    }}
                  >
                    <icons.DataObject sx={{ fontSize: "1.25rem" }} />
                  </IconButton>
                </span>
              </Tooltip>
            )
          })()}
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Remove from story" arrow>
            <IconButton
              size="small"
              onClick={() => onRemoveFromStory(item.id)}
              sx={{ p: 0.75, color: theme.palette.grey[500] }}
            >
              <icons.RemoveCircleOutline sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete card" arrow>
            <IconButton
              size="small"
              onClick={() => onDelete(item.id)}
              sx={{ p: 0.75, color: theme.palette.grey[500] }}
            >
              <icons.Delete sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main SharePanel
// ---------------------------------------------------------------------------

export default function SharePanel() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()
  const [copied, setCopied] = useState(false)

  const {
    shareItems,
    storyItemIds,
    removeShareItem,
    addToStory,
    removeFromStory,
    reorderStory,
    updateShareItem,
  } = useExplorerStore()

  const handleNoteChange = useCallback(
    (id: string, note: string) => {
      updateShareItem(id, { note })
    },
    [updateShareItem],
  )

  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  // One `useTierChartData(period, true)` per explore hydro so share
  // items use `item.hydroclimate`, with full parallel rows (not
  // showOnlyChosen-filtered) for URL / mixed-tray rehydration.
  const compHistorical = useTierChartData("historical", true)
  const compCc50 = useTierChartData("cc50", true)
  const compCc95 = useTierChartData("cc95", true)

  const radarLiveByHydro = useMemo(
    () =>
      ({
        historical: buildShareRadarLiveDataFields(compHistorical),
        cc50: buildShareRadarLiveDataFields(compCc50),
        cc95: buildShareRadarLiveDataFields(compCc95),
      }) satisfies Record<ShareRadarHydroKey, ShareRadarLiveDataFields>,
    [compHistorical, compCc50, compCc95],
  )

  // Per-variant rehydration is mounted once via
  // `ShareDataRehydrationHost` (see render below). The previous inline
  // useEffect that backfilled bar-chart data lives in
  // `barChart.DataRehydrator` now; the host keeps the same behavior
  // for bar charts and adds it for radar / equity / resilience
  // heatmap items so URL-restored cards have data ready when the
  // user clicks "Download all data".

  const scenarioLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        description: string
        definition: string
        shortLabel: string
      }
    >()
    siblingGroups.forEach((s) => {
      map.set(s.scenarioId, {
        name: s.shortLabel,
        description: s.label,
        definition: s.description,
        shortLabel: s.shortLabel,
      })
    })
    return map
  }, [siblingGroups])

  const storyItemIdSet = useMemo(() => new Set(storyItemIds), [storyItemIds])

  const storyItems = useMemo(() => {
    const byId = new Map(shareItems.map((s) => [s.id, s]))
    return storyItemIds.map((id) => byId.get(id)).filter(Boolean) as ShareItem[]
  }, [shareItems, storyItemIds])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleStoryDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = storyItemIds.indexOf(active.id as string)
      const newIndex = storyItemIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return
      reorderStory(arrayMove(storyItemIds, oldIndex, newIndex))
    },
    [storyItemIds, reorderStory],
  )

  const handleToggleStory = useCallback(
    (id: string) => {
      if (storyItemIdSet.has(id)) {
        removeFromStory(id)
      } else {
        addToStory(id)
      }
    },
    [storyItemIdSet, addToStory, removeFromStory],
  )

  // Single outcome-name lookup for the bar chart and radar CSV
  // exporters. Falls back to the resolved-tiers display name and
  // finally the raw OutcomeCode so the exporter never emits a code
  // when a display name is available.
  const outcomeNameByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of outcomeNames) map.set(o.shortCode, o.displayName)
    return map
  }, [outcomeNames])

  const outcomeNameLookup = useCallback(
    (code: string) => outcomeNameByCode.get(code) ?? code,
    [outcomeNameByCode],
  )

  const scenarioNameLookup = useCallback(
    (id: string) =>
      scenarioLookup.get(id)?.description ?? scenarioLookup.get(id)?.name ?? id,
    [scenarioLookup],
  )

  const scenarioShortLabelLookup = useCallback(
    (id: string) => scenarioLookup.get(id)?.shortLabel ?? id,
    [scenarioLookup],
  )

  // Bundled lookups passed wherever a handler-driven helper needs
  // to resolve scenario / outcome ids to display labels (filename
  // construction, CSV column headers).
  const csvLookups = useMemo<CsvLookups>(
    () => ({
      scenarioNameLookup,
      scenarioShortLabelLookup,
      outcomeNameLookup,
    }),
    [scenarioNameLookup, scenarioShortLabelLookup, outcomeNameLookup],
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
      exportShareItemAsCSV(
        item,
        filename,
        scenarioNameLookup,
        outcomeNameLookup,
        scenarioShortLabelLookup,
      )
    },
    [
      csvLookups,
      scenarioNameLookup,
      outcomeNameLookup,
      scenarioShortLabelLookup,
    ],
  )

  // Story-canvas card refs are the primary live-element source for
  // the bulk download path. Tray refs are registered too so tray-only
  // items (not added to a story) still produce a styled-card export.
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

  const handleDownloadAllImages = useCallback(async () => {
    const items = storyItems.length > 0 ? storyItems : shareItems
    for (const item of items) {
      const el = resolveLiveCardEl(item.id)
      await downloadShareItemAsPng(
        item,
        el,
        theme.palette.common.white,
        csvLookups,
      )
    }
  }, [
    storyItems,
    shareItems,
    theme.palette.common.white,
    resolveLiveCardEl,
    csvLookups,
  ])

  const handleDownloadAllData = useCallback(async () => {
    const items = storyItems.length > 0 ? storyItems : shareItems
    await exportAllShareItemsAsZip(
      items,
      withExt("coeqwal-share-export", "zip"),
      scenarioNameLookup,
      outcomeNameLookup,
      scenarioShortLabelLookup,
    )
  }, [
    storyItems,
    shareItems,
    scenarioNameLookup,
    outcomeNameLookup,
    scenarioShortLabelLookup,
  ])

  // Gate the bulk-data button until every variant's rehydrator has
  // populated `cachedChartData`. Without this gate the ZIP would
  // silently drop items whose async resolver is still loading on
  // first share-tab open after a URL load.
  const bulkItems = useMemo(
    () => (storyItems.length > 0 ? storyItems : shareItems),
    [storyItems, shareItems],
  )
  const dataReady = useShareDataReady(bulkItems)

  // The host has to live inside the share panel so the rehydrators
  // can read SWR caches the panel already populated (resolved tier
  // data, comparison data). Build the context once per render with
  // the same fields the cards already use.
  const rehydrationContext = useMemo(
    () => ({
      allChartData: allChartData as Record<
        string,
        Record<string, unknown> | undefined
      >,
      radarLiveByHydro,
      updateShareItem,
    }),
    [allChartData, radarLiveByHydro, updateShareItem],
  )

  // ── Empty state: no share items at all ──
  if (shareItems.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 400,
          gap: 2,
          px: 3,
        }}
      >
        <Typography variant="h3" component="h2" color="text.secondary">
          Share
        </Typography>
        <Typography
          sx={{
            fontSize: "0.9375rem",
            color: theme.palette.text.secondary,
            textAlign: "center",
            maxWidth: 420,
            opacity: 0.8,
          }}
        >
          No scenarios staged for sharing yet. Go to the Explore tab, find
          scenarios that you want to share, and click the share icon on each
          one.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigateToTab("explore")}
          sx={{
            textTransform: "none",
            mt: 1,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.text.secondary,
          }}
        >
          Go to Explore
        </Button>
      </Box>
    )
  }

  // ── Section headline (full width) + two-zone body (tray | story) ──
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <ShareDataRehydrationHost
        items={shareItems}
        context={rehydrationContext}
      />
      <Box
        sx={{
          flexShrink: 0,
          width: "100%",
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: theme.space.section.md,
        }}
      >
        <Typography variant="h3" component="h2" color="text.secondary">
          Tell your water story
        </Typography>
        <ShareUrlVersionNotice />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ─── Scorecard Tray (left, fixed-width, vertical scroll) ─── */}
        <Box
          sx={{
            flexShrink: 0,
            width: TRAY_CARD_WIDTH + 32,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.grey[50],
            px: 2,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[300],
              borderRadius: 3,
            },
          }}
        >
          {shareItems.map((item) => (
            <TrayCard
              key={item.id}
              item={item}
              isInStory={storyItemIdSet.has(item.id)}
              onToggle={() => handleToggleStory(item.id)}
              onNoteChange={handleNoteChange}
              onRegisterTrayContentRef={registerTrayCardRef}
              outcomeNames={outcomeNames}
              scenarioLookup={scenarioLookup}
              allChartData={
                allChartData as Record<
                  string,
                  Record<string, unknown> | undefined
                >
              }
              radarLiveByHydro={radarLiveByHydro}
            />
          ))}
        </Box>

        {/* ─── Story Canvas (right, scrollable) ─── */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            px: 3,
            pt: theme.space.section.lg,
            pb: 3,
          }}
        >
          {storyItems.length > 0 ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ opacity: 0.85, mb: theme.space.section.md }}
              >
                {storyItems.length} card{storyItems.length !== 1 ? "s" : ""} in
                your story. Drag to rearrange.
              </Typography>

              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragEnd={handleStoryDragEnd}
              >
                <SortableContext
                  items={storyItemIds}
                  strategy={rectSortingStrategy}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "1fr 1fr",
                      },
                      gap: 2,
                    }}
                  >
                    {storyItems.map((item) => (
                      <StoryCard
                        key={item.id}
                        item={item}
                        onRemoveFromStory={removeFromStory}
                        onDelete={removeShareItem}
                        onDownloadData={handleDownloadData}
                        onRegisterContentRef={registerCardRef}
                        onNoteChange={handleNoteChange}
                        outcomeNames={outcomeNames}
                        scenarioLookup={scenarioLookup}
                        allChartData={
                          allChartData as Record<
                            string,
                            Record<string, unknown> | undefined
                          >
                        }
                        radarLiveByHydro={radarLiveByHydro}
                        csvLookups={csvLookups}
                      />
                    ))}
                  </Box>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                gap: 1.5,
                opacity: 0.6,
              }}
            >
              <icons.ArrowBack
                sx={{ fontSize: "2rem", color: theme.palette.grey[400] }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ maxWidth: 360 }}
              >
                Click cards in the tray on the left to add them to your story
              </Typography>
            </Box>
          )}

          {/* ─── Export bar ─── */}
          {storyItems.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Tooltip
                title={copied ? "Copied!" : "Copy shareable URL to clipboard"}
                arrow
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    const st = useExplorerStore.getState()
                    const url = encodeShareItems(
                      st.shareItems,
                      st.hydroclimate,
                      st.storyItemIds,
                    )
                    try {
                      await navigator.clipboard.writeText(url)
                    } catch {
                      const ta = document.createElement("textarea")
                      ta.value = url
                      document.body.appendChild(ta)
                      ta.select()
                      document.execCommand("copy")
                      document.body.removeChild(ta)
                    }
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  startIcon={
                    copied ? (
                      <icons.Check sx={{ fontSize: "1rem" }} />
                    ) : (
                      <icons.ContentCopy sx={{ fontSize: "1rem" }} />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    color: theme.palette.text.secondary,
                    borderColor: theme.palette.divider,
                  }}
                >
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownloadAllImages}
                startIcon={<icons.Image sx={{ fontSize: "0.875rem" }} />}
                sx={{
                  textTransform: "none",
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                }}
              >
                Download all images
              </Button>
              <Tooltip
                title={
                  dataReady
                    ? "Download a ZIP with one CSV per card"
                    : "Preparing data..."
                }
                arrow
              >
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleDownloadAllData}
                    disabled={!dataReady}
                    startIcon={
                      <icons.DataObject sx={{ fontSize: "0.875rem" }} />
                    }
                    sx={{
                      textTransform: "none",
                      color: theme.palette.text.secondary,
                      borderColor: theme.palette.divider,
                    }}
                  >
                    Download all data
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                disabled
                startIcon={
                  <icons.PictureAsPdf
                    sx={{
                      fontSize: "0.875rem",
                      color: theme.palette.action.disabled,
                    }}
                  />
                }
                sx={{
                  textTransform: "none",
                  opacity: 0.45,
                  color: theme.palette.action.disabled,
                  borderColor: theme.palette.action.disabled,
                  pointerEvents: "none",
                  "&.Mui-disabled": {
                    opacity: 0.45,
                    color: theme.palette.action.disabled,
                    borderColor: theme.palette.action.disabled,
                  },
                }}
              >
                Download PDF
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
