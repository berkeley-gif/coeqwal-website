"use client"

/**
 * ToolToolbar. Shared toolbar rendered above the active tool content.
 *
 * Layout (left to right):
 * 1. "Show map" toggle (label + MUI Switch)
 * 2. "Show distribution" toggle (label + MUI Switch)
 * 3. "Choose locations to track" button
 * 4. "View by climate" hydroclimate chooser icons
 * 5. (list mode only) Search + visibility toggle chips
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  LocationOnIcon,
  Switch,
  InputBase,
  IconButton,
  icons,
} from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"
import { useScenarioExplorerStore } from "../store"

interface ToolToolbarProps {
  showListControls?: boolean
}

export default function ToolToolbar({ showListControls }: ToolToolbarProps) {
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
    searchQuery,
    setSearchQuery,
    showDefinitions,
    setShowDefinitions,
    showAlternativeBaselines,
    setShowAlternativeBaselines,
    showKeyOperations,
    setShowKeyOperations,
    showOnlyChosen,
    setShowOnlyChosen,
    sharedScenarioIds,
    setShowShareDrawer,
  } = useScenarioExplorerStore()

  const viewControls = (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
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

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
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
          variant="caption"
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
          variant="caption"
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

  if (showListControls) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: theme.scenarios.grid.columns.xs,
            sm: showKeyOperations
              ? theme.scenarios.grid.columns.sm
              : "32px minmax(0, 1fr) 0fr 1fr",
          },
          [`@media (min-width: ${theme.scenarios.grid.fullBreakpoint}px)`]: {
            gridTemplateColumns: showKeyOperations
              ? theme.scenarios.grid.columns.full
              : "32px 0.382fr 0fr 1fr",
          },
          columnGap: theme.scenarios.grid.gap.default,
          px: theme.space.section.md,
          py: 0.5,
          minHeight: 44,
          alignItems: "center",
        }}
      >
        {/* List controls (search + chips) — aligned with scenario columns */}
        <Box
          sx={{
            gridColumn: { xs: "1 / -1", sm: "1 / 4" },
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 140,
              maxWidth: 200,
            }}
          >
            <InputBase
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              size="small"
              inputProps={{ "aria-label": "Search scenarios" }}
              sx={{
                flex: 1,
                fontSize: "0.8125rem",
                "& .MuiInputBase-input": {
                  py: 0.5,
                  px: 0.5,
                  "&::placeholder": {
                    color: theme.palette.grey[500],
                    opacity: 1,
                  },
                },
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery("")}
                sx={{ p: 0.25 }}
              >
                <icons.Close sx={{ fontSize: "0.875rem" }} />
              </IconButton>
            )}
          </Box>

          <VerticalDivider />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              flexWrap: "wrap",
            }}
          >
            <ToggleChip
              label="Definitions"
              active={showDefinitions}
              onClick={() => setShowDefinitions(!showDefinitions)}
            />
            <ToggleChip
              label="Baselines"
              active={showAlternativeBaselines}
              onClick={() =>
                setShowAlternativeBaselines(!showAlternativeBaselines)
              }
            />
            <ToggleChip
              label="Key ops"
              active={showKeyOperations}
              onClick={() => setShowKeyOperations(!showKeyOperations)}
            />
            <ToggleChip
              label="Chosen only"
              active={showOnlyChosen}
              onClick={() => setShowOnlyChosen(!showOnlyChosen)}
            />
            {sharedScenarioIds.length > 0 && (
              <ToggleChip
                label={`Share (${sharedScenarioIds.length})`}
                active={true}
                onClick={() => setShowShareDrawer(true)}
              />
            )}
          </Box>
        </Box>

        {/* View controls — aligned with outcomes column */}
        <Box
          sx={{
            gridColumn: { xs: "1 / -1", sm: "4" },
            display: "flex",
            alignItems: "center",
            alignSelf: "stretch",
            gap: 2,
            pl: theme.scenarios.grid.divider.gap,
            borderLeft: {
              xs: "none",
              sm: `1px solid rgba(0,0,0,0.2)`,
            },
          }}
        >
          {viewControls}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        py: 0.5,
        minHeight: 44,
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

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.75,
        py: 0.25,
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.6875rem",
        fontWeight: active ? 600 : 400,
        lineHeight: 1.3,
        color: active ? theme.palette.blue.bright : theme.palette.grey[600],
        background: active
          ? theme.palette.interaction.selectedBackground
          : theme.palette.grey[200],
        transition: "all 150ms ease",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
        },
      }}
    >
      {label}
    </Box>
  )
}
