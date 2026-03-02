"use client"

/**
 * ListPanel - Container for the scenario list in explore view
 *
 * This panel wraps ListView and manages map mode effects. In the explore view:
 * - List mode: ListPanel fills the full width
 * - Map mode: ListPanel shows in compact mode on the right, map appears on the left
 * - Comparison mode: ComparisonPanel shows on the left, ListPanel shows on the right
 *
 * The actual map visualization is rendered at a higher level in the app and
 * controlled via mapActions from the map store.
 */

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import ListView from "./ListView"
import { mapActions, useActiveOutcomeVisualization } from "../../map/store"
import { useScenarioExplorerStore } from "../store"

interface ListPanelProps {
  /** When provided, controls the expanded modal externally */
  isExpanded?: boolean
  /** Callback to close the expanded modal */
  onCloseExpand?: () => void
  /** Toolbar content to render inside the expanded modal */
  modalToolbar?: React.ReactNode
}

export default function ListPanel({
  isExpanded,
  onCloseExpand,
  modalToolbar,
}: ListPanelProps) {
  const theme = useTheme()

  // Get state from store
  const { exploreMode } = useScenarioExplorerStore()

  const currentVisualization = useActiveOutcomeVisualization()

  useEffect(() => {
    if (exploreMode === "map") {
      mapActions.setMapMode("explore")
    } else {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }
  }, [exploreMode])

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
          exploreMode === "list"
            ? theme.palette.grey[100]
            : theme.palette.background.paper,
      }}
    >
      <ListView
        compact={exploreMode === "map"}
        onTierClick={exploreMode === "map" ? handleTierClick : undefined}
        isExpanded={isExpanded}
        onCloseExpand={onCloseExpand}
        modalToolbar={modalToolbar}
      />
    </Box>
  )
}
