"use client"

/**
 * UnifiedExploreView - Left panel content for scenario exploration
 *
 * Renders the ListView and manages map mode effects.
 * The right panel (comparison chart / map) is rendered separately
 * by ScenarioExplorer at a higher layout level.
 */

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import ListView from "./ListView"
import { mapActions, useActiveOutcomeVisualization } from "../../map/store"

export type ExploreMode = "list" | "map" | "comparison"

interface UnifiedExploreViewProps {
  mode: ExploreMode
  pinnedScenarioId?: string | null
  /** When provided, controls the expanded modal externally */
  isExpanded?: boolean
  /** Callback to close the expanded modal */
  onCloseExpand?: () => void
  /** Toolbar content to render inside the expanded modal */
  modalToolbar?: React.ReactNode
}

export default function UnifiedExploreView({
  mode,
  pinnedScenarioId,
  isExpanded,
  onCloseExpand,
  modalToolbar,
}: UnifiedExploreViewProps) {
  const theme = useTheme()

  const currentVisualization = useActiveOutcomeVisualization()

  useEffect(() => {
    if (mode === "map") {
      mapActions.setMapMode("explore")
    } else {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }
  }, [mode])

  const handleTierClick = (scenarioId: string, outcomeCode: string) => {
    mapActions.clearMapTooltips()

    const isSameSelection =
      currentVisualization?.scenarioId === scenarioId &&
      currentVisualization?.outcomeCode === outcomeCode

    if (isSameSelection) {
      mapActions.clearOutcomeVisualization()
    } else {
      mapActions.setOutcomeVisualization(outcomeCode, scenarioId)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor:
          mode === "list"
            ? theme.palette.grey[100]
            : theme.palette.background.paper,
      }}
    >
      <ListView
        compact={mode !== "list"}
        onTierClick={mode === "map" ? handleTierClick : undefined}
        pinnedScenarioId={pinnedScenarioId}
        isExpanded={isExpanded}
        onCloseExpand={onCloseExpand}
        modalToolbar={modalToolbar}
      />
    </Box>
  )
}
