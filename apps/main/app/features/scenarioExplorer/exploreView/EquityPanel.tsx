"use client"

/**
 * EquityPanel - Left panel for equity tool
 *
 * This panel provides:
 * - Search bar
 * - Hydroclimate chooser
 * - Expandable modal view
 *
 * The map is displayed on the right side (handled by ScenarioExplorer layout).
 */

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  icons,
} from "@repo/ui/mui"
import { MobileModal, CompactSearchBar } from "@repo/ui"
import SelectionBanner from "../components/SelectionBanner"
import { ViewModeControls } from "../components/ViewModeControls"
import { mapActions } from "../../map/store"

export default function EquityPanel() {
  const theme = useTheme()

  // Local UI state
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Activate map when this panel is mounted
  useEffect(() => {
    mapActions.setMapMode("explore")

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()
    }
  }, [])

  // Toolbar with search + hydroclimate chooser
  const toolbar = (
    <CompactSearchBar
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search..."
      inputMaxWidth="165px"
      leftContent={
        !isExpanded && (
          <Tooltip title="Expand" arrow>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(true)}
              sx={{
                color: theme.palette.grey[500],
                "&:hover": {
                  color: theme.palette.grey[700],
                  backgroundColor: "rgba(0,0,0,0.04)",
                },
              }}
            >
              <icons.OpenInFull sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )
      }
      rightContent={<ViewModeControls />}
    />
  )

  // Panel content (shared between viewport and expanded views)
  const panelContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Selection banner */}
      <SelectionBanner />

      {/* Search toolbar */}
      <Box
        sx={{
          flexShrink: 0,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {toolbar}
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: "20px",
          py: theme.space.component.lg,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        {/* Placeholder for equity tool content */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.grey[500],
              mb: theme.space.component.md,
            }}
          >
            Equity tool
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.grey[400] }}
          >
            Awesome tool stuff will go here.
            <br />
            Map should be on the right.
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <>
      {/* Viewport view */}
      <Box
        sx={{
          display: isExpanded ? "none" : "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {panelContent}
      </Box>

      {/* Expanded modal view */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            component="span"
            sx={{
              ...theme.typography.subtitle2,
              color: theme.palette.text.primary,
            }}
          >
            Equity tool
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel="Equity tool expanded view"
      >
        <Box
          sx={{
            height: "80vh",
            overflow: "hidden",
          }}
        >
          {panelContent}
        </Box>
      </MobileModal>
    </>
  )
}
