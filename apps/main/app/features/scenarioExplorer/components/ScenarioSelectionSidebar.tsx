"use client"

/**
 * ScenarioSelectionSidebar — Persistent left-hand scenario list panel.
 *
 * Renders (top to bottom):
 * 1. Search bar (filters scenario list by name/description)
 * 2. Visibility toggles: definitions, baselines, key operations
 * 3. Theme-grouped scenario list with checkboxes, pin, and color swatch
 *
 * All state is read/written via useScenarioExplorerStore so changes
 * propagate to every tool automatically.
 */

import React, { useMemo, useEffect, useRef } from "react"
import {
  Box,
  Typography,
  useTheme,
  Checkbox,
  IconButton,
  Tooltip,
  icons,
} from "@repo/ui/mui"
import { ScenarioBadge, CompactSearchBar } from "@repo/ui"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"
import { type ScenarioTheme } from "../../../content/scenarios"
import { THEME_LABEL_CONFIG } from "../../../content/themes"

const THEME_ORDER: ScenarioTheme[] = [
  "baseline",
  "cws",
  "ag_gw",
  "eco",
  "delta",
  "unthemed",
]
const PRIMARY_BASELINE_ID = "s0020"

interface ScenarioSelectionSidebarProps {
  scenarioColors?: Record<string, string>
  hoveredScenarioId?: string | null
  onRowHover?: (scenarioIds: string[] | null) => void
}

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
    pinnedScenarioId,
    setPinnedScenarioId,
    showOnlyChosen,
    showAlternativeBaselines,
    showDefinitions,
    showKeyOperations,
    searchQuery,
    setSearchQuery,
    setShowOnlyChosen,
    setShowAlternativeBaselines,
    setShowDefinitions,
    setShowKeyOperations,
  } = useScenarioExplorerStore()

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

  const toggleTheme = (itemIds: string[]) => {
    const allChosen = itemIds.every((id) => selectedScenarios.includes(id))
    if (allChosen) {
      selectScenarios(selectedScenarios.filter((id) => !itemIds.includes(id)))
    } else {
      const toAdd = itemIds.filter((id) => !selectedScenarios.includes(id))
      selectScenarios([...selectedScenarios, ...toAdd])
    }
  }

  const { siblingGroups, isLoading } = useScenarioList()

  const scenariosByTheme = useMemo(() => {
    const allGroups = new Map<ScenarioTheme, string[]>()
    THEME_ORDER.forEach((t) => allGroups.set(t, []))
    siblingGroups.forEach((s) => {
      allGroups.get(s.theme)?.push(s.scenarioId)
    })

    let filtered = siblingGroups.slice()

    if (showOnlyChosen) {
      filtered = filtered.filter((s) =>
        selectedScenarios.includes(s.scenarioId),
      )
    } else if (!showAlternativeBaselines) {
      filtered = filtered.filter(
        (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
      )
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.shortLabel.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    }

    const displayGroups = new Map<
      ScenarioTheme,
      { id: string; name: string; description: string }[]
    >()
    THEME_ORDER.forEach((t) => displayGroups.set(t, []))

    filtered.forEach((s) => {
      const bucket = displayGroups.get(s.theme)
      if (bucket)
        bucket.push({
          id: s.scenarioId,
          name: s.label,
          description: s.description,
        })
    })

    return THEME_ORDER.map((t) => ({
      theme: t,
      items: displayGroups.get(t) ?? [],
      allIds: allGroups.get(t) ?? [],
    }))
  }, [
    siblingGroups,
    showOnlyChosen,
    showAlternativeBaselines,
    selectedScenarios,
    searchQuery,
  ])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[50],
      }}
    >
      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          px: 1,
          pt: 1,
          pb: 0.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CompactSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search scenarios…"
          showLabel={false}
          inputId="sidebar-scenario-search"
          ariaLabel="Search scenarios"
        />
      </Box>

      {/* Visibility toggles */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          px: 1,
          py: 0.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
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
          onClick={() => setShowAlternativeBaselines(!showAlternativeBaselines)}
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
      </Box>

      {/* Scrollable scenario list */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          pt: 0.75,
          pb: 4,
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

        {scenariosByTheme.map(({ theme: themeKey, items, allIds }) => {
          const visibleIds = items.map(({ id }) => id)
          const allChosen =
            allIds.length > 0 &&
            allIds.every((id) => selectedScenarios.includes(id))
          const someChosen =
            allIds.length > 0 &&
            allIds.some((id) => selectedScenarios.includes(id))

          if (items.length === 0 && !showAlternativeBaselines && themeKey === "baseline") {
            // Still show the baseline header with just the primary baseline
          } else if (items.length === 0) {
            return null
          }

          return (
            <Box key={themeKey} sx={{ mb: 0.75 }}>
              {/* Theme header */}
              <Box
                onMouseEnter={() =>
                  visibleIds.length > 0 && onRowHover?.(visibleIds)
                }
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
                  onChange={() => toggleTheme(allIds)}
                  sx={{
                    padding: 0,
                    flexShrink: 0,
                    transform: "scale(0.8)",
                  }}
                />
                <Box
                  onClick={() => toggleTheme(allIds)}
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

              {/* Scenario rows */}
              {items.map(({ id, name, description }) => {
                const isChosen = selectedScenarios.includes(id)
                const isPinned = pinnedScenarioId === id
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
                    onMouseEnter={() => onRowHover?.([id])}
                    onMouseLeave={() => onRowHover?.(null)}
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 0.5,
                      pl: 1.25,
                      pr: 0.5,
                      py: 0.25,
                      cursor: "pointer",
                      borderLeft: `3px solid ${
                        isActive || isChosen || isPinned
                          ? accentColor
                          : "transparent"
                      }`,
                      backgroundColor: isActive
                        ? theme.palette.grey[900]
                        : "transparent",
                      transition:
                        "background-color 200ms ease, border-color 200ms ease",
                      "&:hover": {
                        backgroundColor: isActive
                          ? theme.palette.grey[900]
                          : theme.palette.interaction.selectedBackground,
                        borderLeftColor: accentColor,
                      },
                    }}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      size="small"
                      checked={isChosen}
                      onChange={() => toggleScenario(id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        padding: 0,
                        flexShrink: 0,
                        mt: "2px",
                        transform: "scale(0.75)",
                        color: isActive ? "rgba(255,255,255,0.5)" : undefined,
                        "&.Mui-checked": isActive
                          ? { color: "rgba(255,255,255,0.85)" }
                          : {},
                      }}
                    />

                    {/* Color swatch (chart legend) */}
                    {color && (
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: isActive ? 20 : 14,
                          height: 3,
                          borderRadius: "1.5px",
                          backgroundColor: color,
                          flexShrink: 0,
                          mt: "7px",
                          transition: "width 200ms ease",
                        }}
                      />
                    )}

                    {/* Label + optional description */}
                    <Box
                      onClick={() => toggleScenario(id)}
                      sx={{ flex: 1, minWidth: 0 }}
                    >
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
                      {name}
                    </Typography>
                      {showDefinitions && description && (
                        <Typography
                          sx={{
                            fontSize: "0.6875rem",
                            lineHeight: 1.3,
                            color: isActive
                              ? "rgba(255,255,255,0.6)"
                              : theme.palette.grey[500],
                            mt: 0.125,
                          }}
                        >
                          {description}
                        </Typography>
                      )}
                    </Box>

                    {/* Pin button */}
                    <Tooltip title={isPinned ? "Unpin" : "Pin"} arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPinnedScenarioId(isPinned ? null : id)
                        }}
                        sx={{
                          p: 0.25,
                          flexShrink: 0,
                          opacity: isPinned || isActive ? 1 : 0,
                          color: isPinned
                            ? theme.palette.blue.bright
                            : isActive
                              ? "rgba(255,255,255,0.7)"
                              : theme.palette.grey[500],
                          transition: "opacity 200ms ease",
                          ".MuiBox-root:hover > &": { opacity: 1 },
                          // Show on parent row hover
                          "*:hover > &": { opacity: 1 },
                        }}
                      >
                        <icons.PushPin
                          sx={{
                            fontSize: "0.875rem",
                            transform: isPinned ? "none" : "rotate(45deg)",
                          }}
                        />
                      </IconButton>
                    </Tooltip>
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

/** Small toggle chip used in the visibility controls row */
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
