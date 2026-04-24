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
import { useScenarioList } from "../../features/scenarios/hooks"
import {
  normalizeShareRadarHydro,
  buildShareRadarLiveDataFields,
  type ShareRadarHydroKey,
  type ShareRadarLiveDataFields,
} from "../../features/scenarioExplorer/utils/shareRadarLiveData"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import ShareScenarioCard from "../../features/scenarioExplorer/components/ShareScenarioCard"
import ShareRadarCard from "../../features/scenarioExplorer/components/ShareRadarCard"
import ShareSnapshotCard from "../../features/scenarioExplorer/components/ShareSnapshotCard"
import ShareRadarLiveChart from "../../features/scenarioExplorer/components/ShareRadarLiveChart"
import ResilienceShareCard from "../../features/scenarioExplorer/components/ResilienceShareCard"
import type { ChartDataPoint } from "../../features/scenarios/components/shared/types"
import type { VerticalParallelLineData } from "@repo/viz"
import {
  OUTCOME_NAMES,
  getOutcomeName,
  type OutcomeCode,
} from "../../content/outcomes"
import { toPng } from "html-to-image"
import {
  downloadFromDataUrl,
  exportShareItemAsCSV,
  exportAllShareItemsAsCSV,
  getTimestampedFilename,
} from "../../features/scenarioExplorer/dataExplorer/utils/exportUtils"

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function encodeShareItems(
  items: ShareItem[],
  climate: string,
  storyIds?: string[],
): string {
  const parts = [`tab=share`]
  if (climate !== "historical") parts.push(`climate=${climate}`)
  const encoded = items.map((item) => {
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
      // Note and cached image are intentionally not URL-encoded. Notes
      // are a private annotation; images are too large to fit a URL.
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
      // Optional 7th segment "n" when numeric cell values were on at save.
      // Scope: tileScope / tileId / tileLabel and cachedChartData /
      // cachedImageDataUrl are not encoded. Round-tripped items rehydrate
      // with partial context (same as other tools without full capture).
      const num =
        item.view !== "quadrant" && item.showCellNumbers ? ".n" : ""
      return `q.${view}.${encoding}.${ids}.${climates}.${outcomes}${num}`
    }
    return ""
  })
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

// ---------------------------------------------------------------------------
// Shared URL parsing (exported for use by TabPanels restore logic)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Resilience controls URL schema (forward-compatible, legacy-safe).
//
// The resilience heatmap panel owns its own state locally in
// ScenarioExplorer.tsx (see `resilienceControls`). It is not part of
// ShareItem[] because it isn't a pinned card; it is the active tool
// configuration. Shared URLs created before this reset never carried
// resilience state, so existing URLs continue to parse identically and
// the panel falls through to its initial defaults.
//
// The token schema below is available for a future "share this chart
// configuration" surface. It deliberately uses short keys so the URL
// stays compact, and skips any field at its initial default so
// round-tripped URLs stay as short as possible.
//
// Schema (order-independent, each segment "key:value"):
//   v:s|o|a|q             view (scenario / outcome / aggregate / quadrant)
//   po:<outcomeCode>      primaryOutcomeCode
//   co:<code>~<code>      compareOutcomeCodes
//   er:<code>~<code>      expandedRegionalOutcomes
//   sc:s|a                aggregateScope (selected / all)
//
// Scenarios mode is sidebar-driven: the ShareItem encoding already
// carries the scenario selection, so no per-chart scenario tokens
// are required.
// ---------------------------------------------------------------------------

export interface ResilienceShareShape {
  view?: "scenario" | "outcome" | "aggregate" | "quadrant"
  primaryOutcomeCode?: string | null
  compareOutcomeCodes?: string[]
  expandedRegionalOutcomes?: string[]
  aggregateScope?: "selected" | "all"
}

const RESILIENCE_VIEW_TOKEN: Record<
  NonNullable<ResilienceShareShape["view"]>,
  string
> = {
  scenario: "s",
  outcome: "o",
  aggregate: "a",
  quadrant: "q",
}

