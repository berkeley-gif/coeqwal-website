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
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"
import type { ShareItem } from "../../features/scenarioExplorer/store"
import { useResolvedScenarioTiers } from "../../features/scenarioExplorer/hooks/useResolvedScenarioTiers"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import ShareScenarioCard from "../../features/scenarioExplorer/components/ShareScenarioCard"
import type { ChartDataPoint } from "../../features/scenarios/components/shared/types"
import { toPng } from "html-to-image"
import {
  downloadFromDataUrl,
  exportAsJSON,
  getTimestampedFilename,
} from "../../features/scenarioExplorer/dataExplorer/utils/exportUtils"

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function encodeShareItems(items: ShareItem[], climate: string): string {
  const parts = [`tab=share`]
  if (climate !== "historical") parts.push(`climate=${climate}`)
  const encoded = items.map((item) => {
    if (item.type === "barChart") {
      return `b.${item.scenarioId}.${item.viewMode === "summary" ? "s" : "d"}`
    }
    const ids = item.scenarioIds.join("~")
    const axes = item.axes.join("~")
    let flags = ""
    if (item.showRange) flags += "r"
    if (item.highlightBaseline) flags += "b"
    if (item.showDotsOnly) flags += "d"
    return `r.${ids}.${axes}.${flags}`
  })
  if (encoded.length > 0) parts.push(`items=${encoded.join(",")}`)
  return `${window.location.origin}/?${parts.join("&")}`
}

// ---------------------------------------------------------------------------
// Shared URL parsing (exported for use by TabPanels restore logic)
// ---------------------------------------------------------------------------

export function parseShareItemsParam(param: string): ShareItem[] {
  if (!param) return []
  return param
    .split(",")
    .map((token): ShareItem | null => {
      const parts = token.split(".")
      if (parts[0] === "b" && parts.length >= 3) {
        return {
          id: crypto.randomUUID(),
          type: "barChart",
          scenarioId: parts[1]!,
          viewMode: parts[2] === "d" ? "distribution" : "summary",
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
          highlightBaseline: flags.includes("b"),
          showDotsOnly: flags.includes("d"),
        }
      }
      return null
    })
    .filter(Boolean) as ShareItem[]
}

// ---------------------------------------------------------------------------
// Transform helper for dnd-kit (translate only, no scale)
// ---------------------------------------------------------------------------

function transformToCSS(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!transform) return undefined
  const { x, y } = transform
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
}

// ---------------------------------------------------------------------------
// Sortable card (unified for both barChart and radar items)
// ---------------------------------------------------------------------------

function SortableShareCard({
  item,
  onRemove,
  onDownloadData,
  onRegisterContentRef,
  outcomeNames,
  scenarioLookup,
  allChartData,
  hydroclimate,
}: {
  item: ShareItem
  onRemove: (id: string) => void
  onDownloadData: (item: ShareItem) => void
  onRegisterContentRef: (id: string, el: HTMLDivElement | null) => void
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<string, { name: string; description: string; definition: string }>
  allChartData: Record<string, Record<string, unknown> | undefined>
  hydroclimate: string
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

  const handleDownloadImage = useCallback(async () => {
    const el = contentRef.current
    if (!el) return
    try {
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1
      const dataUrl = await toPng(el, {
        pixelRatio: dpr * 2,
        backgroundColor: "#ffffff",
      })
      const label =
        item.type === "barChart"
          ? `coeqwal-${item.scenarioId}-${item.viewMode}`
          : `coeqwal-radar-${item.scenarioIds.length}scenarios`
      await downloadFromDataUrl(
        dataUrl,
        getTimestampedFilename(label, "png"),
      )
    } catch {
      if (item.cachedImageDataUrl) {
        await downloadFromDataUrl(
          item.cachedImageDataUrl,
          getTimestampedFilename(`coeqwal-${item.type}`, "png"),
        )
      }
    }
  }, [item])

  const style: React.CSSProperties = {
    transform: transformToCSS(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
    zIndex: isDragging ? 100 : "auto",
  }

  const renderContent = () => {
    if (item.type === "barChart") {
      const info = scenarioLookup.get(item.scenarioId)
      const viewLabel =
        item.viewMode === "distribution"
          ? "Key outcomes distribution"
          : "Key outcomes bar chart"
      const chartData =
        (item.cachedChartData as Record<string, ChartDataPoint[]> | undefined) ??
        (allChartData[item.scenarioId] as Record<string, ChartDataPoint[]> | undefined)
      return (
        <Box sx={{ px: 0.5, pb: 0.5 }}>
          <ShareScenarioCard
            scenarioId={item.id}
            name={info?.description ?? info?.name ?? item.scenarioId}
            scenarioDefinition={info?.definition}
            description={viewLabel}
            hydroclimate={hydroclimate}
            chartData={chartData}
            outcomeNames={outcomeNames}
            viewMode={item.viewMode}
          />
        </Box>
      )
    }

    const radarLabel = `Radar: ${item.scenarioIds.length} scenario${item.scenarioIds.length !== 1 ? "s" : ""}`
    const toggleParts: string[] = []
    if (item.showRange) toggleParts.push("range")
    if (item.highlightBaseline) toggleParts.push("baseline")
    const subtitle =
      toggleParts.length > 0
        ? `with ${toggleParts.join(" + ")}`
        : `${item.axes.length} axes`

    return (
      <>
        {item.cachedImageDataUrl ? (
          <Box sx={{ px: 1, pb: 0.75 }}>
            <Box
              component="img"
              src={item.cachedImageDataUrl}
              alt={radarLabel}
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: "4px",
                backgroundColor: "#fff",
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              px: 1,
              pb: 0.75,
              minHeight: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.palette.grey[500],
              fontSize: "0.75rem",
            }}
          >
            Radar view (re-open Explore to regenerate image)
          </Box>
        )}
        <Box sx={{ px: 1.5, pb: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.palette.grey[900],
              fontSize: "0.8125rem",
            }}
          >
            {radarLabel}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              lineHeight: 1.3,
              color: theme.palette.grey[600],
              fontSize: "0.6875rem",
              mt: 0.25,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </>
    )
  }

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
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          onRegisterContentRef(item.id, el)
        }}
      >
        {renderContent()}
      </Box>

      {/* Actions */}
      <Box sx={{ px: 1.5, pb: 1.25 }}>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 0.5,
            alignItems: "center",
          }}
        >
          <Tooltip title="Download image" arrow>
            <IconButton
              size="small"
              onClick={handleDownloadImage}
              sx={{ p: 0.5, color: theme.palette.grey[500] }}
            >
              <icons.Image sx={{ fontSize: "0.875rem" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download data" arrow>
            <IconButton
              size="small"
              onClick={() => onDownloadData(item)}
              disabled={!item.cachedChartData}
              sx={{ p: 0.5, color: theme.palette.grey[500] }}
            >
              <icons.DataObject sx={{ fontSize: "0.875rem" }} />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Remove" arrow>
            <IconButton
              size="small"
              onClick={() => onRemove(item.id)}
              sx={{ p: 0.5, color: theme.palette.grey[400] }}
            >
              <icons.Close sx={{ fontSize: "0.875rem" }} />
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

  const { shareItems, hydroclimate, reorderShareItems, removeShareItem } =
    useScenarioExplorerStore()

  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  const scenarioLookup = useMemo(() => {
    const map = new Map<string, { name: string; description: string; definition: string }>()
    siblingGroups.forEach((s) => {
      map.set(s.scenarioId, {
        name: s.shortLabel,
        description: s.label,
        definition: s.description,
      })
    })
    return map
  }, [siblingGroups])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const itemIds = useMemo(
    () => shareItems.map((s) => s.id),
    [shareItems],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = itemIds.indexOf(active.id as string)
      const newIndex = itemIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return
      reorderShareItems(arrayMove(itemIds, oldIndex, newIndex))
    },
    [itemIds, reorderShareItems],
  )

  const handleDownloadData = useCallback((item: ShareItem) => {
    if (!item.cachedChartData) return
    const filename = getTimestampedFilename(
      `coeqwal-${item.type}-data`,
      "json",
    )
    exportAsJSON(item.cachedChartData, filename)
  }, [])

  const cardContentRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const registerCardRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      if (el) cardContentRefs.current.set(id, el)
      else cardContentRefs.current.delete(id)
    },
    [],
  )

  const handleDownloadAllImages = useCallback(async () => {
    for (const item of shareItems) {
      const el = cardContentRefs.current.get(item.id)
      if (el) {
        try {
          const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio : 1
          const dataUrl = await toPng(el, {
            pixelRatio: dpr * 2,
            backgroundColor: "#ffffff",
          })
          const label =
            item.type === "barChart"
              ? `coeqwal-${item.scenarioId}-${item.viewMode}`
              : `coeqwal-radar-${item.scenarioIds.length}scenarios`
          await downloadFromDataUrl(
            dataUrl,
            getTimestampedFilename(label, "png"),
          )
        } catch {
          if (item.cachedImageDataUrl) {
            await downloadFromDataUrl(
              item.cachedImageDataUrl,
              getTimestampedFilename(`coeqwal-${item.type}`, "png"),
            )
          }
        }
      } else if (item.cachedImageDataUrl) {
        await downloadFromDataUrl(
          item.cachedImageDataUrl,
          getTimestampedFilename(`coeqwal-${item.type}`, "png"),
        )
      }
    }
  }, [shareItems])

  const handleDownloadAllData = useCallback(() => {
    const allData = shareItems
      .filter((s) => s.cachedChartData)
      .map((s) => ({
        type: s.type,
        ...(s.type === "barChart"
          ? { scenarioId: s.scenarioId, viewMode: s.viewMode }
          : { scenarioIds: s.scenarioIds, axes: s.axes }),
        chartData: s.cachedChartData,
      }))
    exportAsJSON(allData, getTimestampedFilename("coeqwal-chart-data", "json"))
  }, [shareItems])

  if (shareItems.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 2,
          px: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
        >
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
          scenarios you want to share, and click the share icon on each one.
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

  return (
    <Box sx={{ px: 3, py: 3, maxWidth: 960, mx: "auto" }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.secondary }}
      >
        Share
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          color: theme.palette.text.secondary,
          opacity: 0.8,
          mb: 3,
        }}
      >
        {shareItems.length} item{shareItems.length !== 1 ? "s" : ""}.
        Drag to rearrange. Download individually or export all.
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
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
            {shareItems.map((item) => (
              <SortableShareCard
                key={item.id}
                item={item}
                onRemove={removeShareItem}
                onDownloadData={handleDownloadData}
                onRegisterContentRef={registerCardRef}
                outcomeNames={outcomeNames}
                scenarioLookup={scenarioLookup}
                allChartData={allChartData as Record<string, Record<string, unknown> | undefined>}
                hydroclimate={hydroclimate}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>

      {/* Export bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          mt: 3,
          pt: 2,
          borderTop: `1px solid rgba(255,255,255,0.15)`,
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
              const url = encodeShareItems(shareItems, hydroclimate)
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
              borderColor: "rgba(255,255,255,0.3)",
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
            borderColor: "rgba(255,255,255,0.3)",
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
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          Download all data
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled
          startIcon={<icons.PictureAsPdf sx={{ fontSize: "0.875rem" }} />}
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          Download PDF
        </Button>
      </Box>
    </Box>
  )
}
