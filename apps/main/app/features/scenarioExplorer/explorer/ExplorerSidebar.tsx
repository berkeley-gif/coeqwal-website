"use client"

import ScenarioSelectionSidebar from "./tools/chrome/sidebar/ScenarioSelectionSidebar"
import type { ExploreMode } from "./store"
import type { ExploreHover } from "./useExploreHoverCoordination"
import type { ExploreShareCapture } from "./useExploreShareCapture"

type ExplorerSidebarProps = {
  exploreMode: ExploreMode
  hover: ExploreHover
  share: ExploreShareCapture
  radarScenarioColors: Record<string, string>
}

export default function ExplorerSidebar({
  exploreMode,
  hover,
  share,
  radarScenarioColors,
}: ExplorerSidebarProps) {
  return (
    <ScenarioSelectionSidebar
      scenarioColors={
        exploreMode === "radar" ? radarScenarioColors : undefined
      }
      hoveredInteraction={hover.hoveredInteraction}
      onRowHover={hover.onSidebarRowHover}
      singleSelect={exploreMode === "equity"}
      {...(exploreMode === "radar"
        ? {
            ...share.radar.sidebarProps,
            shareDisabled: !share.radar.canShareFromSidebar,
            shareDisabledTooltip: "Select at least one axis to share",
          }
        : {})}
      {...(exploreMode === "equity" ? share.equity.sidebarProps : {})}
      {...(exploreMode === "resilience" ? share.resilience.sidebarProps : {})}
    />
  )
}
