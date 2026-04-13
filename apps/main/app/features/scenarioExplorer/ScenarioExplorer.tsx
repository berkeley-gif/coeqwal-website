"use client"

/**
 * ScenarioExplorer. Main scenario exploration interface.
 *
 * Top-level navigation: Get Started | Go to tools
 *
 * All explore modes route through UnifiedToolLayout:
 *   - List mode: no sidebar, ToolToolbar with grid-aligned search/chips
 *   - Other modes: ScenarioSelectionSidebar + ToolToolbar + chart controls
 */

import React, { useState, useCallback, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  useTheme,
  PlayArrowIcon,
  ViewListIcon,
  ExploreIcon,
  AdjustIcon,
  AppsIcon,
  CompareArrowsIcon,
  InsightsIcon,
  Checkbox,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  KeyboardArrowDownIcon,
  icons,
} from "@repo/ui/mui"
import GetStartedView from "./getStarted/GetStartedView"
import UnifiedToolLayout from "./components/UnifiedToolLayout"
import ToolToolbar from "./components/ToolToolbar"
import ChartControlsBar from "./components/ChartControlsBar"
import ScenarioSelectionSidebar from "./components/ScenarioSelectionSidebar"
import ShareDrawer from "./components/ShareDrawer"
// import SelectionBanner from "./components/SelectionBanner"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import {
  ComparisonPanel,
  EquityPanel,
  ResiliencePanel,
  RadarPanel,
} from "./exploreView"
import ListView from "./exploreView/ListView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import {
  useScenarioExplorerStore,
  type MainView,
  type ExploreMode,
} from "./store"
import { useMapMode } from "../map/store"
import { usePrefetchTiers } from "./hooks/usePrefetchTiers"
import {
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  ALL_RADAR_AXES_ORDER,
  NOD_CODES,
  SOD_CODES,
  OUTCOME_REGIONAL_VARIANTS,
  getOutcomeName,
  type OutcomeCode,
} from "../../content/outcomes"

// Top-level navigation tabs

const MAIN_VIEWS: { view: MainView; icon: React.ReactNode; label: string }[] = [
  {
    view: "get-started",
    icon: <PlayArrowIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Get started",
  },
  {
    view: "explorer",
    icon: <ExploreIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Go to tools",
  },
]

const TOOL_TABS: {
  mode: ExploreMode
  icon: React.ReactNode
  label: string
  research?: boolean
}[] = [
  {
    mode: "list",
    icon: <ViewListIcon sx={{ fontSize: "1.25rem" }} />,
    label: "List",
  },
  {
    mode: "radar",
    icon: <AdjustIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Radar chart",
  },
  {
    mode: "comparison",
    icon: <CompareArrowsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Scenario comparison",
    research: true,
  },
  {
    mode: "equity",
    icon: <AppsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Distribution comparison",
  },
  {
    mode: "data",
    icon: <InsightsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Data in depth",
  },
]

const CHECKBOX_SX = { padding: 0, margin: 0, transform: "scale(0.85)" } as const

function RadarToggleChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  const theme = useTheme()
  const Icon = active ? icons.CheckCircle : icons.RadioButtonUnchecked

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px: 1.25,
        py: 0.5,
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: 500,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        color: active ? theme.palette.blue.bright : theme.palette.grey[800],
        background: active
          ? theme.palette.interaction.selectedBackground
          : theme.palette.grey[200],
        transition: "all 150ms ease",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
          color: theme.palette.blue.bright,
        },
      }}
    >
      <Icon sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
      {label}
    </Box>
  )
}

