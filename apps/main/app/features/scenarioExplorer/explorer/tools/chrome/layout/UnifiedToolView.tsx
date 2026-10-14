"use client"

/**
 * UnifiedToolView - shared layout shell for all explorer tools.
 *
 * Layout:
 *   [Sidebar (optional)] [Tool area (flex 1)] [Map panel (optional, 25%)]
 *
 * The activeTool slot holds the tool (controls + panel) from
 * ActiveToolPanel. When sidebar is omitted (list mode), the tool area
 * spans full width.
 */

import React, { useEffect, useRef, useState } from "react"
import { Box, useTheme, DragIndicatorIcon } from "@repo/ui/mui"
import { useWorkspaceSlice, isMapPairedMode } from "../../../store"
import {
  mapActions,
  useDistributionMapSnapshot,
} from "../../../../../map/store"
import ToolJourneyStrip from "./ToolJourneyStrip"
import MapFigureCaption from "./MapFigureCaption"
import MapDirectionLegend from "../../../share/cards/MapDirectionLegend"
import {
  BASEMAP_PICKER_BOTTOM_PX,
  BASEMAP_PICKER_HEIGHT_PX,
} from "../../../../../map/controls/BasemapPicker"
import { TAB_WIDTH as SHARE_TAB_WIDTH } from "../../../share/ShareDrawer"

const SIDEBAR_WIDTH_COLLAPSED = 320
const SIDEBAR_WIDTH_EXPANDED = 480
const MAP_WIDTH_PERCENT = 25
const MIN_TOOL_VISIBLE_PX = 130

interface UnifiedToolViewProps {
  sidebar?: React.ReactNode
  toolbar: React.ReactNode
  activeTool: React.ReactNode
  /** Overrides the standard sidebar width (collapsed-rail strip mode) */
  sidebarWidth?: number
}

