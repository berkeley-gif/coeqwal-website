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

import React, { useState } from "react"
import { Box, Typography, useTheme, LocationOnIcon, Switch } from "@repo/ui/mui"
import { HydroclimateBadge } from "@repo/ui"
import { HydroclimateChooser } from "../../scenarios/components"
import { getHydroclimateBadgeDisplay } from "../hydroclimateBadgeDisplay"
import { useScenarioExplorerStore } from "../store"
import { HowToReadChartModal } from "./HowToReadChartModal"

interface ToolToolbarProps {
  gridAligned?: boolean
  hideTitle?: boolean
}

export default function ToolToolbar({
  gridAligned,
  hideTitle,
}: ToolToolbarProps) {
  const theme = useTheme()
  /* eslint-disable @typescript-eslint/no-unused-vars */
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
    exploreMode,
  } = useScenarioExplorerStore()
  /* eslint-enable @typescript-eslint/no-unused-vars */

  // TODO: re-enable high climate risk in radar once it has complete data
  const radarDisabledClimates =
    exploreMode === "radar" ? new Set(["cc95"]) : undefined

  const hydroBadge = getHydroclimateBadgeDisplay(hydroclimate)

  const [howToReadOpen, setHowToReadOpen] = useState(false)

  const viewControls = (
    <>
      <Box
        sx={{
          display: "none",
          "@media (min-width: 1475px)": {
            display: "contents",
          },
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => setHowToReadOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={howToReadOpen}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            p: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: theme.palette.text.primary,
            font: "inherit",
            textDecoration: "none",
            transition: "color 120ms",
            "&:hover": {
              color: theme.palette.blue.bright,
            },
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.blue.bright}`,
              outlineOffset: 2,
              borderRadius: theme.borderRadius.sm,
            },
          }}
        >
          <Typography
            variant="dashboard"
            sx={{
              fontWeight: 500,
              whiteSpace: "nowrap",
              color: "inherit",
            }}
          >
            How to read this chart?
          </Typography>
        </Box>

        {/* Show distribution — temporarily hidden
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
        */}

        <VerticalDivider />
      </Box>

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
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "grey.400",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <LocationOnIcon sx={{ fontSize: "1.25rem", color: "inherit" }} />
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 500,
            whiteSpace: "nowrap",
            color: "inherit",
          }}
        >
          Choose locations to track
        </Typography>
      </Box>

      <VerticalDivider />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
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
          disabledValues={radarDisabledClimates}
        />
        {!showMap && hydroBadge && (
          <HydroclimateBadge
            title={hydroBadge.title}
            accentColor={hydroBadge.accentColor}
          />
        )}
      </Box>
      <HowToReadChartModal
        open={howToReadOpen}
        onClose={() => setHowToReadOpen(false)}
        exploreMode={exploreMode}
      />
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
        {!hideTitle && (
          <Box
            sx={{
              gridColumn: "1 / -1",
              [`@container strategy-grid (min-width: ${SM}px)`]: {
                gridColumn: "1 / 4",
              },
              display: "none",
              [`@container strategy-grid (min-width: ${FULL}px)`]: {
                display: "flex",
              },
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
        )}

        <Box
          sx={{
            gridColumn: "1 / -1",
            borderLeft: "none",
            pl: 0,
            ...(!hideTitle && {
              [`@container strategy-grid (min-width: ${FULL}px)`]: {
                gridColumn: "4",
                borderLeft: `1px solid rgba(0,0,0,0.2)`,
                pl: theme.scenarios.grid.divider.gap,
              },
            }),
            display: "flex",
            alignItems: "center",
            alignSelf: "stretch",
            gap: 2,
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
