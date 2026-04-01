"use client"

/**
 * ScenarioSelectionSidebar — Persistent left-hand scenario list panel.
 *
 * Matches the StrategyGrid "Choose scenarios" visual style:
 * 1. "Choose scenarios" header with key-ops column toggle
 * 2. Search bar (filters by name/description)
 * 3. Visibility chips: Definitions, Baselines, Key ops, Chosen only
 * 4. Scrollable scenario list with StrategyHeader labels, checkboxes,
 *    and a collapsible key operations column
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
  InputBase,
} from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"
import {
  StrategyHeader,
  OperationsIconGroup,
} from "../../scenarios/components/shared"
import { useScrollSyncRef } from "./useScrollSync"
import { THEME_LABEL_CONFIG } from "../../../content/themes"
import type { ScenarioTheme } from "../../../content/scenarios"
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
  const sidebarScrollRef = useScrollSyncRef("sidebar")

  const {
    selectedScenarios,
    toggleScenario,
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
    sharedScenarioIds,
    addToShare,
    setShowShareDrawer,
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

  const { siblingGroups, isLoading } = useScenarioList()

  const filteredScenarios = useMemo(() => {
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

    return filtered
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
      {/* ── Header: "Choose scenarios" + key-ops column header ─────────── */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: theme.palette.grey[900], fontWeight: 500 }}
        >
          Scenario library
        </Typography>

        {showKeyOperations && (
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.grey[600],
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            Key operations
          </Typography>
        )}
      </Box>

      {/* ── Search row ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          minHeight: 40,
          borderBottom: `1px solid ${theme.palette.divider}`,
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
            "& .MuiInputBase-input": { py: 0.5, px: 0.5 },
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

      {/* ── Visibility chip toggles ──────────────────────────────────────── */}
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
        {sharedScenarioIds.length > 0 && (
          <ToggleChip
            label={`Share (${sharedScenarioIds.length})`}
            active={true}
            onClick={() => setShowShareDrawer(true)}
          />
        )}
      </Box>

      {/* ── Scrollable scenario list ─────────────────────────────────────── */}
      <Box
        ref={sidebarScrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          pb: 4,
        }}
      >
        {isLoading && (
          <Typography
            variant="caption"
            sx={{ px: 1.5, py: 1, color: theme.palette.grey[500] }}
          >
            Loading…
          </Typography>
        )}

        {filteredScenarios.flatMap((scenario, index) => {
          const isChosen = selectedScenarios.includes(scenario.scenarioId)
          const isPinned = pinnedScenarioId === scenario.scenarioId
          const color = scenarioColors?.[scenario.scenarioId]
          const accentColor = color || theme.palette.blue.bright
          const isActive =
            scenario.scenarioId === highlightedScenario ||
            scenario.scenarioId === hoveredScenarioId

          const prevScenario =
            index > 0 ? filteredScenarios[index - 1] : undefined
          const isNewThemeGroup =
            index === 0 || scenario.theme !== prevScenario?.theme

          const items: React.ReactNode[] = []

          if (isNewThemeGroup && scenario.theme) {
            const themeConfig =
              THEME_LABEL_CONFIG[scenario.theme as ScenarioTheme]
            const themeColors =
              theme.palette.waterThemes[scenario.theme as ScenarioTheme]
            if (themeConfig && themeColors) {
              items.push(
                <Box
                  key={`theme-header-${scenario.theme}-${index}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    pt: index === 0 ? 1 : 1.5,
                    pb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: themeColors.text,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="smallSectionLabel"
                    sx={{ color: themeColors.text }}
                  >
                    {themeConfig.label}
                  </Typography>
                </Box>,
              )
            }
          }

          items.push(
            <Box
              key={scenario.scenarioId}
              ref={(el: HTMLDivElement | null) => {
                if (el)
                  scenarioRowRefs.current.set(scenario.scenarioId, el)
                else scenarioRowRefs.current.delete(scenario.scenarioId)
              }}
              onMouseEnter={() => onRowHover?.([scenario.scenarioId])}
              onMouseLeave={() => onRowHover?.(null)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "pointer",
                borderLeft: `3px solid ${
                  isActive || isChosen || isPinned
                    ? accentColor
                    : "transparent"
                }`,
                borderBottom: `1px solid ${theme.palette.grey[200]}`,
                backgroundColor: isHighlightedBg(isActive, theme.palette.grey[900]),
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
                onChange={() => toggleScenario(scenario.scenarioId)}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  padding: 0,
                  flexShrink: 0,
                  mt: "2px",
                  transform: "scale(0.85)",
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
                    mt: "10px",
                    transition: "width 200ms ease",
                  }}
                />
              )}

              {/* Scenario label (StrategyHeader) */}
              <Box
                onClick={() => toggleScenario(scenario.scenarioId)}
                sx={{ flex: 1, minWidth: 0 }}
              >
                <StrategyHeader
                  strategy={scenario}
                  titleVariant="body2"
                  showDescription={showDefinitions}
                  descriptionMaxWidth="none"
                />
              </Box>

              {/* Key operations column (collapsible) */}
              <Box
                sx={{
                  overflow: "hidden",
                  width: showKeyOperations ? "auto" : 0,
                  opacity: showKeyOperations ? 1 : 0,
                  flexShrink: 0,
                  transition: "width 300ms ease, opacity 250ms ease",
                  display: "flex",
                  alignItems: "flex-start",
                  pt: "2px",
                }}
              >
                <OperationsIconGroup
                  scenarioId={scenario.scenarioId}
                  size="sm"
                />
              </Box>

              {/* Action buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.25,
                  flexShrink: 0,
                  mt: "2px",
                }}
              >
                {/* Share */}
                {(() => {
                  const isShared = sharedScenarioIds.includes(
                    scenario.scenarioId,
                  )
                  return (
                    <Tooltip
                      title={isShared ? "Added to share" : "Add to share"}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToShare(scenario.scenarioId)
                        }}
                        sx={{
                          p: 0.25,
                          opacity: isShared || isActive ? 1 : 0,
                          color: isShared
                            ? theme.palette.blue.bright
                            : isActive
                              ? "rgba(255,255,255,0.7)"
                              : theme.palette.grey[500],
                          transition: "opacity 200ms ease",
                          "*:hover > &": { opacity: 1 },
                        }}
                      >
                        <icons.IosShare sx={{ fontSize: "0.8rem" }} />
                      </IconButton>
                    </Tooltip>
                  )
                })()}

                {/* Pin */}
                <Tooltip title={isPinned ? "Unpin" : "Pin"} arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPinnedScenarioId(
                        isPinned ? null : scenario.scenarioId,
                      )
                    }}
                    sx={{
                      p: 0.25,
                      opacity: isPinned || isActive ? 1 : 0,
                      color: isPinned
                        ? theme.palette.blue.bright
                        : isActive
                          ? "rgba(255,255,255,0.7)"
                          : theme.palette.grey[500],
                      transition: "opacity 200ms ease",
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
            </Box>,
          )

          return items
        })}
      </Box>
    </Box>
  )
}

function isHighlightedBg(isActive: boolean, grey900: string) {
  return isActive ? grey900 : "transparent"
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
