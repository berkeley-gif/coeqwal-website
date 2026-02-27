"use client"

/**
 * ScenarioSelectionSidebar - Shared scenario selection panel for analysis modals
 *
 * Renders a narrow vertical sidebar containing:
 * - GridControls (show only chosen / baseline toggle) — from store
 * - Scrollable theme-grouped scenario list with checkboxes
 *
 * Note: SelectionBanner is NOT rendered here — it lives in the modal title
 * row so it has full horizontal width and is never clipped.
 *
 * All state is read from and written to useScenarioExplorerStore, so any
 * change here is automatically reflected in the main list view and all
 * other panels that share the same store.
 *
 * Optional scenarioColors prop: when provided (e.g. from ComparisonPanel's
 * parallel-coords chart), renders a small colored line swatch next to each
 * scenario row to serve as a chart legend.
 */

import React, { useMemo } from "react"
import { Box, Typography, useTheme, Checkbox } from "@repo/ui/mui"
import { ScenarioBadge } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"
import {
  getScenarioTheme,
  getScenarioShortLabel,
  type ScenarioTheme,
} from "../../../content/scenarios"
import { THEME_LABEL_CONFIG } from "../../../content/themes"
import GridControls from "../strategyGrid/GridControls"

// ── Constants ─────────────────────────────────────────────────────────────────

const THEME_ORDER: ScenarioTheme[] = ["baseline", "cws", "ag_gw", "eco", "delta"]
const PRIMARY_BASELINE_ID = "s0020"

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScenarioSelectionSidebarProps {
  /**
   * Optional map of scenarioId → line color.
   * When provided, renders a small colored swatch next to each scenario row.
   * Used by ComparisonPanel to make the sidebar double as a chart legend.
   */
  scenarioColors?: Record<string, string>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScenarioSelectionSidebar({
  scenarioColors,
}: ScenarioSelectionSidebarProps) {
  const theme = useTheme()

  const {
    selectedScenarios,
    toggleScenario,
    selectScenarios,
    showOnlyChosen,
    showDefinitions,
    setShowOnlyChosen,
    setShowDefinitions,
  } = useScenarioExplorerStore()

  // Toggle all scenarios in a theme group on/off
  const toggleTheme = (itemIds: string[]) => {
    const allChosen = itemIds.every((id) => selectedScenarios.includes(id))
    if (allChosen) {
      // Deselect all in this theme
      selectScenarios(selectedScenarios.filter((id) => !itemIds.includes(id)))
    } else {
      // Select all in this theme (add any missing ones, preserving order)
      const toAdd = itemIds.filter((id) => !selectedScenarios.includes(id))
      selectScenarios([...selectedScenarios, ...toAdd])
    }
  }

  const { scenarios, isLoading } = useScenarioList()

  // Group active scenarios by theme, respecting showOnlyChosen + showDefinitions filters
  const scenariosByTheme = useMemo(() => {
    const activeScenarios = scenarios.filter((s) => s.isActive)

    // Apply the same filtering logic as StrategyGridContent
    const filtered = (() => {
      if (showOnlyChosen) {
        return activeScenarios.filter((s) =>
          selectedScenarios.includes(s.scenarioId),
        )
      }
      if (!showDefinitions) {
        return activeScenarios.filter(
          (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
        )
      }
      return activeScenarios
    })()

    const groups = new Map<
      ScenarioTheme,
      { id: string; shortLabel: string }[]
    >()
    THEME_ORDER.forEach((t) => groups.set(t, []))

    filtered.forEach((s) => {
      const t = getScenarioTheme(s.scenarioId)
      const shortLabel = getScenarioShortLabel(s.scenarioId)
      const bucket = groups.get(t)
      if (bucket) bucket.push({ id: s.scenarioId, shortLabel })
    })

    return THEME_ORDER.map((t) => ({ theme: t, items: groups.get(t) ?? [] })).filter(
      ({ items }) => items.length > 0,
    )
  }, [scenarios, showOnlyChosen, showDefinitions, selectedScenarios])

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        backgroundColor: theme.palette.grey[50],
      }}
    >
      {/* ── Grid controls (show only chosen / baseline toggle) ─────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 1.5,
          pt: 1.5,
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <GridControls
          showOnlyChosen={showOnlyChosen}
          showDefinitions={showDefinitions}
          onShowOnlyChosenChange={setShowOnlyChosen}
          onShowDefinitionsChange={setShowDefinitions}
          iconSize={28}
        />
      </Box>

      {/* ── Scrollable scenario list ───────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          py: theme.space.component.sm,
        }}
      >
        {isLoading && (
          <Typography
            variant="caption"
            sx={{ px: 1.5, color: theme.palette.grey[500] }}
          >
            Loading…
          </Typography>
        )}

        {scenariosByTheme.map(({ theme: themeKey, items }) => {
          const themeIds = items.map(({ id }) => id)
          const allChosen = themeIds.length > 0 && themeIds.every((id) => selectedScenarios.includes(id))

          return (
          <Box key={themeKey} sx={{ mb: 1.5 }}>
            {/* Theme badge heading — click to select/deselect all in theme */}
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                cursor: "pointer",
                borderRadius: theme.borderRadius.xs,
                "&:hover": {
                  backgroundColor: theme.palette.interaction.selectedBackground,
                },
              }}
              onClick={() => toggleTheme(themeIds)}
              role="button"
              aria-label={`${allChosen ? "Deselect" : "Select"} all ${THEME_LABEL_CONFIG[themeKey].label} scenarios`}
            >
              <ScenarioBadge
                label={THEME_LABEL_CONFIG[themeKey].label}
                backgroundColor={theme.palette.waterThemes[themeKey].background}
                color={theme.palette.waterThemes[themeKey].text}
                sx={{ display: "block" }}
              />
            </Box>

            {/* Scenario rows */}
            {items.map(({ id, shortLabel }) => {
              const isChosen = selectedScenarios.includes(id)
              const color = scenarioColors?.[id]
              const accentColor = color || theme.palette.blue.bright

              return (
                <Box
                  key={id}
                  onClick={() => toggleScenario(id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    pl: 1.25,
                    pr: 1,
                    py: 0.5,
                    cursor: "pointer",
                    borderLeft: `2px solid ${isChosen ? accentColor : "transparent"}`,
                    transition: "background-color 0.1s",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.interaction.selectedBackground,
                      borderLeftColor: accentColor,
                    },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isChosen}
                    onChange={() => toggleScenario(id)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      padding: 0,
                      flexShrink: 0,
                      transform: "scale(0.75)",
                    }}
                  />

                  {/* Color swatch (ComparisonPanel chart legend) */}
                  {color && (
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 14,
                        height: 3,
                        borderRadius: "2px",
                        backgroundColor: color,
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      lineHeight: 1.35,
                      fontWeight: isChosen ? 500 : 400,
                      color: isChosen
                        ? theme.palette.text.primary
                        : theme.palette.grey[600],
                      transition: "color 0.1s",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {shortLabel}
                  </Typography>
                </Box>
              )
            })}
          </Box>
          )
        })}
      </Box>
    </Box>
  )
}
