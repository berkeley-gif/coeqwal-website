"use client"

/**
 * UnifiedToolLayout. Shared chrome for all Scenario Explorer tool views.
 *
 * Layout:
 *   [Sidebar (optional)] [Tool area (flex 1)] [Map panel (optional, 25%)]
 *
 * When sidebar is provided (non-list modes), it animates between collapsed
 * and expanded widths based on key-operations visibility.
 * When omitted (list mode), the tool area takes the full width.
 */

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { mapActions } from "../../map/store"

const SIDEBAR_WIDTH_COLLAPSED = 320
const SIDEBAR_WIDTH_EXPANDED = 480
const MAP_WIDTH_PERCENT = 25

interface UnifiedToolLayoutProps {
  sidebar?: React.ReactNode
  toolbar: React.ReactNode
  chartControls?: React.ReactNode
  children: React.ReactNode
}

export default function UnifiedToolLayout({
  sidebar,
  toolbar,
  chartControls,
  children,
}: UnifiedToolLayoutProps) {
  const theme = useTheme()
  const showMap = useScenarioExplorerStore((s) => s.showMap)
  const exploreMode = useScenarioExplorerStore((s) => s.exploreMode)
  const showKeyOperations = useScenarioExplorerStore((s) => s.showKeyOperations)

  const sidebarWidth = showKeyOperations
    ? SIDEBAR_WIDTH_EXPANDED
    : SIDEBAR_WIDTH_COLLAPSED

  useEffect(() => {
    if (showMap) {
      mapActions.setMapMode("explore")
      mapActions.setExplorePanelWidth(100 - MAP_WIDTH_PERCENT)
    } else {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }
    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
      mapActions.setExplorePanelWidth(50)
    }
  }, [showMap])

  // Clear map visualization when switching between tools so stale
  // outcome highlights from a previous tool don't persist.
  useEffect(() => {
    mapActions.clearOutcomeVisualization()
    mapActions.clearMapTooltips()
    mapActions.clearLocationHighlights()
  }, [exploreMode])

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sidebar (dynamic width, omitted for list mode) */}
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

      {/* Tool area (flex, shrinks when map is shown).
          Container query context so ToolToolbar + StrategyGrid share the same width signal.
          pointer-events:auto so tools remain interactive when map is pass-through. */}
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
        {/* Shared toolbar */}
        <Box
          sx={{
            flexShrink: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.explore.background,
          }}
        >
          {toolbar}
        </Box>

        {/* Per-panel chart controls (optional) */}
        {chartControls && <Box sx={{ flexShrink: 0 }}>{chartControls}</Box>}

        {/* Active tool content */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>{children}</Box>
      </Box>

      {/* Map reveal area — always rendered, width transitions between 0 and 25%.
          pointer-events:none so clicks pass through to the persistent map behind. */}
      <Box
        sx={{
          width: showMap ? `${MAP_WIDTH_PERCENT}%` : 0,
          flexShrink: 0,
          height: "100%",
          pointerEvents: "none",
          backgroundColor: "transparent",
          transition: "width 700ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      />
    </Box>
  )
}

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED }
