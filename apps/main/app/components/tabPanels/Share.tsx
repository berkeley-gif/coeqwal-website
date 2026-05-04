"use client"

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react"
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
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"
import type { ShareItem } from "../../features/scenarioExplorer/store"
import { useResolvedScenarioTiers } from "../../features/scenarioExplorer/hooks/useResolvedScenarioTiers"
import { useComparisonData } from "../../features/scenarioExplorer/hooks/useComparisonData"
import {
  buildShareRadarLiveDataFields,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "../../features/scenarioExplorer/share/utils/shareRadarLiveData"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import ShareItemView from "../../features/scenarioExplorer/share/ShareItemView"
import ShareUrlVersionNotice from "../../features/scenarioExplorer/share/ui/ShareUrlVersionNotice"
import { toPng } from "html-to-image"
import {
  downloadFromDataUrl,
  downloadSvgString,
  rasterizeSvgString,
  embedFontStylesInSvg,
  exportShareItemAsCSV,
  exportAllShareItemsAsCSV,
  getTimestampedFilename,
} from "../../features/scenarioExplorer/dataExplorer/utils/exportUtils"

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------
// All encode / decode logic lives in `share/url.ts` and is re-
// exported from `share/index.ts`. Only the call site below
// (`encodeShareItems` for the "Copy link" button) imports anything
// here.

import { encodeShareItems } from "../../features/scenarioExplorer/share/url"

/**
 * Per-hydroclimate radar fields for share. See `buildShareRadarLiveDataFields`
 * and `useComparisonData(period, true)` in the share panel and drawer.
 */
export type ShareRenderLiveData = ShareRadarLiveDataFields
export type { ShareRadarHydroKey } from "../../features/scenarioExplorer/share/utils/shareRadarLiveData"

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

/** Label fragment used by getTimestampedFilename for share downloads. */
function shareItemFilenameLabel(item: ShareItem): string {
  switch (item.type) {
    case "barChart":
      return `coeqwal-${item.scenarioId}-${item.viewMode}`
    case "radar":
      return `coeqwal-radar-${item.scenarioIds.length}scenarios`
    case "equity":
      return `coeqwal-distribution-${item.scenarioId}`
    case "resilience":
      return `coeqwal-resilience-${item.view}`
  }
}

/**
 * Per-variant raster output size, in pixels (square or rectangle).
 * Picked to roughly match the live panel's aspect, so PNG outputs
 * look like what the user saw on screen.
 */
const RASTER_SIZE: Record<
  ShareItem["type"],
  { width: number; height: number }
> = {
  radar: { width: 600, height: 600 },
  equity: { width: 900, height: 600 },
  resilience: { width: 900, height: 600 },
  barChart: { width: 800, height: 400 },
}

function hasCachedSvg(item: ShareItem): boolean {
  return typeof item.cachedSvg === "string" && item.cachedSvg.length > 0
}

/**
 * PNG download path. Order of preference:
 *   1. cachedSvg → rasterize on demand. Output matches the captured
 *      snapshot exactly, regardless of the current live state.
 *   2. live element via html-to-image. Used for variants whose card
 *      contains a re-rendered chart but no SVG cache (URL-restored
 *      items).
 *   3. cachedImageDataUrl. Direct write of an old PNG fallback.
 */
async function downloadShareItemAsPng(
  item: ShareItem,
  liveEl: HTMLElement | null,
  backgroundColor: string,
): Promise<void> {
  const filename = getTimestampedFilename(shareItemFilenameLabel(item), "png")

  if (item.cachedSvg) {
    try {
      const size = RASTER_SIZE[item.type]
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
        "[Share] PNG download via cachedSvg failed, falling back to live capture:",
        err,
      )
    }
  }

  if (liveEl) {
    try {
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1
      const dataUrl = await toPng(liveEl, {
        pixelRatio: dpr * 2,
        backgroundColor,
      })
      await downloadFromDataUrl(dataUrl, filename)
      return
    } catch (err) {
      console.warn(
        "[Share] PNG download via live capture failed, falling back to cached PNG:",
        err,
      )
    }
  }

  if (item.cachedImageDataUrl) {
    await downloadFromDataUrl(item.cachedImageDataUrl, filename)
  }
}

/**
 * SVG download path. Embeds an @import for the Neue Haas family so
 * renderers that honor web fonts match the on-screen typography;
 * native vector tools fall back to the listed system stack.
 */