function RadarAxesDropdown() {
  const { radarVisibleAxes, toggleRadarAxis, setRadarVisibleAxes } =
    useScenarioExplorerStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const axesSet = useMemo(() => new Set(radarVisibleAxes), [radarVisibleAxes])

  const allKeySelected = OUTCOME_CODE_ORDER.every((c) => axesSet.has(c))
  const someKeySelected =
    !allKeySelected && OUTCOME_CODE_ORDER.some((c) => axesSet.has(c))

  const allRegionalSelected = NOD_SOD_OUTCOME_CODES.every((c) => axesSet.has(c))
  const someRegionalSelected =
    !allRegionalSelected && NOD_SOD_OUTCOME_CODES.some((c) => axesSet.has(c))

  const allNodSelected = NOD_CODES.every((c) => axesSet.has(c))
  const someNodSelected =
    !allNodSelected && NOD_CODES.some((c) => axesSet.has(c))

  const allSodSelected = SOD_CODES.every((c) => axesSet.has(c))
  const someSodSelected =
    !allSodSelected && SOD_CODES.some((c) => axesSet.has(c))

  const toggleGroup = useCallback(
    (codes: readonly string[], allOn: boolean) => {
      if (allOn) {
        const remaining = radarVisibleAxes.filter((c) => !codes.includes(c))
        setRadarVisibleAxes(
          remaining.length > 0 ? remaining : [OUTCOME_CODE_ORDER[0]!],
        )
      } else {
        const merged = [...radarVisibleAxes]
        for (const c of codes) {
          if (!merged.includes(c)) merged.push(c)
        }
        setRadarVisibleAxes(merged)
      }
    },
    [radarVisibleAxes, setRadarVisibleAxes],
  )

  const renderCheckboxItem = (
    key: string,
    label: string,
    checked: boolean,
    indeterminate: boolean,
    onClick: () => void,
    indent: number = 0,
  ) => (
    <MenuItem key={key} dense onClick={onClick} sx={{ pl: 2 + indent * 2 }}>
      <ListItemIcon>
        <Checkbox
          edge="start"
          size="small"
          checked={checked}
          indeterminate={indeterminate}
          sx={CHECKBOX_SX}
        />
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          variant: "compactCaption",
          fontWeight: indent === 0 ? 600 : 400,
        }}
      />
    </MenuItem>
  )

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: "1rem !important",
              transition: "transform 200ms",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        }
        sx={{
          textTransform: "none",
          fontSize: "0.7rem",
          fontWeight: 600,
          lineHeight: 1.2,
          py: 0.25,
          px: 1,
          minHeight: 0,
          borderColor: "divider",
          color: "text.primary",
          borderRadius: 1,
          "&:hover": {
            borderColor: "text.secondary",
            backgroundColor: "action.hover",
          },
        }}
      >
        Axes ({radarVisibleAxes.length}/{ALL_RADAR_AXES_ORDER.length})
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: { sx: { maxHeight: 480, minWidth: 260 } },
        }}
      >
        {/* ── Collection toggles ── */}
        {renderCheckboxItem(
          "_all_key",
          "All key outcomes",
          allKeySelected,
          someKeySelected,
          () => toggleGroup(OUTCOME_CODE_ORDER, allKeySelected),
        )}
        {renderCheckboxItem(
          "_all_regional",
          "All regional outcomes",
          allRegionalSelected,
          someRegionalSelected,
          () => toggleGroup(NOD_SOD_OUTCOME_CODES, allRegionalSelected),
        )}
        {renderCheckboxItem(
          "_nod",
          "North of Delta (NOD)",
          allNodSelected,
          someNodSelected,
          () => toggleGroup(NOD_CODES, allNodSelected),
          1,
        )}
        {renderCheckboxItem(
          "_sod",
          "South of Delta (SOD)",
          allSodSelected,
          someSodSelected,
          () => toggleGroup(SOD_CODES, allSodSelected),
          1,
        )}

        <Divider key="_divider" sx={{ my: 0.5 }} />

        {/* ── Individual axes grouped by key outcome ── */}
        {OUTCOME_CODE_ORDER.flatMap((code) => {
          const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
          return [
            renderCheckboxItem(
              code,
              getOutcomeName(code),
              axesSet.has(code),
              false,
              () => toggleRadarAxis(code),
            ),
            ...(variants?.map((vCode) =>
              renderCheckboxItem(
                vCode,
                getOutcomeName(vCode),
                axesSet.has(vCode),
                false,
                () => toggleRadarAxis(vCode),
                1,
              ),
            ) ?? []),
          ]
        })}
      </Menu>
    </>
  )
}

