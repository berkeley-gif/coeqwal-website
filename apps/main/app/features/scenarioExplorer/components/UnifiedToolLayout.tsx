"use client"

/**
 * UnifiedToolLayout — Persistent three-panel chrome for the Scenario Explorer.
 *
 * Layout:
 *   [Sidebar (dynamic width)] [Tool area (flex 1)] [Map panel (optional, 1/3)]
 *
 * Sidebar width animates between collapsed and expanded states based on
 * whether the key operations column is visible.
 */

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { mapActions } from "../../map/store"

const SIDEBAR_WIDTH_COLLAPSED = 320
const SIDEBAR_WIDTH_EXPANDED = 480
const MAP_WIDTH_PERCENT = 25

interface UnifiedToolLayoutProps {
  sidebar: React.ReactNode
  toolbar: React.ReactNode
  children: React.ReactNode
}

export default function UnifiedToolLayout({
  sidebar,
  toolbar,
  children,
}: UnifiedToolLayoutProps) {
  const theme = useTheme()
  const showMap = useScenarioExplorerStore((s) => s.showMap)
  const showKeyOperations = useScenarioExplorerStore(
    (s) => s.showKeyOperations,
  )

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

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sidebar (dynamic width, always visible) */}
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
          transition: "width 300ms ease",
        }}
      >
        {sidebar}
      </Box>

      {/* Tool area (flex, shrinks when map is shown) */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          minWidth: 0,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* Shared toolbar */}
        <Box
          sx={{
            flexShrink: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {toolbar}
        </Box>

        {/* Active tool content */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>{children}</Box>
      </Box>

      {/* Map reveal area — transparent so the persistent fixed-position map shows through */}
      {showMap && (
        <Box
          sx={{
            width: `${MAP_WIDTH_PERCENT}%`,
            flexShrink: 0,
            height: "100%",
            pointerEvents: "auto",
            backgroundColor: "transparent",
          }}
        />
      )}
    </Box>
  )
}

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED }
