"use client"

/**
 * ThemeFilter - Filter scenarios by water theme
 *
 * Styled to match HydroclimateChooser: a label above, inline controls below.
 * Controls:
 *  - CompactSelect dropdown: pick a water theme or "All" (clears filter)
 *  - Checkbox: "Only this group" — hides non-matching scenarios
 *  - Switch: "Badges" — toggles theme badge visibility on scenario cards
 */

import React from "react"
import {
  Box,
  Typography,
  Checkbox,
  Switch,
  FormControlLabel,
  useTheme,
} from "@repo/ui/mui"
import { CompactSelect } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"
import { THEME_LABEL_CONFIG, ACTIVE_THEMES } from "../../../content/themes"
import type { ScenarioTheme } from "../../../content/scenarios"

const THEME_OPTIONS = [
  { value: "all", label: "All water themes" },
  ...ACTIVE_THEMES.map((theme) => ({
    value: theme,
    label: THEME_LABEL_CONFIG[theme].label,
  })),
]

export function ThemeFilter() {
  const theme = useTheme()
  const {
    selectedTheme,
    showOnlyTheme,
    showThemeBadges,
    setSelectedTheme,
    setShowOnlyTheme,
    setShowThemeBadges,
  } = useScenarioExplorerStore()

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value === "all" ? null : (value as ScenarioTheme))
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.space.gap.sm,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: theme.palette.grey[900],
          whiteSpace: "nowrap",
        }}
      >
        Water theme
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.md,
          flexWrap: "wrap",
        }}
      >
        {/* Water theme dropdown */}
        <CompactSelect
          value={selectedTheme ?? "all"}
          onChange={handleThemeChange}
          options={THEME_OPTIONS}
          aria-label="Filter by water theme"
          minWidth={160}
        />

        {/* "Only this group" checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={showOnlyTheme}
              onChange={(e) => setShowOnlyTheme(e.target.checked)}
              disabled={selectedTheme === null}
              size="small"
              sx={{ py: 0, pr: 0.5 }}
            />
          }
          label={
            <Typography
              variant="dashboard"
              sx={{
                color:
                  selectedTheme === null
                    ? theme.palette.grey[400]
                    : theme.palette.grey[700],
                whiteSpace: "nowrap",
              }}
            >
              Only this group
            </Typography>
          }
          sx={{ mr: 0 }}
        />

        {/* Badges toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={showThemeBadges}
              onChange={(e) => setShowThemeBadges(e.target.checked)}
              size="small"
              sx={{ mr: 0.5 }}
            />
          }
          label={
            <Typography
              variant="dashboard"
              sx={{ color: theme.palette.grey[700], whiteSpace: "nowrap" }}
            >
              Badges
            </Typography>
          }
          sx={{ mr: 0 }}
        />
      </Box>
    </Box>
  )
}

export default ThemeFilter
