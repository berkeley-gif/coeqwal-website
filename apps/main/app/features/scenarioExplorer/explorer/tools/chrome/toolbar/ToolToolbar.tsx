"use client"

/**
 * ToolToolbar. Shared toolbar rendered above the active tool content.
 *
 * When `gridAligned` is true (list mode), uses CSS Grid that aligns
 * with StrategyGrid columns. Otherwise uses a flex layout.
 */

import React, { useCallback } from "react"
import { Box, Typography, useTheme, LocationOnIcon, Switch } from "@repo/ui/mui"
import { HydroclimateBadge } from "@repo/ui"
import { HydroclimateChooser } from "../../../../../scenarios/components"
import { getHydroclimateBadgeDisplay } from "../hydroclimateBadgeDisplay"
import { useExplorerStore, type OutcomeDisplayMode } from "../../../store"
import { useTourAnchor } from "../../tour/TourAnchorContext"

interface ToolToolbarProps {
  gridAligned?: boolean
  hideTitle?: boolean
}

export default function ToolToolbar({
  gridAligned,
  hideTitle,
}: ToolToolbarProps) {
  const theme = useTheme()
  const {
    hydroclimate,
    setHydroclimate,
    showMap,
    setShowMap,
    outcomeDisplayMode,
    setOutcomeDisplayMode,
    showKeyOperations,
    exploreMode,
  } = useExplorerStore()

  const showToolbarHydroclimateChooser = exploreMode !== "resilience"

  const hydroBadge = getHydroclimateBadgeDisplay(hydroclimate)

  // Register the climate-chip group as a tour anchor for the radar
  // tour. Resilience reuses this control too but its tour does not
  // step through it, so a single id is fine.
  const climateChipsAnchorRef = useTourAnchor("radar.climateChips")
  const listMapTourRef = useTourAnchor("list.toolbar.map")
  const listClimateTourRef = useTourAnchor("list.toolbar.climate")
  // High-level orientation anchor for the list tour: the whole strip
  // of view controls (hydroclimate, map, etc.) on the right side of
  // the toolbar. Registered only in list mode so it does not collide
  // with the equivalent radar orientation (which uses ChartControlsBar).
  const listViewAreaTourRef = useTourAnchor("list.viewArea")
  // Same strip of view controls, but in radar mode the toolbar is
  // rendered as a plain row (not the list grid), so we anchor the
  // radar orientation popper on that row directly.
  const radarViewAreaTourRef = useTourAnchor("radar.viewArea")
  // One DOM node serves both the Radar climate-chip tour and the new
  // List hydroclimate tour step. Merge callback refs so both registries
  // resolve to the same element without re-wrapping the chooser.
  const climateMergedRef = useCallback(
    (el: HTMLElement | null) => {
      climateChipsAnchorRef(el)
      if (exploreMode === "list") listClimateTourRef(el)
    },
    [climateChipsAnchorRef, listClimateTourRef, exploreMode],
  )

  // The list view's "Outcome view" toggle (Average / Bar /
  // Distribution) is intentionally deactivated for the current demo
  // build. Flip the `false &&` guard below to bring it back.

  const viewControls = (
    <>
      <Box
        sx={{
          display: "contents",
        }}
      >
        {/* Outcome view toggle (Average / Bar / Distribution) hidden
            . The list view reverts to its bar-chart
            default. The glyph click-through to map layers is
            unaffected. */}
        {/* eslint-disable-next-line no-constant-condition, no-constant-binary-expression */}
        {false && exploreMode === "list" ? (
          <>
            <VerticalDivider />
            <OutcomeViewToggle
              value={outcomeDisplayMode}
              onChange={setOutcomeDisplayMode}
            />
            <VerticalDivider />
          </>
        ) : null}
      </Box>

      <Box
        ref={exploreMode === "list" ? listMapTourRef : undefined}
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
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

      {showToolbarHydroclimateChooser && (
        <>
          <VerticalDivider />

          <Box
            ref={climateMergedRef}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              flexWrap: "wrap",
            }}
          >
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
            {!showMap && hydroBadge && (
              <HydroclimateBadge
                title={hydroBadge.title}
                accentColor={hydroBadge.accentColor}
              />
            )}
          </Box>
        </>
      )}
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
          ref={listViewAreaTourRef}
          sx={{
            gridColumn: "1 / -1",
            pl: 0,
            ...(!hideTitle && {
              [`@container strategy-grid (min-width: ${FULL}px)`]: {
                gridColumn: "4",
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
  const nonListViewAreaRef =
    exploreMode === "radar" ? radarViewAreaTourRef : undefined
  return (
    <Box
      ref={nonListViewAreaRef}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: theme.space.tool.px,
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

function OutcomeViewToggle({
  value,
  onChange,
}: {
  value: OutcomeDisplayMode
  onChange: (mode: OutcomeDisplayMode) => void
}) {
  const theme = useTheme()
  const options: Array<{ id: OutcomeDisplayMode; label: string }> = [
    { id: "average", label: "Average" },
    { id: "bar", label: "Bar" },
    { id: "distribution", label: "Distribution" },
  ]

  return (
    <Box
      role="group"
      aria-label="Outcome view"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        flexWrap: "wrap",
      }}
    >
      <Typography
        variant="dashboard"
        sx={{
          fontWeight: 500,
          color: theme.palette.text.primary,
          whiteSpace: "nowrap",
        }}
      >
        Outcome view
      </Typography>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          p: 0.25,
          borderRadius: theme.borderRadius.circle,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {options.map((option) => {
          const active = option.id === value
          return (
            <Box
              key={option.id}
              component="button"
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              sx={{
                minWidth: option.id === "distribution" ? 96 : 72,
                px: 1.25,
                py: 0.5,
                border: "none",
                borderRadius: theme.borderRadius.circle,
                backgroundColor: active
                  ? theme.palette.blue.bright
                  : "transparent",
                color: active
                  ? theme.palette.common.white
                  : theme.palette.text.primary,
                cursor: "pointer",
                font: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: "nowrap",
                transition: "background-color 120ms, color 120ms",
                "&:hover": {
                  backgroundColor: active
                    ? theme.palette.blue.dark
                    : theme.palette.action.hover,
                },
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.blue.bright}`,
                  outlineOffset: 1,
                },
              }}
            >
              {option.label}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
