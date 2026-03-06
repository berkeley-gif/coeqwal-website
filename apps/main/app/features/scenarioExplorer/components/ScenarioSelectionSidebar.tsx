"use client"

/**
 * ScenarioSelectionSidebar - Shared scenario selection panel for analysis modals
 *
 * Renders a narrow vertical sidebar containing:
 * - GridControls (show only chosen / baseline toggle) — from store
 * - Flat theme-grouped scenario list with checkboxes
 *
 * Theme headers have a select-all checkbox and a clickable badge that
 * toggles all scenarios in that theme — matching the list view behavior.
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

import React, { useMemo, useEffect, useRef } from "react"
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

/** Width of the sidebar in pixels. Exported so sibling components (e.g. the
 *  modal title row) can align a vertical divider to the sidebar border. */
export const SIDEBAR_WIDTH = 270

const THEME_ORDER: ScenarioTheme[] = [
  "baseline",
  "cws",
  "ag_gw",
  "eco",
  "delta",
]
const PRIMARY_BASELINE_ID = "s0020"

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScenarioSelectionSidebarProps {
  scenarioColors?: Record<string, string>
  hoveredScenarioId?: string | null
  /** Called when the user hovers scenario rows or a theme header in the sidebar. */
  onRowHover?: (scenarioIds: string[] | null) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScenarioSelectionSidebar({
  scenarioColors,
  hoveredScenarioId,
  onRowHover,
}: ScenarioSelectionSidebarProps) {
  const theme = useTheme()

  const {
    selectedScenarios,
    toggleScenario,
    selectScenarios,
    highlightedScenario,
    showOnlyChosen,
    showDefinitions,
    setShowOnlyChosen,
    setShowDefinitions,
  } = useScenarioExplorerStore()

  // ── Scroll-to-highlight plumbing ──────────────────────────────────────────
  const scenarioRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const activeScenarioId = highlightedScenario || hoveredScenarioId || null

  useEffect(() => {
    if (!activeScenarioId) return
    const timer = setTimeout(() => {
      scenarioRowRefs.current
        .get(activeScenarioId)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 80)
    return () => clearTimeout(timer)
  }, [activeScenarioId])

  // Toggle all scenarios in a theme group on/off
  const toggleTheme = (itemIds: string[]) => {
    const allChosen = itemIds.every((id) => selectedScenarios.includes(id))
    if (allChosen) {
      selectScenarios(selectedScenarios.filter((id) => !itemIds.includes(id)))
    } else {
      const toAdd = itemIds.filter((id) => !selectedScenarios.includes(id))
      selectScenarios([...selectedScenarios, ...toAdd])
    }
  }

  const { scenarios, isLoading } = useScenarioList()

  const scenariosByTheme = useMemo(() => {
    const activeScenarios = scenarios.filter((s) => s.isActive)

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

    return THEME_ORDER.map((t) => ({
      theme: t,
      items: groups.get(t) ?? [],
    }))
  }, [scenarios, showOnlyChosen, showDefinitions, selectedScenarios])

  return (
    <Box
      sx={{
        width: 270,
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
          pt: theme.space.component.md,
          pb: theme.space.component.xs,
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
          const allChosen =
            themeIds.length > 0 &&
            themeIds.every((id) => selectedScenarios.includes(id))
          const someChosen =
            themeIds.length > 0 &&
            themeIds.some((id) => selectedScenarios.includes(id))

          return (
            <Box key={themeKey} sx={{ mb: 1 }}>
              {/* ── Theme header: checkbox + clickable badge ────────────── */}
              <Box
                onMouseEnter={() => themeIds.length > 0 && onRowHover?.(themeIds)}
                onMouseLeave={() => onRowHover?.(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.25,
                  borderRadius: theme.borderRadius.xs,
                  "&:hover": {
                    backgroundColor:
                      theme.palette.interaction.selectedBackground,
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={allChosen}
                  indeterminate={someChosen && !allChosen}
                  onChange={() => toggleTheme(themeIds)}
                  sx={{
                    padding: 0,
                    flexShrink: 0,
                    transform: "scale(0.8)",
                  }}
                />
                <Box
                  onClick={() => toggleTheme(themeIds)}
                  sx={{ cursor: "pointer", display: "flex" }}
                >
                  <ScenarioBadge
                    label={THEME_LABEL_CONFIG[themeKey].label}
                    backgroundColor={
                      theme.palette.waterThemes[themeKey].background
                    }
                    color={theme.palette.waterThemes[themeKey].text}
                    sx={{ display: "block" }}
                  />
                </Box>
              </Box>

              {/* ── Scenario rows ───────────────────────────────────────── */}
              {items.map(({ id, shortLabel }) => {
                const isChosen = selectedScenarios.includes(id)
                const color = scenarioColors?.[id]
                const accentColor = color || theme.palette.blue.bright
                const isActive =
                  id === highlightedScenario || id === hoveredScenarioId

                return (
                  <Box
                    key={id}
                    ref={(el: HTMLDivElement | null) => {
                      if (el) scenarioRowRefs.current.set(id, el)
                      else scenarioRowRefs.current.delete(id)
                    }}
                    onClick={() => toggleScenario(id)}
                    onMouseEnter={() => onRowHover?.([id])}
                    onMouseLeave={() => onRowHover?.(null)}
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      pl: 1.25,
                      pr: 1,
                      py: 0.25,
                      cursor: "pointer",
                      borderLeft: `3px solid ${
                        isActive || isChosen ? accentColor : "transparent"
                      }`,
                      backgroundColor: isActive
                        ? theme.palette.grey[900]
                        : "transparent",
                      transition:
                        "background-color 200ms ease, border-color 200ms ease, color 200ms ease",
                      "&:hover": {
                        backgroundColor: isActive
                          ? theme.palette.grey[900]
                          : theme.palette.interaction.selectedBackground,
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
                        color: isActive
                          ? "rgba(255,255,255,0.5)"
                          : undefined,
                        "&.Mui-checked": isActive
                          ? { color: "rgba(255,255,255,0.85)" }
                          : {},
                      }}
                    />

                    {color && (
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: isActive ? 20 : 14,
                          height: 3,
                          borderRadius: "1.5px",
                          backgroundColor: color,
                          flexShrink: 0,
                          transition: "width 200ms ease",
                        }}
                      />
                    )}

                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        lineHeight: 1.35,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? "#fff"
                          : isChosen
                            ? theme.palette.text.primary
                            : theme.palette.grey[600],
                        transition: "color 200ms ease",
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