export function encodeResilienceControls(shape: ResilienceShareShape): string {
  const parts: string[] = []
  if (shape.view && shape.view !== "scenario") {
    parts.push(`v:${RESILIENCE_VIEW_TOKEN[shape.view]}`)
  }
  if (shape.primaryOutcomeCode) parts.push(`po:${shape.primaryOutcomeCode}`)
  if (shape.compareOutcomeCodes && shape.compareOutcomeCodes.length > 0) {
    parts.push(`co:${shape.compareOutcomeCodes.join("~")}`)
  }
  if (
    shape.expandedRegionalOutcomes &&
    shape.expandedRegionalOutcomes.length > 0
  ) {
    parts.push(`er:${shape.expandedRegionalOutcomes.join("~")}`)
  }
  if (shape.aggregateScope === "selected") parts.push("sc:s")
  return parts.join(",")
}

export function parseResilienceControlsParam(
  param: string | null | undefined,
): ResilienceShareShape {
  if (!param) return {}
  const out: ResilienceShareShape = {}
  for (const tok of param.split(",")) {
    const sepIndex = tok.indexOf(":")
    if (sepIndex <= 0) continue
    const key = tok.slice(0, sepIndex)
    const value = tok.slice(sepIndex + 1)
    switch (key) {
      case "v":
        if (value === "s") out.view = "scenario"
        else if (value === "o") out.view = "outcome"
        else if (value === "a") out.view = "aggregate"
        else if (value === "q") out.view = "quadrant"
        break
      case "po":
        out.primaryOutcomeCode = value
        break
      case "co":
        out.compareOutcomeCodes = value.split("~").filter(Boolean)
        break
      case "er":
        out.expandedRegionalOutcomes = value.split("~").filter(Boolean)
        break
      case "sc":
        out.aggregateScope = value === "s" ? "selected" : "all"
        break
    }
  }
  return out
}

export function parseShareItemsParam(
  param: string,
  storyParam?: string,
): { items: ShareItem[]; storyItemIds: string[] } {
  if (!param) return { items: [], storyItemIds: [] }
  const items = param
    .split(",")
    .map((token): ShareItem | null => {
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
    })
    .filter(Boolean) as ShareItem[]

  let storyItemIds: string[] = []
  if (storyParam) {
    storyItemIds = storyParam
      .split(",")
      .map((s) => parseInt(s, 10))
      .filter((i) => !isNaN(i) && i >= 0 && i < items.length)
      .map((i) => items[i]!.id)
  }

  return { items, storyItemIds }
}

// ---------------------------------------------------------------------------
// Shared rendering helper for share-item cards
// ---------------------------------------------------------------------------

function outcomeCodesToLabels(codes: string[]): string[] {
  return codes.map((code) => OUTCOME_NAMES[code as OutcomeCode] ?? code)
}

/**
 * Per-hydro live radar fields for share. See `buildShareRadarLiveDataFields`
 * and `useComparisonData(period, true)` in the share panel and drawer.
 */
export type ShareRenderLiveData = ShareRadarLiveDataFields
export type { ShareRadarHydroKey } from "../../features/scenarioExplorer/utils/shareRadarLiveData"

/**
 * Render a ShareItem using the appropriate card component. Used by
 * both the tray and the story canvas. Equity items render via the
 * lightweight text-forward `ShareSnapshotCard`. Resilience uses
 * `ResilienceShareCard`. `liveData` supplies the on-the-fly radar
 * re-renders when a radar share item arrived without a cached PNG (URL
 * load, different browser, etc.).
 */
function renderShareItemBody(
  item: ShareItem,
  outcomeNames: { shortCode: string; displayName: string }[],
  scenarioLookup: Map<
    string,
    {
      name: string
      description: string
      definition: string
      shortLabel: string
    }
  >,
  allChartData: Record<string, Record<string, unknown> | undefined>,
  radarLiveByHydro: Record<ShareRadarHydroKey, ShareRadarLiveDataFields>,
  getThemeForScenario: (id: string) => string,
  onNoteChange?: (id: string, note: string) => void,
): React.ReactNode {
  if (item.type === "barChart") {
    const info = scenarioLookup.get(item.scenarioId)
    const viewLabel =
      item.viewMode === "average"
        ? "Key outcomes average"
        : item.viewMode === "distribution"
          ? "Key outcomes distribution"
          : "Key outcomes bar chart"
    const chartData =
      (item.cachedChartData as Record<string, ChartDataPoint[]> | undefined) ??
      (allChartData[item.scenarioId] as
        | Record<string, ChartDataPoint[]>
        | undefined)
    return (
      <ShareScenarioCard
        scenarioId={item.id}
        name={info?.description ?? info?.name ?? item.scenarioId}
        scenarioDefinition={info?.definition}
        description={viewLabel}
        hydroclimate={item.hydroclimate}
        chartData={chartData}
        outcomeNames={outcomeNames}
        viewMode={item.viewMode}
      />
    )
  }
  if (item.type === "radar") {
    const names = item.scenarioIds.map(
      (id) =>
        scenarioLookup.get(id)?.description ??
        scenarioLookup.get(id)?.name ??
        id,
    )
    const definitions = item.scenarioIds.map(
      (id) => scenarioLookup.get(id)?.definition ?? "",
    )
    const radarLive =
      radarLiveByHydro[normalizeShareRadarHydro(item.hydroclimate)]
    const liveChart = item.cachedImageDataUrl
      ? undefined
      : renderRadarLiveChart(item, radarLive, getThemeForScenario)
    return (
      <ShareRadarCard
        scenarioNames={names}
        scenarioDefinitions={definitions}
        scenarioColors={item.scenarioColors}
        hydroclimate={item.hydroclimate}
        showRange={item.showRange}
        showTierZones={item.showTierZones !== false}
        highlightBaseline={item.highlightBaseline}
        showDotsOnly={item.showDotsOnly}
        cachedImageDataUrl={item.cachedImageDataUrl}
        liveChart={liveChart}
      />
    )
  }
  if (item.type === "equity") {
    const info = scenarioLookup.get(item.scenarioId)
    return (
      <ShareSnapshotCard
        id={item.id}
        toolLabel="Distribution"
        title={info?.description ?? info?.name ?? item.scenarioId}
        subtitle={
          item.compareToBaseline
            ? "Compared to today's operations"
            : "Single scenario view"
        }
        chips={outcomeCodesToLabels(item.outcomeCodes)}
        hydroclimate={item.hydroclimate}
        cachedImageDataUrl={item.cachedImageDataUrl}
        note={item.note}
        onNoteChange={
          onNoteChange ? (note) => onNoteChange(item.id, note) : undefined
        }
      />
    )
  }
  if (item.type === "resilience") {
    return (
      <ResilienceShareCard
        item={item}
        scenarioLookup={scenarioLookup}
        onNoteChange={
          onNoteChange ? (note) => onNoteChange(item.id, note) : undefined
        }
      />
    )
  }
  return null
}

/**
 * Build the live-radar fallback node for a share item. Filters the
 * shared parallel-plot data down to the item's scenarios, converts
 * outcome codes back to display names, and selects line colors from
 * the item's captured palette (preferred) or the current theme.
 */
function renderRadarLiveChart(
  item: Extract<ShareItem, { type: "radar" }>,
  liveData: ShareRadarLiveDataFields,
  getThemeForScenario: (id: string) => string,
): React.ReactNode {
  const idSet = new Set(item.scenarioIds)
  const filtered = liveData.radarPlotData.filter((d) => idSet.has(d.id))
  if (filtered.length === 0) return null

  const orderedFiltered = item.scenarioIds
    .map((id) => filtered.find((d) => d.id === id))
    .filter((d): d is VerticalParallelLineData => !!d)

  const axesDisplay = item.axes.map((code) => getOutcomeName(code))

  const lineColors = orderedFiltered.map((d, i) => {
    const captured = item.scenarioColors?.[i]
    if (captured) return captured
    return liveData.radarLineColorByScenario.get(d.id) ?? "#666666"
  })

  const scenarioThemes: Record<string, string> = {}
  for (const id of item.scenarioIds) {
    scenarioThemes[id] = getThemeForScenario(id) ?? "unthemed"
  }

  return (
    <ShareRadarLiveChart
      data={orderedFiltered}
      axes={axesDisplay}
      lineColors={lineColors}
      scenarioThemes={scenarioThemes}
      baselineData={liveData.radarBaseline}
      axisRange={liveData.radarAxisRange}
      showRadarRange={item.showRange}
      showTierZones={item.showTierZones !== false}
      highlightBaseline={item.highlightBaseline}
      showDotsOnly={item.showDotsOnly}
      morphGeneration={liveData.morphGeneration}
    />
  )
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
// TrayCard - full-size card for the bottom tray (same content as StoryCard)
// ---------------------------------------------------------------------------

const TRAY_CARD_WIDTH = 280

function TrayCard({
  item,
  isInStory,
  onToggle,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
  getThemeForScenario,
}: {
  item: ShareItem
  isInStory: boolean
  onToggle: () => void
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
  getThemeForScenario: (id: string) => string
}) {
  const theme = useTheme()

  const renderContent = () =>
    renderShareItemBody(
      item,
      outcomeNames,
      scenarioLookup,
      allChartData,
      radarLiveByHydro,
      getThemeForScenario,
    )

  return (
    <Box
      onClick={onToggle}
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
      <Box sx={{ px: 0.5, pb: 0.5, pointerEvents: "none" }}>
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
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
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
  getThemeForScenario,
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
  getThemeForScenario: (id: string) => string
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
        backgroundColor: theme.palette.common.white,
        skipFonts: true,
      })
      const label =
        item.type === "barChart"
          ? `coeqwal-${item.scenarioId}-${item.viewMode}`
          : item.type === "radar"
            ? `coeqwal-radar-${item.scenarioIds.length}scenarios`
            : item.type === "equity"
              ? `coeqwal-distribution-${item.scenarioId}`
              : `coeqwal-resilience-${item.view}`
      await downloadFromDataUrl(dataUrl, getTimestampedFilename(label, "png"))
    } catch {
      if (item.cachedImageDataUrl) {
        await downloadFromDataUrl(
          item.cachedImageDataUrl,
          getTimestampedFilename(`coeqwal-${item.type}`, "png"),
        )
      }
    }
  }, [item, theme.palette.common.white])

  const style: React.CSSProperties = {
    transform: transformToCSS(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
    zIndex: isDragging ? 100 : "auto",
  }

  const renderContent = () => (
    <Box sx={{ px: 0.5, pb: 0.5 }}>
      {renderShareItemBody(
        item,
        outcomeNames,
        scenarioLookup,
        allChartData,
        radarLiveByHydro,
        getThemeForScenario,
        onNoteChange,
      )}
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
          <Tooltip title="Download image" arrow>
            <IconButton
              size="small"
              onClick={handleDownloadImage}
              sx={{ p: 0.75, color: theme.palette.grey[600] }}
            >
              <icons.Image sx={{ fontSize: "1.25rem" }} />
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
    hydroclimate,
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
  const { getThemeForScenario } = useScenarioList()

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
      const el = cardContentRefs.current.get(item.id)
      if (el) {
        try {
          const dpr =
            typeof window !== "undefined" ? window.devicePixelRatio : 1
          const dataUrl = await toPng(el, {
            pixelRatio: dpr * 2,
            backgroundColor: theme.palette.common.white,
            skipFonts: true,
          })
          const label =
            item.type === "barChart"
              ? `coeqwal-${item.scenarioId}-${item.viewMode}`
              : item.type === "radar"
                ? `coeqwal-radar-${item.scenarioIds.length}scenarios`
                : item.type === "equity"
                  ? `coeqwal-distribution-${item.scenarioId}`
                  : `coeqwal-resilience-${item.view}`
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

  // ── Two-zone layout (left tray | right canvas) ──
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
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
            outcomeNames={outcomeNames}
            scenarioLookup={scenarioLookup}
            allChartData={
              allChartData as Record<
                string,
                Record<string, unknown> | undefined
              >
            }
            radarLiveByHydro={radarLiveByHydro}
            getThemeForScenario={getThemeForScenario}
          />
        ))}
      </Box>

      {/* ─── Story Canvas (right, scrollable) ─── */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", px: 3, py: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            color: theme.palette.text.secondary,
          }}
        >
          Tell your water story
        </Typography>

        {storyItems.length > 0 ? (
          <>
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: theme.palette.text.secondary,
                opacity: 0.8,
                mb: 3,
              }}
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
                      getThemeForScenario={getThemeForScenario}
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
              sx={{
                fontSize: "0.9375rem",
                color: theme.palette.text.secondary,
                textAlign: "center",
                maxWidth: 360,
              }}
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
                  const url = encodeShareItems(
                    shareItems,
                    hydroclimate,
                    storyItemIds,
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
  )
}