function downloadShareItemAsSvg(item: ShareItem): void {
  if (!item.cachedSvg) return
  const filename = getTimestampedFilename(shareItemFilenameLabel(item), "svg")
  downloadSvgString(embedFontStylesInSvg(item.cachedSvg), filename)
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
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
}: {
  item: ShareItem
  isInStory: boolean
  onToggle: () => void
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
      <Box sx={{ px: 0.5, pb: 0.5 }}>{renderContent()}</Box>

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
    )
  }, [item, theme.palette.common.white])

  const handleDownloadSvg = useCallback(() => {
    downloadShareItemAsSvg(item)
  }, [item])

  const svgAvailable = hasCachedSvg(item)

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
          {svgAvailable && (
            <Tooltip title="Download as SVG" arrow>
              <IconButton
                size="small"
                onClick={handleDownloadSvg}
                sx={{ p: 0.75, color: theme.palette.grey[600] }}
              >
                <icons.Code sx={{ fontSize: "1.25rem" }} />
              </IconButton>
            </Tooltip>
          )}
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
  } = useScenarioExplorerStore()

  const handleNoteChange = useCallback(
    (id: string, note: string) => {
      updateShareItem(id, { note })
    },
    [updateShareItem],
  )

  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  // One `useComparisonData(period, true)` per explore hydro so share
  // items use `item.hydroclimate`, with full parallel rows (not
  // showOnlyChosen-filtered) for URL / mixed-tray rehydration.
  const compHistorical = useComparisonData("historical", true)
  const compCc50 = useComparisonData("cc50", true)
  const compCc95 = useComparisonData("cc95", true)

  const radarLiveByHydro = useMemo(
    () =>
      ({
        historical: buildShareRadarLiveDataFields(compHistorical),
        cc50: buildShareRadarLiveDataFields(compCc50),
        cc95: buildShareRadarLiveDataFields(compCc95),
      }) satisfies Record<ShareRadarHydroKey, ShareRadarLiveDataFields>,
    [compHistorical, compCc50, compCc95],
  )

  // Rehydrate cachedChartData for bar chart items restored from localStorage
  useEffect(() => {
    if (!allChartData) return
    for (const item of shareItems) {
      if (
        item.type === "barChart" &&
        !item.cachedChartData &&
        allChartData[item.scenarioId]
      ) {
        updateShareItem(item.id, {
          cachedChartData: allChartData[item.scenarioId] as Record<
            string,
            unknown
          >,
        })
      }
    }
  }, [shareItems, allChartData, updateShareItem])

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

  const handleDownloadData = useCallback(
    (item: ShareItem) => {
      if (
        !item.cachedChartData ||
        Object.keys(item.cachedChartData).length === 0
      )
        return
      const filename = getTimestampedFilename(
        `coeqwal-${item.type}-data`,
        "csv",
      )
      exportShareItemAsCSV(
        item,
        filename,
        (id) =>
          scenarioLookup.get(id)?.description ??
          scenarioLookup.get(id)?.name ??
          id,
      )
    },
    [scenarioLookup],
  )

  const cardContentRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const registerCardRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) cardContentRefs.current.set(id, el)
      else cardContentRefs.current.delete(id)
    },
    [],
  )

  const handleDownloadAllImages = useCallback(async () => {
    const items = storyItems.length > 0 ? storyItems : shareItems
    for (const item of items) {
      const el = cardContentRefs.current.get(item.id) ?? null
      await downloadShareItemAsPng(item, el, theme.palette.common.white)
    }
  }, [storyItems, shareItems, theme.palette.common.white])

  const handleDownloadAllData = useCallback(() => {
    const items = storyItems.length > 0 ? storyItems : shareItems
    exportAllShareItemsAsCSV(
      items,
      getTimestampedFilename("coeqwal-chart-data", "csv"),
      (id) =>
        scenarioLookup.get(id)?.description ??
        scenarioLookup.get(id)?.name ??
        id,
    )
  }, [storyItems, shareItems, scenarioLookup])

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
                    const st = useScenarioExplorerStore.getState()
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
              <Button
                variant="outlined"
                size="small"
                onClick={handleDownloadAllData}
                startIcon={<icons.DataObject sx={{ fontSize: "0.875rem" }} />}
                sx={{
                  textTransform: "none",
                  color: theme.palette.text.secondary,
                  borderColor: theme.palette.divider,
                }}
              >
                Download all data
              </Button>
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