export default function UnifiedToolView({
  sidebar,
  toolbar,
  activeTool,
  sidebarWidth: sidebarWidthOverride,
}: UnifiedToolViewProps) {
  const theme = useTheme()
  const showMap = useWorkspaceSlice((s) => s.showMap)
  const containerRef = useRef<HTMLDivElement>(null)
  // null = "use the default MAP_WIDTH_PERCENT"; a number means the user has dragged it.
  const [mapWidthPx, setMapWidthPx] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const exploreMode = useWorkspaceSlice((s) => s.exploreMode)
  const showKeyOperations = useWorkspaceSlice((s) => s.showKeyOperations)
  const distributionSnapshot = useDistributionMapSnapshot()

  // The map panel opens only for tools that pair with the map: Data in
  // depth ignores the shared showMap flag entirely (no map, full width).
  const mapActive = showMap && isMapPairedMode(exploreMode)

  // Distribution's comparison-mode pins use triangle-up/square/triangle-down
  // to encode improved/no-change/worsened (see EquityPanel's handleShowOnMap).
  // The key follows the painted markers: it shows once markers carry a
  // comparison, not while the baseline is still loading or nothing is
  // selected.
  const showComparisonLegend =
    mapActive &&
    exploreMode === "equity" &&
    !!distributionSnapshot?.comparedWithBaseline

  const sidebarWidth =
    sidebarWidthOverride ??
    (showKeyOperations ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED)

  // Keep map mode + panel width in sync with the effective map state
  useEffect(() => {
    if (mapActive) {
      mapActions.setMapMode("explore")
    } else {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
      mapActions.setExplorePanelWidth(50)
      setMapWidthPx(null) // reset drag width so it reopens at the default
    }
  }, [mapActive])

  // Keep the map camera's padding synced to whatever width is currently shown,
  // whether that's the default 25% or a width the user dragged to.
  useEffect(() => {
    if (!mapActive) return
    const containerWidth =
      containerRef.current?.clientWidth ?? window.innerWidth
    const widthPx = mapWidthPx ?? containerWidth * (MAP_WIDTH_PERCENT / 100)
    mapActions.setExplorePanelWidth(100 - (widthPx / containerWidth) * 100)
  }, [mapActive, mapWidthPx])

  useEffect(() => {
    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
      mapActions.setDistributionMapSnapshot(null)
      mapActions.setExplorePanelWidth(50)
    }
  }, [])

  // Clear map visualization when switching between tools so stale
  // outcome highlights from a previous tool don't persist.
  useEffect(() => {
    mapActions.clearOutcomeVisualization()
    mapActions.setDistributionMapSnapshot(null)
    mapActions.clearMapTooltips()
  }, [exploreMode])

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    const startX = e.clientX
    const startWidthPx =
      mapWidthPx ?? containerWidth * (MAP_WIDTH_PERCENT / 100)
    const minWidthPx = containerWidth * (MAP_WIDTH_PERCENT / 100)
    const maxWidthPx = containerWidth - sidebarWidth - MIN_TOOL_VISIBLE_PX

    setIsDragging(true)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Dragging left (pointer moves toward the tool area) grows the map.
      const deltaX = startX - moveEvent.clientX
      const nextWidthPx = Math.min(
        maxWidthPx,
        Math.max(minWidthPx, startWidthPx + deltaX),
      )
      setMapWidthPx(nextWidthPx)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {sidebar && (
        <Box
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            transition: "width 300ms ease, border-right 300ms ease",
            pointerEvents: "auto",
          }}
        >
          {sidebar}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          minWidth: 0,
          backgroundColor: theme.palette.background.paper,
          transition: "flex 700ms cubic-bezier(0.25, 0.1, 0.25, 1)",
          containerType: "inline-size",
          containerName: "strategy-grid",
          pointerEvents: "auto",
        }}
      >
        <Box sx={{ flexShrink: 0 }}>
          <ToolJourneyStrip mode={exploreMode} />
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.explore.background,
          }}
        >
          {toolbar}
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden" }}>{activeTool}</Box>
      </Box>

      <Box
        data-explore-map-panel=""
        sx={{
          position: "relative",
          width: mapActive ? (mapWidthPx ?? `${MAP_WIDTH_PERCENT}%`) : 0,
          flexShrink: 0,
          height: "100%",
          pointerEvents: "none",
          backgroundColor: "transparent",
          // Skip the transition while actively dragging so the width follows
          // the pointer 1:1 instead of lagging behind it.
          transition: isDragging
            ? "none"
            : "width 700ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        {mapActive && (
          <Box
            onPointerDown={handleResizeStart}
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 16,
              cursor: "col-resize",
              pointerEvents: "auto", // opt back in, overriding the parent's "none"
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.palette.background.toolPanel,
              boxShadow: theme.shadows[2],
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 40,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[2],
                color: theme.palette.text.primary,
              }}
            >
              <DragIndicatorIcon sx={{ fontSize: "1.25rem" }} />
            </Box>
          </Box>
        )}
        {mapActive && (
          <Box
            sx={{
              position: "absolute",
              top: theme.spacing(1),
              // Clear the 16 px drag handle on the panel's left edge and the
              // Share tab pinned to the window's right edge.
              left: theme.spacing(3),
              right: `calc(${SHARE_TAB_WIDTH}px + ${theme.spacing(1)})`,
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <MapFigureCaption />
          </Box>
        )}
        {showComparisonLegend && (
          <Box
            sx={{
              position: "absolute",
              // Sit above the basemap picker at the bottom of the map.
              bottom: `calc(${BASEMAP_PICKER_BOTTOM_PX + BASEMAP_PICKER_HEIGHT_PX}px + ${theme.spacing(1)})`,
              left: theme.spacing(1),
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "6px",
              px: 1.5,
              py: 1,
              boxShadow: theme.shadows[2],
              pointerEvents: "none",
            }}
          >
            <MapDirectionLegend />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED }
