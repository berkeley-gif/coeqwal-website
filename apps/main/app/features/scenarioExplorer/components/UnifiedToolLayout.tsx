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
import { HydroclimateBadge } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"
import { mapActions } from "../../map/store"
import { getHydroclimateBadgeDisplay } from "../hydroclimateBadgeDisplay"
import ToolJourneyStrip from "./ToolJourneyStrip"

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
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)

  const mapHydroBadge = getHydroclimateBadgeDisplay(hydroclimate)

  const sidebarWidth = showKeyOperations
    ? SIDEBAR_WIDTH_EXPANDED
    : SIDEBAR_WIDTH_COLLAPSED

  // Keep map mode + panel width in sync with showMap. Previously this
  // effect's cleanup function ran on every showMap change (firing
  // hidden/clear/50 before the body then set the real values), which
  // produced 5-6 synchronous mapStore writes per toggle and amplified
  // the render cascade that trips React #185. Splitting into a
  // dependency-driven effect plus an unmount-only cleanup drops the
  // toggle cost to 2-3 writes.
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
        {/* Chart title row. Renders the chart name on the left, the
            purpose tagline next to it, and the "next step" CTA on the
            right. Sits at the very top of the tool column, above the
            optional welcome strip and the shared toolbar, so the
            chart's identity is the first thing under ExploreSubNav.
            Hidden in research-only modes (comparison, data) where the
            journey metadata is intentionally sparse. */}
        {exploreMode !== "comparison" && exploreMode !== "data" && (
          <Box sx={{ flexShrink: 0 }}>
            <ToolJourneyStrip mode={exploreMode} />
          </Box>
        )}

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

      {/* Map reveal area - always rendered, width transitions between 0 and 25%.
          pointer-events:none so clicks pass through to the persistent map behind. */}
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
