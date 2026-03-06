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

import React, { useMemo, useState, useEffect, useRef } from "react"
import {
  Box,
  Typography,
  useTheme,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
} from "@repo/ui/mui"
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
  /**
   * Optional map of scenarioId → line color.
   * When provided, renders a small colored swatch next to each scenario row.
   * Used by ComparisonPanel to make the sidebar double as a chart legend.
   */
  scenarioColors?: Record<string, string>
  /**
   * Scenario currently hovered on the chart (transient). Receives a subtle
   * visual treatment in the sidebar but does not trigger scroll.
   */
  hoveredScenarioId?: string | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScenarioSelectionSidebar({
  scenarioColors,
  hoveredScenarioId,
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

  // ── Scroll-to-highlight plumbing ────────────────────────────────────────────
  const scenarioRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // The active scenario is whichever is highlighted (click) or hovered from chart
  const activeScenarioId = highlightedScenario || hoveredScenarioId || null

  // Auto-expand the active scenario's theme accordion so the row is visible
  useEffect(() => {
    if (!activeScenarioId) return
    const themeKey = getScenarioTheme(activeScenarioId) as ScenarioTheme
    setExpandedThemes((prev) => {
      if (prev.has(themeKey)) return prev
      const next = new Set(prev)
      next.add(themeKey)
      return next
    })
  }, [activeScenarioId])

  // Smooth-scroll to the active row after a brief delay
  // (allows accordion expansion to settle first)
  useEffect(() => {
    if (!activeScenarioId) return
    const timer = setTimeout(() => {
      scenarioRowRefs.current
        .get(activeScenarioId)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 120)
    return () => clearTimeout(timer)
  }, [activeScenarioId])

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

  // All themes expanded by default
  const [expandedThemes, setExpandedThemes] = useState<Set<ScenarioTheme>>(
    new Set(THEME_ORDER),
  )
  const toggleExpanded = (themeKey: ScenarioTheme) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev)
      if (next.has(themeKey)) {
        next.delete(themeKey)
      } else {
        next.add(themeKey)
      }
      return next
    })
  }

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
          const isExpanded = expandedThemes.has(themeKey)

          return (
            <Accordion
              key={themeKey}
              expanded={isExpanded}
              onChange={() => toggleExpanded(themeKey)}
              disableGutters
              elevation={0}
              sx={{
                backgroundColor: "transparent",
                "&:before": { display: "none" },
                mb: 1,
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{ fontSize: 16, color: theme.palette.grey[500] }}
                  />
                }
                sx={{
                  minHeight: 0,
                  px: 1.5,
                  py: 0.25,
                  flexDirection: "row-reverse",
                  gap: 0.5,
                  "&.Mui-expanded": { minHeight: 0 },
                  "& .MuiAccordionSummary-content": { my: 0 },
                  "& .MuiAccordionSummary-expandIconWrapper": {
                    flexShrink: 0,
                  },
                  borderRadius: theme.borderRadius.xs,
                  "&:hover": {
                    backgroundColor:
                      theme.palette.interaction.selectedBackground,
                  },
                }}
                onClick={(e) => {
                  // Only toggle theme selection when clicking the badge itself,
                  // not the expand/collapse affordance
                  const target = e.target as HTMLElement
                  if (
                    !target.closest(".MuiAccordionSummary-expandIconWrapper")
                  ) {
                    e.stopPropagation()
                    toggleTheme(themeIds)
                  }
                }}
                aria-label={`${allChosen ? "Deselect" : "Select"} all ${THEME_LABEL_CONFIG[themeKey].label} scenarios`}
              >
                <ScenarioBadge
                  label={THEME_LABEL_CONFIG[themeKey].label}
                  backgroundColor={
                    theme.palette.waterThemes[themeKey].background
                  }
                  color={theme.palette.waterThemes[themeKey].text}
                  sx={{ display: "block" }}
                />
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                {items.length === 0 && (
                  <Typography
                    sx={{
                      px: 2,
                      py: 0.5,
                      fontSize: "0.75rem",
                      color: theme.palette.grey[400],
                      fontStyle: "italic",
                    }}
                  >
                    Coming soon
                  </Typography>
                )}
                {items.map(({ id, shortLabel }) => {
                  const isChosen = selectedScenarios.includes(id)
                  const color = scenarioColors?.[id]
                  const accentColor = color || theme.palette.blue.bright
                  const isActive =
                    id === highlightedScenario ||
                    id === hoveredScenarioId

                  return (
                    <Box
                      key={id}
                      ref={(el: HTMLDivElement | null) => {
                        if (el) scenarioRowRefs.current.set(id, el)
                        else scenarioRowRefs.current.delete(id)
                      }}
                      onClick={() => toggleScenario(id)}
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
                          isActive || isChosen
                            ? accentColor
                            : "transparent"
                        }`,
                        backgroundColor: isActive
                          ? theme.palette.grey[900]
                          : "transparent",
                        transition:
                          "background-color 200ms ease, border-color 200ms ease, color 200ms ease",
                        "&:hover": {
                          backgroundColor: isActive
                            ? theme.palette.grey[900]
                            : theme.palette.interaction
                                .selectedBackground,
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

                      {/* Color swatch (ComparisonPanel chart legend) */}
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
                          fontWeight: isActive
                            ? 600
                            : isChosen
                              ? 500
                              : 400,
                          color: isActive
                            ? "#fff"
                            : isChosen
                              ? theme.palette.text.primary
                              : theme.palette.grey[600],
                          transition:
                            "color 200ms ease",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {shortLabel}
                      </Typography>
                    </Box>
                  )
                })}
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
    </Box>
  )
}
