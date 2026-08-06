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
import { HydroclimateBadge } from "@repo/ui"
import { useWorkspaceSlice, isMapPairedMode } from "../../../store"
import { mapActions } from "../../../../../map/store"
import { getHydroclimateBadgeDisplay } from "../utils/hydroclimateBadgeDisplay"
import ToolJourneyStrip from "./ToolJourneyStrip"

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
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)

  const mapHydroBadge = getHydroclimateBadgeDisplay(hydroclimate)

  // The map panel opens only for tools that pair with the map: Data in
  // depth ignores the shared showMap flag entirely (no map, full width).
  const mapActive = showMap && isMapPairedMode(exploreMode)

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
      mapActions.setExplorePanelWidth(50)
    }
  }, [])

  // Clear map visualization when switching between tools so stale
  // outcome highlights from a previous tool don't persist.
  useEffect(() => {
    mapActions.clearOutcomeVisualization()
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
        {mapActive && mapHydroBadge && (
          <Box
            sx={{
              position: "absolute",
              top: theme.spacing(1),
              left: theme.spacing(1),
              right: theme.spacing(1),
              zIndex: 2,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <HydroclimateBadge
              title={mapHydroBadge.title}
              accentColor={mapHydroBadge.accentColor}
              surface="solid"
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED }
