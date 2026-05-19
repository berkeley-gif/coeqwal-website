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

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { HydroclimateBadge } from "@repo/ui"
import { useWorkspaceSlice } from "../../../store"
import { mapActions } from "../../../../../map/store"
import { getHydroclimateBadgeDisplay } from "../utils/hydroclimateBadgeDisplay"
import ToolJourneyStrip from "./ToolJourneyStrip"

const SIDEBAR_WIDTH_COLLAPSED = 320
const SIDEBAR_WIDTH_EXPANDED = 480
const MAP_WIDTH_PERCENT = 25

interface UnifiedToolViewProps {
  sidebar?: React.ReactNode
  toolbar: React.ReactNode
  activeTool: React.ReactNode
}

export default function UnifiedToolView({
  sidebar,
  toolbar,
  activeTool,
}: UnifiedToolViewProps) {
  const theme = useTheme()
  const showMap = useWorkspaceSlice((s) => s.showMap)
  const exploreMode = useWorkspaceSlice((s) => s.exploreMode)
  const showKeyOperations = useWorkspaceSlice((s) => s.showKeyOperations)
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)

  const mapHydroBadge = getHydroclimateBadgeDisplay(hydroclimate)

  const sidebarWidth = showKeyOperations
    ? SIDEBAR_WIDTH_EXPANDED
    : SIDEBAR_WIDTH_COLLAPSED

  // Keep map mode + panel width in sync with showMap
  useEffect(() => {
    if (showMap) {
      mapActions.setMapMode("explore")
      mapActions.setExplorePanelWidth(100 - MAP_WIDTH_PERCENT)
    } else {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
      mapActions.setExplorePanelWidth(50)
    }
  }, [showMap])

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

  return (
    <Box
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
        {exploreMode !== "data" && (
          <Box sx={{ flexShrink: 0 }}>
            <ToolJourneyStrip mode={exploreMode} />
          </Box>
        )}

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
          width: showMap ? `${MAP_WIDTH_PERCENT}%` : 0,
          flexShrink: 0,
          height: "100%",
          pointerEvents: "none",
          backgroundColor: "transparent",
          transition: "width 700ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        {showMap && mapHydroBadge && (
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
