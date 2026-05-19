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
import { useWorkspaceSlice } from "./store"
import UnifiedToolView from "./tools/chrome/layout/UnifiedToolView"
import ToolToolbar from "./tools/chrome/toolbar/ToolToolbar"
import KeyboardShortcuts from "./tools/chrome/overlays/KeyboardShortcuts"
import ToolTour from "./tools/chrome/overlays/ToolTour"
import ShareDrawer from "./share/ShareDrawer"
import { TourAnchorProvider } from "./tools/tour/TourAnchorContext"
import ActiveToolPanel from "./ActiveToolPanel"
import ExplorerSidebar from "./ExplorerSidebar"
import { useExploreHoverCoordination } from "./useExploreHoverCoordination"
import { useExploreShareCapture } from "./useExploreShareCapture"

export default function ExplorerToolView() {
  const exploreMode = useWorkspaceSlice((s) => s.exploreMode)
  const isListMode = exploreMode === "list"

  const hover = useExploreHoverCoordination()
  const share = useExploreShareCapture()

  const [radarScenarioColors, setRadarScenarioColors] = useState<
    Record<string, string>
  >({})

  return (
    <TourAnchorProvider>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <UnifiedToolView
          sidebar={
            isListMode ? undefined : (
              <ExplorerSidebar
                exploreMode={exploreMode}
                hover={hover}
                share={share}
                radarScenarioColors={radarScenarioColors}
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
