"use client"

/**
 * ExplorerToolView - tools surface for the Explore tab.
 *
 * Owns hover/share coordination, tour anchors, shared layout chrome,
 * and overlay siblings (keyboard shortcuts, share drawer, tool tour).
 */

import { useState } from "react"
import { Box } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"
import { useWorkspaceSlice, useDataSlice } from "./store"
import UnifiedToolView from "./tools/chrome/layout/UnifiedToolView"
import CollapsedRailStrip, {
  COLLAPSED_RAIL_WIDTH,
} from "./tools/chrome/layout/CollapsedRailStrip"
import ToolToolbar from "./tools/chrome/toolbar/ToolToolbar"
import KeyboardShortcuts from "./tools/chrome/overlays/KeyboardShortcuts"
import ShareDrawer from "./share/ShareDrawer"
import { ToolTour, TourAnchorProvider } from "./tools/tour"
import ActiveToolPanel from "./ActiveToolPanel"
import ExplorerSidebar from "./ExplorerSidebar"
import { useExploreHoverCoordination } from "./useExploreHoverCoordination"
import { useExploreShareCapture } from "./useExploreShareCapture"

export default function ExplorerToolView() {
  const exploreMode = useWorkspaceSlice((s) => s.exploreMode)
  const isListMode = exploreMode === "list"

  // Data in depth collapses its scenario sidebar to a slim strip; other
  // modes keep the fixed sidebar (collapse state is data-tool session state).
  const scenarioRailCollapsed = useDataSlice((s) => s.scenarioRailCollapsed)
  const setScenarioRailCollapsed = useDataSlice(
    (s) => s.setScenarioRailCollapsed,
  )
  const isDataMode = exploreMode === "data"
  const sidebarCollapsed = isDataMode && scenarioRailCollapsed

  const hover = useExploreHoverCoordination()
  const share = useExploreShareCapture()

  const [radarScenarioColors, setRadarScenarioColors] = useState<
    Record<string, string>
  >({})

  return (
    <TourAnchorProvider>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <UnifiedToolView
          sidebarWidth={sidebarCollapsed ? COLLAPSED_RAIL_WIDTH : undefined}
          sidebar={
            isListMode ? undefined : sidebarCollapsed ? (
              <CollapsedRailStrip
                label="Scenarios"
                ariaLabel="Expand scenarios"
                onExpand={() => setScenarioRailCollapsed(false)}
                bordered={false}
              />
            ) : (
              <ExplorerSidebar
                exploreMode={exploreMode}
                hover={hover}
                share={share}
                radarScenarioColors={radarScenarioColors}
                onCollapse={
                  isDataMode ? () => setScenarioRailCollapsed(true) : undefined
                }
              />
            )
          }
          toolbar={
            <ToolToolbar gridAligned={isListMode} hideTitle={!isListMode} />
          }
          activeTool={
            <ActiveToolPanel
              exploreMode={exploreMode}
              hover={hover}
              share={share}
              onRadarScenarioColors={setRadarScenarioColors}
            />
          }
        />
      </Box>

      <KeyboardShortcuts />
      <ErrorBoundary fallback={null}>
        <ShareDrawer />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <ToolTour />
      </ErrorBoundary>
    </TourAnchorProvider>
  )
}
