"use client"

/**
 * ComparisonPanel - Tradeoffs view with scenario legend and parallel coordinates chart
 *
 * Layout: scrollable theme-grouped legend on the left, toggle controls +
 * chart on the right. Clicking a legend row highlights that scenario.
 */

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@repo/ui/mui"
import {
  VerticalParallelLinePlotPeak,
  type VerticalParallelLineData,
} from "@repo/viz"
import { ScenarioBadge, CurrentOpsIcon, CurrentOpsMultipleIcon, InfoTooltip } from "@repo/ui"
import TogglePair from "../components/TogglePair"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import {
  getScenarioTheme,
  getScenarioShortLabel,
  type ScenarioTheme,
} from "../../../content/scenarios"
import { THEME_LABEL_CONFIG } from "../../../content/themes"

// ─── Theme display config ─────────────────────────────────────────────────────

const THEME_ORDER: ScenarioTheme[] = ["baseline", "cws", "ag_gw", "eco", "delta"]

export default function ComparisonPanel() {
  const theme = useTheme()

  // Get state and actions from store
  const {
    highlightedScenario,
    setHighlightedScenario,
    setPinnedScenarioId,
    showDefinitions,
    setShowDefinitions,
  } = useScenarioExplorerStore()

  // Toggle states (local UI state)
  const [overlayTiers, setOverlayTiers] = useState(false)
  const [highlightBaseline, setHighlightBaseline] = useState(false)
  const [relativeToBaseline, setRelativeToBaseline] = useState(true)
  const [defineOutcome, setDefineOutcome] = useState(false)

  // Hover state for tooltip
  const [hoveredScenario, setHoveredScenario] =
    useState<VerticalParallelLineData | null>(null)

  const {
    data: comparisonData,
    axes,
    lineColors,
    scenarios,
    baselineScenario,
    isLoading,
    hasData,
  } = useComparisonData()

  // Group scenarios by theme, preserving THEME_ORDER
  const scenariosByTheme = useMemo(() => {
    const groups = new Map<ScenarioTheme, { id: string; shortLabel: string; color: string }[]>()
    THEME_ORDER.forEach((theme) => groups.set(theme, []))

    scenarios.forEach(({ id, color }) => {
      const theme = getScenarioTheme(id)
      const shortLabel = getScenarioShortLabel(id)
      const bucket = groups.get(theme)
      if (bucket) bucket.push({ id, shortLabel, color })
    })

    // Only return themes that have at least one scenario present
    return THEME_ORDER
      .map((theme) => ({ theme, items: groups.get(theme) ?? [] }))
      .filter(({ items }) => items.length > 0)
  }, [scenarios])

  const highlightedData = useMemo(() => {
    return comparisonData.map((scenario) => ({
      ...scenario,
      highlighted: scenario.id === highlightedScenario,
    }))
  }, [comparisonData, highlightedScenario])

  // Transform data to be relative to baseline when toggle is on
  const chartData = useMemo(() => {
    if (!relativeToBaseline || !baselineScenario) return highlightedData
    return highlightedData.map((scenario) => ({
      ...scenario,
      values: Object.fromEntries(
        Object.entries(scenario.values).map(([axis, value]) => [
          axis,
          // Keep null values as null (missing data stays missing)
          value === null ? null : value - (baselineScenario.values[axis] || 0),
        ]),
      ),
    }))
  }, [highlightedData, relativeToBaseline, baselineScenario])

  // Baseline data for the chart - zeroed when in relative mode
  const baselineDataForChart = useMemo(() => {
    if (!baselineScenario) return undefined
    if (relativeToBaseline) {
      return {
        ...baselineScenario,
        values: Object.fromEntries(
          Object.keys(baselineScenario.values).map((key) => [key, 0]),
        ),
      }
    }
    return baselineScenario
  }, [baselineScenario, relativeToBaseline])

  // Handle scenario click in chart
  const handleScenarioClick = (scenarioId: string) => {
    // Toggle highlight
    setHighlightedScenario(
      highlightedScenario === scenarioId ? null : scenarioId,
    )
    // Bring clicked scenario to top of list
    setPinnedScenarioId(scenarioId)
  }

  const checkboxSx = {
    padding: 0,
    margin: 0,
    transform: "scale(0.85)",
  }

  const toggleControls = (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={relativeToBaseline}
            onChange={(e) => setRelativeToBaseline(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            relative to current operations
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={highlightBaseline}
            onChange={(e) => setHighlightBaseline(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            highlight current operations
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={defineOutcome}
            onChange={(e) => setDefineOutcome(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            define an outcome
            <br />
            (coming soon)
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={overlayTiers}
            onChange={(e) => setOverlayTiers(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            overlay tiers
          </Typography>
        }
      />
    </Box>
  )

  const chartElement = (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <VerticalParallelLinePlotPeak
        data={chartData}
        axes={axes}
        responsive={true}
        showBaseline={highlightBaseline}
        baselineData={baselineDataForChart}
        overlayTiers={overlayTiers}
        defineOutcome={defineOutcome}
        colors={{
          default: theme.palette.grey[600],
          highlighted: theme.palette.blue.darkest,
          background: theme.palette.grey[50],
        }}
        lineColors={lineColors}
        onLineHover={setHoveredScenario}
        onLineClick={(scenario) => handleScenarioClick(scenario.id)}
      />
      {/* Hover tooltip showing scenario name */}
      {hoveredScenario && (
        <Box
          sx={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 400 }}>
            {hoveredScenario.name}
          </Typography>
        </Box>
      )}
    </Box>
  )

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress size={32} />
        <Typography
          variant="body2"
          sx={{
            mt: theme.space.component.lg,
            color: theme.palette.grey[600],
          }}
        >
          Loading comparison...
        </Typography>
      </Box>
    )
  }

  if (!hasData) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
          No comparison data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Left: theme-grouped scenario legend ────────────────────────────── */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          overflowY: "auto",
          borderRight: `1px solid ${theme.palette.divider}`,
          py: theme.space.component.sm,
        }}
      >
        {scenariosByTheme.map(({ theme: themeKey, items }) => (
          <Box key={themeKey} sx={{ mb: 1.5 }}>
            {/* Theme badge heading */}
            <Box sx={{ px: 1.5, py: 0.5 }}>
              <ScenarioBadge
                label={THEME_LABEL_CONFIG[themeKey].label}
                backgroundColor={theme.palette.waterThemes[themeKey].background}
                color={theme.palette.waterThemes[themeKey].text}
                sx={{ display: "block" }}
              />
            </Box>

            {/* Baseline-only toggle: show current ops only vs all baseline variants */}
            {themeKey === "baseline" && (
              <Box sx={{ px: 1.5, pb: 0.5 }}>
                <InfoTooltip description="Show only current operations, or show all baseline variations">
                  <Box>
                    <TogglePair
                      leftIcon={
                        <CurrentOpsIcon
                          active={!showDefinitions}
                          size={24}
                        />
                      }
                      rightIcon={
                        <CurrentOpsMultipleIcon
                          active={showDefinitions}
                          size={24}
                        />
                      }
                      onLeftClick={() => setShowDefinitions(false)}
                      onRightClick={() => setShowDefinitions(true)}
                      gap={0.5}
                    />
                  </Box>
                </InfoTooltip>
              </Box>
            )}

            {/* Scenario rows */}
            {items.map(({ id, shortLabel, color }) => {
              const isHighlighted = highlightedScenario === id
              return (
                <Box
                  key={id}
                  onClick={() => handleScenarioClick(id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    cursor: "pointer",
                    borderRadius: theme.borderRadius.xs,
                    backgroundColor: isHighlighted
                      ? theme.palette.interaction.selectedBackground
                      : "transparent",
                    opacity: highlightedScenario && !isHighlighted ? 0.45 : 1,
                    transition: "background-color 0.12s, opacity 0.12s",
                    "&:hover": {
                      backgroundColor: theme.palette.interaction.selectedBackground,
                      opacity: 1,
                    },
                  }}
                >
                  {/* Color swatch — short horizontal line */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 16,
                      height: 3,
                      borderRadius: "2px",
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      lineHeight: 1.3,
                      fontWeight: isHighlighted ? 600 : 400,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {shortLabel}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>

      {/* ── Right: toggle controls + chart ─────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toggle controls */}
        <Box
          sx={{
            flexShrink: 0,
            px: theme.space.component.lg,
            pt: theme.space.component.sm,
          }}
        >
          {toggleControls}
        </Box>

        {/* Chart */}
        <Box
          sx={{
            flex: 1,
            p: theme.space.component.lg,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              p: theme.space.component.lg,
              boxShadow: theme.shadow.subtle,
              height: "100%",
            }}
          >
            {chartElement}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