export default function ScenarioExplorer() {
  const theme = useTheme()
  const { mainView, setMainView, exploreMode, setExploreMode, showMap } =
    useScenarioExplorerStore()
  const mapMode = useMapMode()

  usePrefetchTiers()

  const isGetStartedMapMode =
    mainView === "get-started" && mapMode === "get-started"
  const isExploreMapMode = mainView === "explorer" && showMap
  const needsTransparentBg = isGetStartedMapMode || isExploreMapMode
  // When the map is visible (get-started or explore with map), the root is
  // pointer-events:none so the persistent map behind can receive interactions.
  // Child elements opt back in with pointer-events:auto as needed.
  const isMapPassThrough = isGetStartedMapMode || isExploreMapMode

  // Hover coordination (for sidebar ↔ tool panels in non-list modes)
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null)
  const [hoveredScenarioId, setHoveredScenarioId] = useState<string | null>(
    null,
  )

  // Research-only tools hidden by default, toggled with "A" key
  const [showResearchTools, setShowResearchTools] = useState(false)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      )
        return
      if (e.key === "a" || e.key === "A") {
        if (!e.altKey && !e.ctrlKey && !e.metaKey) {
          setShowResearchTools((v) => !v)
        }
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  const handleSidebarRowHover = useCallback((ids: string[] | null) => {
    setHighlightedIds(ids ? new Set(ids) : null)
  }, [])

  const handleToolScenarioHover = useCallback((scenarioId: string | null) => {
    setHoveredScenarioId(scenarioId)
  }, [])

  const {
    highlightBaseline,
    setHighlightBaseline,
    showRadarRange,
    setShowRadarRange,
    showDotsOnly,
    setShowDotsOnly,
  } = useScenarioExplorerStore()

  const chartControls = useMemo(() => {
    if (exploreMode === "radar") {
      return (
        <ChartControlsBar>
          <RadarAxesDropdown />
          <RadarToggleChip
            label="dots only"
            active={showDotsOnly}
            onClick={() => setShowDotsOnly(!showDotsOnly)}
          />
          <RadarToggleChip
            label="show range"
            active={showRadarRange}
            onClick={() => setShowRadarRange(!showRadarRange)}
          />
          <RadarToggleChip
            label="highlight current operations"
            active={highlightBaseline}
            onClick={() => setHighlightBaseline(!highlightBaseline)}
          />
        </ChartControlsBar>
      )
    }
    return null
  }, [
    exploreMode,
    showDotsOnly,
    setShowDotsOnly,
    showRadarRange,
    setShowRadarRange,
    highlightBaseline,
    setHighlightBaseline,
  ])

  const isListMode = mainView === "explorer" && exploreMode === "list"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        pointerEvents: isMapPassThrough ? "none" : "auto",
        ...(isGetStartedMapMode ? {} : { height: "100%", overflow: "hidden" }),
      }}
    >
      {/* Tab navigation */}
      <Box
        role="tablist"
        aria-label="Explore section tabs"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: theme.zIndex.pageContent,
          flexShrink: 0,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: theme.layout.collapsedTabHeight,
          background: theme.palette.tabPanels.explore,
          lineHeight: 1,
          color: theme.palette.common.white,
          justifyContent: "center",
          gap: 1,
        }}
      >
        {MAIN_VIEWS.map(({ view, icon, label }) => {
          const active = mainView === view
          return (
            <Box
              key={view}
              component="button"
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMainView(view)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.25,
                py: 0.5,
                border: "none",
                borderRadius: theme.borderRadius.sm ?? "4px",
                cursor: "pointer",
                background: active ? "rgba(255,255,255,0.2)" : "transparent",
                color: theme.palette.common.white,
                transition: "background-color 0.15s",
                "&:hover": { background: "rgba(255,255,255,0.15)" },
              }}
            >
              {icon}
              <Typography
                component="span"
                variant="dashboard"
                sx={{
                  fontWeight: active ? 600 : 500,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: theme.palette.text.secondary,
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}

        {mainView === "explorer" && (
          <>
            <Box
              sx={{
                width: "1px",
                height: 20,
                backgroundColor: "rgba(255,255,255,0.35)",
                flexShrink: 0,
                mx: 0.5,
              }}
            />
            <Typography
              component="span"
              sx={{
                fontFamily: theme.typography.tabLabelDocked.fontFamily,
                fontSize: "0.9375rem",
                fontWeight: 500,
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: theme.palette.text.secondary,
                letterSpacing: "0.01em",
                px: 0.5,
              }}
            >
              Select scenarios using key outcomes:
            </Typography>
            {TOOL_TABS.filter((tab) => !tab.research || showResearchTools).map(
              ({ mode, icon, label }) => {
                const active = exploreMode === mode
                return (
                  <React.Fragment key={mode}>
                    {mode === "data" && (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily:
                            theme.typography.tabLabelDocked.fontFamily,
                          fontSize: "0.9375rem",
                          fontWeight: 500,
                          lineHeight: 1,
                          letterSpacing: "0.01em",
                          whiteSpace: "nowrap",
                          color: theme.palette.text.secondary,
                          px: 0.5,
                        }}
                      >
                        View data for selected scenarios:
                      </Typography>
                    )}
                    <Box
                      component="button"
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setExploreMode(mode)}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1.25,
                        py: 0.5,
                        border: "none",
                        borderRadius: theme.borderRadius.sm ?? "4px",
                        cursor: "pointer",
                        background: active
                          ? "rgba(255,255,255,0.2)"
                          : "transparent",
                        color: theme.palette.common.white,
                        transition: "background-color 0.15s",
                        "&:hover": { background: "rgba(255,255,255,0.15)" },
                      }}
                    >
                      {icon}
                      <Typography
                        component="span"
                        variant="dashboard"
                        sx={{
                          fontWeight: active ? 600 : 500,
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  </React.Fragment>
                )
              },
            )}
          </>
        )}
      </Box>

      {/* Content area — when the map is pass-through (get-started or explore
          with map), these wrappers stay pointer-events:none so clicks in the
          map strip fall through to Mapbox. Child tool areas opt back in. */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          ...(isGetStartedMapMode ? {} : { overflow: "hidden" }),
          ...(!isMapPassThrough && { pointerEvents: "auto" }),
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            ...(isGetStartedMapMode ? {} : { overflow: "hidden" }),
            ...(!isMapPassThrough && { pointerEvents: "auto" }),
          }}
        >
          {mainView === "get-started" && <GetStartedView />}

          {mainView === "explorer" && (
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <UnifiedToolLayout
                sidebar={
                  isListMode ? undefined : (
                    <ScenarioSelectionSidebar
                      hoveredScenarioId={hoveredScenarioId}
                      onRowHover={handleSidebarRowHover}
                    />
                  )
                }
                toolbar={<ToolToolbar gridAligned hideTitle={!isListMode} />}
                chartControls={isListMode ? undefined : chartControls}
              >
                {isListMode && (
                  <ListView
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "radar" && (
                  <RadarPanel
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "equity" && <EquityPanel />}
                {exploreMode === "comparison" && (
                  <ComparisonPanel
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "resilience" && <ResiliencePanel />}
                {exploreMode === "data" && <DataExplorerView />}
              </UnifiedToolLayout>
            </Box>
          )}
        </Box>
      </Box>

      <KeyboardShortcuts />
      {mainView === "explorer" && <ShareDrawer />}
    </Box>
  )
}
