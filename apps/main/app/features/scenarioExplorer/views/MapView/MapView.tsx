"use client"

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import ListView from "../ListView/ListView"
import { learnMapActions } from "../../../../features/map/store"

/**
 * MapView
 *
 * Uses the persistent map from page level (no duplicate WebGL context).
 * Left side: Scenario selection panel
 * Right side: Persistent map shows through (positioned at z-index 0)
 *
 * The persistent map renders TierMarkers based on the store's
 * exploreTierSelection state, which this component updates.
 */
export default function MapView() {
  const theme = useTheme()

  // Activate explore map mode when this view is active
  useEffect(() => {
    learnMapActions.setMapMode("explore")
    return () => {
      learnMapActions.setMapMode("hidden")
      learnMapActions.setExploreTierSelection(null)
    }
  }, [])

  const handleTierClick = (strategy: string, outcome: string) => {
    learnMapActions.setExploreTierSelection({ strategy, outcome })
  }

  return (
    <Box
      sx={{
        display: "flex",
        // Account for header (40px) + tabs (~48px) + banner (~60px) + search (~56px) + padding
        height: "calc(100vh - 220px)",
        backgroundColor: "transparent", // Let map show through
      }}
    >
      {/* Left Panel: Scenarios (scrollable via ListView) */}
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          borderRight: theme.border.standard,
          borderColor: theme.palette.grey[300],
          backgroundColor: theme.palette.common.white,
          // Ensure this panel sits above the map
          position: "relative",
          zIndex: theme.zIndex.panels,
        }}
      >
        <ListView compact onTierClick={handleTierClick} />
      </Box>

      {/* Right Panel: The persistent map shows through here */}
      <Box
        sx={{
          width: "50%",
          height: "80vh",
          position: "relative",
          // This box is transparent so the persistent map shows through
          backgroundColor: "transparent",
        }}
      >
        {/* Info overlay */}
        <Box
          sx={{
            position: "absolute",
            top: theme.spacing(2),
            right: theme.spacing(2),
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: theme.borderRadius.rounded,
            padding: theme.spacing(2),
            boxShadow: theme.boxShadows.subtle,
            maxWidth: theme.spacing(40),
            zIndex: theme.zIndex.mapControls,
          }}
        >
          <Box
            component="p"
            sx={{
              margin: 0,
              fontSize: theme.typography.compact.subtitle.fontSize,
              color: theme.palette.text.primary,
            }}
          >
            Click on a scenario outcome in the left panel to see outcomes at
            specific locations.
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
