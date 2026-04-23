"use client"

/**
 * ToolToolbar. Shared toolbar rendered above the active tool content.
 *
 * Always shows: search + visibility toggle chips + view controls (outcome
 * view, map, locations, climate).
 *
 * When `gridAligned` is true (list mode), uses CSS Grid that aligns
 * with StrategyGrid columns. Otherwise uses a simple flex layout.
 */

import React, { useEffect, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  LocationOnIcon,
  Switch,
  InfoOutlinedIcon,
} from "@repo/ui/mui"
import { HydroclimateBadge } from "@repo/ui"
import { HydroclimateChooser } from "../../scenarios/components"
import { getHydroclimateBadgeDisplay } from "../hydroclimateBadgeDisplay"
import {
  useScenarioExplorerStore,
  type OutcomeDisplayMode,
  type ToolIntroMode,
} from "../store"
import { HowToReadChartModal } from "./HowToReadChartModal"

/** Modes that own a `ToolIntroStrip`. The "How to read this chart?"
 *  chip re-opens that strip for these modes instead of opening the
 *  HowToRead modal. */
const TOOL_INTRO_MODES = new Set<ToolIntroMode>(["radar", "resilience"])
function isToolIntroMode(mode: string): mode is ToolIntroMode {
  return TOOL_INTRO_MODES.has(mode as ToolIntroMode)
}

/** Temporarily hide the "How to read this chart?" entry point across
 *  all tools. The modal content is not ready for external viewing yet;
 *  the modal itself, HowToReadChartModal, and the per-tool content
 *  under howToReadContent/ are intentionally preserved. Flip this
 *  flag back to `true` to restore the chip + first-visit auto-open. */
const HOW_TO_READ_ENABLED = false

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
    seenHowToRead,
    markHowToReadSeen,
    bumpReopenToolIntro,
  } = useScenarioExplorerStore()
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const hydroBadge = getHydroclimateBadgeDisplay(hydroclimate)

  // "How to read this chart?" modal. Each tool has its own content
  // keyed by exploreMode (see HowToReadChartModal + howToReadContent/).
  //
  // Auto-open: only for modes that DON'T own a ToolIntroStrip. For
  // those (radar, resilience), the inline strip is the first-visit
  // surface; for list, the WelcomeStrip plays that role. Equity is
  // owned by another developer and gets the legacy modal flow.
  //
  // Click behavior of the toolbar chip:
  //   - radar / resilience: re-expands the inline ToolIntroStrip
  //   - everything else with content: opens the modal
  const [howToReadOpen, setHowToReadOpen] = useState(false)

  useEffect(() => {
    if (!HOW_TO_READ_ENABLED) return
    if (
      exploreMode !== "comparison" &&
      exploreMode !== "data" &&
      exploreMode !== "list" &&
      !isToolIntroMode(exploreMode) &&
      !seenHowToRead[exploreMode]
    ) {
      setHowToReadOpen(true)
      markHowToReadSeen(exploreMode)
    }
  }, [exploreMode, seenHowToRead, markHowToReadSeen])

  const handleHowToReadClick = () => {
    if (isToolIntroMode(exploreMode)) {
      bumpReopenToolIntro(exploreMode)
    } else {
      setHowToReadOpen(true)
    }
  }

  // The list view's "Outcome view" toggle (Average / Bar /
  // Distribution) is intentionally deactivated for the current demo
  // build; flip the `false &&` guard below to bring it back.

  const viewControls = (
    <>
      <Box
        sx={{
          display: "contents",
        }}
      >
        {HOW_TO_READ_ENABLED && (
          <Box
            component="button"
            type="button"
            onClick={handleHowToReadClick}
            aria-label="How to read this chart"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 0.75,
              py: 0.25,
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              background: "transparent",
              color: theme.palette.blue.bright,
              transition: "background-color 120ms",
              "&:hover": {
                background: theme.palette.interaction.selectedBackground,
              },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
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
        )}
        {/* Outcome view toggle (Average / Bar / Distribution) hidden
            for the demo. The list view reverts to its bar-chart
            default; the glyph click-through to map layers is
            unaffected. */}
        {false && exploreMode === "list" ? (
          <>
            <VerticalDivider />
            <OutcomeViewToggle
              value={outcomeDisplayMode}
              onChange={setOutcomeDisplayMode}
            />
          </>
        ) : null}
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

      <Box
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
  )

  const howToReadModal = (
    <HowToReadChartModal
      open={howToReadOpen}
      onClose={() => setHowToReadOpen(false)}
      exploreMode={exploreMode}
    />
  )

  if (gridAligned) {
    const SM = 600
    const FULL = theme.scenarios.grid.fullBreakpoint

    return (
      <>
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
      {howToReadModal}
      </>
    )
  }

  // Non-list modes: search + chips live in the sidebar, toolbar only has view controls
  return (
    <>
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
      {howToReadModal}
    </>
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
