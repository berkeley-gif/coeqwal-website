"use client"

/**
 * ToolToolbar. Shared toolbar rendered above the active tool content.
 *
 * Always shows: search + visibility toggle chips + view controls (map,
 * distribution, locations, climate).
 *
 * When `gridAligned` is true (list mode), uses CSS Grid that aligns
 * with StrategyGrid columns. Otherwise uses a simple flex layout.
 */

import React from "react"
import { Box, Typography, useTheme, LocationOnIcon, Switch } from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"
import { useScenarioExplorerStore } from "../store"

interface ToolToolbarProps {
  gridAligned?: boolean
}

export default function ToolToolbar({ gridAligned }: ToolToolbarProps) {
  const theme = useTheme()
  const {
    hydroclimate,
    setHydroclimate,
    showMap,
    setShowMap,
    outcomeDisplayMode,
    setOutcomeDisplayMode,
    showLocationPicker,
    setShowLocationPicker,
    showKeyOperations,
  } = useScenarioExplorerStore()

  const viewControls = (
    <>
      <Box
        component="button"
        type="button"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: theme.palette.text.primary,
        }}
      >
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          How to read this chart?
        </Typography>
      </Box>

      <VerticalDivider />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          Show distribution
        </Typography>
        <Switch
          size="small"
          checked={outcomeDisplayMode === "distribution"}
          onChange={(_, checked) =>
            setOutcomeDisplayMode(checked ? "distribution" : "summary")
          }
          sx={{ ml: -0.5 }}
        />
      </Box>

      <VerticalDivider />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          Show map
        </Typography>
        <Switch
          size="small"
          checked={showMap}
          onChange={(_, checked) => setShowMap(checked)}
          sx={{ ml: -0.5 }}
        />
      </Box>

      <VerticalDivider />

      <Box
        component="button"
        type="button"
        onClick={() => setShowLocationPicker(!showLocationPicker)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: theme.palette.text.primary,
        }}
      >
        <LocationOnIcon sx={{ fontSize: "1.25rem" }} />
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          Choose locations to track
        </Typography>
      </Box>

      <VerticalDivider />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          View by climate
        </Typography>
        <HydroclimateChooser
          layout="horizontal"
          showTitle={false}
          showLabels={false}
          hideDisabled
          iconSize="28px"
          iconFontSize="1rem"
          value={hydroclimate}
          onChange={setHydroclimate}
        />
      </Box>
    </>
  )

  if (gridAligned) {
    const SM = 600
    const FULL = theme.scenarios.grid.fullBreakpoint

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: theme.scenarios.grid.columns.xs,
          [`@container strategy-grid (min-width: ${SM}px)`]: {
            gridTemplateColumns: showKeyOperations
              ? "32px minmax(0, 600px) 140px 1fr"
              : "32px minmax(0, 600px) 0px 1fr",
          },
          [`@container strategy-grid (min-width: ${FULL}px)`]: {
            gridTemplateColumns: showKeyOperations
              ? theme.scenarios.grid.columns.full
              : "32px 0.382fr 0px 1fr",
          },
          transition: "grid-template-columns 300ms ease",
          columnGap: theme.scenarios.grid.gap.default,
          px: theme.space.tool.px,
          py: 0.5,
          minHeight: 44,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            gridColumn: "1 / -1",
            [`@container strategy-grid (min-width: ${SM}px)`]: {
              gridColumn: "1 / 4",
            },
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              lineHeight: 1.3,
              color: theme.palette.text.primary,
            }}
          >
            Scenario library
          </Typography>
        </Box>

        <Box
          sx={{
            gridColumn: "1 / -1",
            borderLeft: "none",
            [`@container strategy-grid (min-width: ${SM}px)`]: {
              gridColumn: "4",
              borderLeft: `1px solid rgba(0,0,0,0.2)`,
            },
            display: "flex",
            alignItems: "center",
            alignSelf: "stretch",
            gap: 2,
            pl: theme.scenarios.grid.divider.gap,
          }}
        >
          {viewControls}
        </Box>
      </Box>
    )
  }

  // Non-list modes: search + chips live in the sidebar, toolbar only has view controls
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        py: 0.5,
        minHeight: 44,
        flexWrap: "wrap",
      }}
    >
      {viewControls}
    </Box>
  )
}

function VerticalDivider() {
  const theme = useTheme()
  return (
    <Box
      sx={{
        width: "1px",
        height: 24,
        backgroundColor: theme.palette.divider,
        flexShrink: 0,
      }}
    />
  )
}
