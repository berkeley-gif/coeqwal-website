"use client"

/**
 * StrategyGridContent - Scenario rows container for StrategyGrid
 *
 * Maps scenarios to StrategyGridRow components and handles:
 * - Search result dividers between highlighted and non-highlighted rows
 * - Filtering based on showOnlyChosen state
 *
 * This component is rendered when renderMode is "contentOnly" or "all".
 *
 * @see StrategyGridRow for individual row rendering
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useCallback, useMemo } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { PanelFeedback } from "@repo/ui"
import type {
  ChartDataPoint,
  OutcomeName,
  ScenarioForDisplay,
} from "../../scenarios/components/shared"
import { StrategyGridRow } from "./StrategyGridRow"
import type { LayoutMode } from "./StrategyGridHeader"
import type { TooltipScenarioContext } from "../../tooltips/useTierTooltipState"
import type { ScenarioTheme } from "../../../content/scenarios"
import ThemeGroupHeader from "../components/ThemeGroupHeader"

export interface StrategyGridContentProps {
  /** Scenarios to display */
  scenarios: ScenarioForDisplay[]
  /** Set of highlighted scenario IDs (search matches) */
  highlightedScenarios: Set<string>
  /** Whether to show search divider between highlighted and non-highlighted */
  showSearchDivider: boolean
  /** Set of scenario IDs matching the active theme filter */
  themeMatchingScenarioIds?: Set<string>
  /** Whether to show a divider after the theme-matching group */
  showThemeDivider?: boolean
  /** Whether to show dividers between all adjacent scenarios with different themes */
  showAllThemeDividers?: boolean
  /** When true, shows ThemeGroupHeader subheaders above each theme group */
  groupByTheme?: boolean
  /**
   * When false with groupByTheme, order interleaves themes: hide subheaders, show per-row theme badges
   * @default true
   */
  scenariosInContiguousThemeOrder?: boolean
  /** Set of scenario IDs matching the active icon filter */
  iconMatchingScenarioIds?: Set<string>
  /** Whether to show a divider after the icon-matching group */
  showIconDivider?: boolean
  /** Selected/chosen scenario IDs */
  selectedScenarios: string[]
  /** Show only chosen scenarios */
  showOnlyChosen: boolean
  /** Show alternative baseline scenarios */
  showAlternativeBaselines: boolean
  /** Compact layout mode */
  compact: boolean
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
  /** When false, hides the key operations column */
  showOperations?: boolean
  /** When true, only outcomes are shown (no checkbox, title, or ops columns) */
  outcomesOnly?: boolean
  /** Outcome names with display info */
  outcomeNames: OutcomeName[]
  /** Get chart data for a scenario */
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  /** Currently selected outcomes per scenario */
  selectedOutcomes: Record<string, string | null>
  /** Active tooltip outcome name */
  activeTooltip: string | null
  /** Current sort column */
  sortBy: string | null
  /** Sort direction */
  sortDirection: "asc" | "desc"
  /** Whether sort is enabled */
  sortEnabled: boolean
  /** Glyph size in pixels */
  glyphSize: number
  /** Whether in aligned grid mode */
  isAlignedGrid: boolean
  /** Toggle scenario selection */
  onToggleScenario: (scenarioId: string) => void
  /** Called when a tier glyph is clicked (for map visualization) */
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  /** Toggle tooltip (basic - no scenario context) */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Toggle tooltip with scenario context (for accessibility) */
  onTooltipToggleWithContext?: (
    name: string,
    anchor: HTMLElement,
    context: TooltipScenarioContext,
  ) => void
  /** Sort change handler */
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
  /** Select all scenarios sharing a theme when badge is clicked */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Select all scenarios sharing an operation icon when clicked */
  onIconClick?: (iconId: string) => void
  /** Map of scenario ID to color for accent border / swatch */
  scenarioColors?: Record<string, string>
  /** Set of pinned scenario IDs */
  pinnedScenarioIds?: string[]
  /** Set of externally active (hovered/highlighted) scenario IDs */
  activeScenarioIds?: Set<string>
  /** Called on mouse enter/leave for hover sync with other panels */
  onRowHover?: (scenarioIds: string[] | null) => void
}

/**
 * StrategyGridContent renders the list of scenario rows with support for
 * search highlighting, summary panels, and search result dividers.
 */
export function StrategyGridContent({
  scenarios,
  highlightedScenarios,
  showSearchDivider,
  themeMatchingScenarioIds,
  showThemeDivider = false,
  showAllThemeDividers = false,
  groupByTheme = false,
  scenariosInContiguousThemeOrder = true,
  iconMatchingScenarioIds,
  showIconDivider = false,
  selectedScenarios,
  showOnlyChosen,
  showAlternativeBaselines,
  compact,
  layoutMode,
  showOperations = true,
  outcomesOnly = false,
  outcomeNames,
  getChartDataForScenario,
  selectedOutcomes,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  glyphSize,
  isAlignedGrid,
  onToggleScenario,
  onTierClick,
  onTooltipToggle,
  onTooltipToggleWithContext,
  onSortChange,
  onThemeBadgeClick,
  onIconClick,
  scenarioColors,
  pinnedScenarioIds = [],
  activeScenarioIds,
  onRowHover,
}: StrategyGridContentProps) {
  const theme = useTheme()

  // The primary baseline scenario, shown by default, others hidden until expanded
  const PRIMARY_BASELINE_ID = "s0020"

  // Filter scenarios: chosen-only takes precedence, then baseline visibility
  const displayScenarios = (() => {
    // When showing only chosen scenarios, respect that fully - no baseline filtering
    if (showOnlyChosen) {
      return scenarios.filter((s) => selectedScenarios.includes(s.scenarioId))
    }
    // When showing all: hide alternative baselines unless toggled on
    if (!showAlternativeBaselines) {
      return scenarios.filter(
        (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
      )
    }
    return scenarios
  })()

  const hasThemedScenarios = useMemo(
    () => displayScenarios.some((s) => Boolean(s.theme)),
    [displayScenarios],
  )
  // Subheaders only when theme order allows and at least one row is themed; else row badges
  const themeSubheaderMode =
    groupByTheme && scenariosInContiguousThemeOrder && hasThemedScenarios
  const showThemeBadgeUnpinned = !themeSubheaderMode

  const pinnedSet = useMemo(
    () => new Set(pinnedScenarioIds),
    [pinnedScenarioIds],
  )

  const pinnedScenarios = useMemo(
    () => displayScenarios.filter((s) => pinnedSet.has(s.scenarioId)),
    [displayScenarios, pinnedSet],
  )

  const unpinnedScenarios = useMemo(
    () => displayScenarios.filter((s) => !pinnedSet.has(s.scenarioId)),
    [displayScenarios, pinnedSet],
  )

  // Pre-compute scenario IDs per theme for ThemeGroupHeader (full display set)
  const themeScenarioIds = useMemo(() => {
    if (!themeSubheaderMode) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    for (const s of displayScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    return map
  }, [themeSubheaderMode, displayScenarios])

  // For pinned section: only show theme header when ALL scenarios
  // in that theme (from the display set) are pinned together.
  const pinnedThemeScenarioIds = useMemo(() => {
    if (!themeSubheaderMode || pinnedScenarios.length === 0)
      return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    for (const s of pinnedScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    // Only keep themes where ALL display-set scenarios are pinned
    for (const [theme, pinnedIds] of map) {
      const totalIds = themeScenarioIds.get(theme) ?? []
      if (pinnedIds.length < totalIds.length) {
        map.delete(theme)
      }
    }
    return map
  }, [themeSubheaderMode, pinnedScenarios, themeScenarioIds])

  // Create context-aware tooltip handler for a specific scenario
  const createTooltipHandler = useCallback(
    (scenario: ScenarioForDisplay) => (name: string, anchor: HTMLElement) => {
      if (onTooltipToggleWithContext) {
        const scenarioChartData = getChartDataForScenario(scenario.scenarioId)
        const outcomeChartData = scenarioChartData[name]

        onTooltipToggleWithContext(name, anchor, {
          scenarioId: scenario.scenarioId,
          scenarioLabel: scenario.label,
          chartData: outcomeChartData,
        })
      } else {
        onTooltipToggle(name, anchor)
      }
    },
    [onTooltipToggle, onTooltipToggleWithContext, getChartDataForScenario],
  )

  /** Render a list of scenarios as grid rows with dividers and optional theme headers. */
  const renderScenarioRows = (
    list: ScenarioForDisplay[],
    opts: {
      themeIds: Map<string, string[]>
      isFirstGroup: boolean
      /** Pinned block always had row theme badges; keep when subheaders are partial/empty */
      showThemeBadgeInPinnedSection?: boolean
      /**
       * True for the block that contains the first visible list row (pinned head
       * or unpinned list). Used so the `list.row.pin` tour anchor attaches to the
       * first row that has pin and share controls, even with group-by-theme or mixed pinned sections.
       */
      registerTourFirstListItem: boolean
    },
  ) =>
    list.flatMap((scenario, index, arr) => {
      const isHighlighted = highlightedScenarios.has(scenario.scenarioId)
      const nextScenario = arr[index + 1]
      const isNextHighlighted = nextScenario
        ? highlightedScenarios.has(nextScenario.scenarioId)
        : false

      const shouldShowDivider =
        showSearchDivider && isHighlighted && !isNextHighlighted

      const isThemeMatch =
        themeMatchingScenarioIds?.has(scenario.scenarioId) ?? false
      const isNextThemeMatch = nextScenario
        ? (themeMatchingScenarioIds?.has(nextScenario.scenarioId) ?? false)
        : false
      const shouldShowThemeDivider =
        showThemeDivider && isThemeMatch && !isNextThemeMatch

      const isIconMatch =
        iconMatchingScenarioIds?.has(scenario.scenarioId) ?? false
      const isNextIconMatch = nextScenario
        ? (iconMatchingScenarioIds?.has(nextScenario.scenarioId) ?? false)
        : false
      const shouldShowIconDivider =
        showIconDivider && isIconMatch && !isNextIconMatch

      const shouldShowThemeGroupDivider =
        !themeSubheaderMode &&
        showAllThemeDividers &&
        nextScenario !== undefined &&
        scenario.theme !== nextScenario.theme

      const rows: React.ReactNode[] = []

      if (themeSubheaderMode && scenario.theme) {
        const prevScenario = index > 0 ? arr[index - 1] : undefined
        const isNewGroup = index === 0 || scenario.theme !== prevScenario?.theme
        if (isNewGroup) {
          const ids = opts.themeIds.get(scenario.theme) ?? []
          if (ids.length > 0) {
            rows.push(
              <ThemeGroupHeader
                key={`theme-header-${scenario.scenarioId}`}
                themeKey={scenario.theme as ScenarioTheme}
                scenarioIds={ids}
                isFirst={opts.isFirstGroup && index === 0}
              />,
            )
          }
        }
      }

      rows.push(
        <StrategyGridRow
          key={scenario.scenarioId}
          scenario={scenario}
          isFirst={!themeSubheaderMode && opts.isFirstGroup && index === 0}
          tourListFirstItem={opts.registerTourFirstListItem && index === 0}
          isHighlighted={isHighlighted}
          isChosen={selectedScenarios.includes(scenario.scenarioId)}
          compact={compact}
          layoutMode={layoutMode}
          showOperations={showOperations}
          outcomesOnly={outcomesOnly}
          outcomeNames={outcomeNames}
          getChartDataForScenario={getChartDataForScenario}
          selectedOutcome={selectedOutcomes[scenario.scenarioId] ?? null}
          activeTooltip={activeTooltip}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sortEnabled={sortEnabled}
          glyphSize={glyphSize}
          isAlignedGrid={isAlignedGrid}
          onToggleScenario={onToggleScenario}
          onTierClick={onTierClick}
          onTooltipToggle={createTooltipHandler(scenario)}
          onInfoTooltipToggle={onTooltipToggle}
          onSortChange={onSortChange}
          showThemeBadge={
            opts.showThemeBadgeInPinnedSection === true
              ? true
              : showThemeBadgeUnpinned
          }
          onThemeBadgeClick={onThemeBadgeClick}
          onIconClick={onIconClick}
          scenarioColor={scenarioColors?.[scenario.scenarioId]}
          isPinned={pinnedSet.has(scenario.scenarioId)}
          isActive={activeScenarioIds?.has(scenario.scenarioId) ?? false}
          onRowHover={onRowHover}
        />,
      )

      if (shouldShowDivider) {
        rows.push(
          <Box
            key={`divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }

      if (shouldShowThemeDivider) {
        rows.push(
          <Box
            key={`theme-divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }

      if (shouldShowIconDivider) {
        rows.push(
          <Box
            key={`icon-divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }

      if (shouldShowThemeGroupDivider) {
        rows.push(
          <Box
            key={`theme-group-divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }

      return rows
    })

  if (displayScenarios.length === 0 && showOnlyChosen) {
    return (
      <PanelFeedback
        variant="empty"
        title="No scenarios chosen yet"
        message="Select scenarios using the checkboxes, then toggle &ldquo;chosen only&rdquo; to filter"
        sx={{ gridColumn: "1 / -1" }}
      />
    )
  }

  const hasPinned = pinnedScenarios.length > 0

  return (
    <>
      {/* Sticky pinned rows - stick at top of scroll area */}
      {hasPinned && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "grid",
            gridTemplateColumns: "subgrid",
            position: "sticky",
            top: 0,
            zIndex: 2,
            backgroundColor: "#faf8f5",
            boxShadow: `
              -${theme.spacing(theme.space.tool.px)} 0 0 0 ${theme.palette.grey[100]},
               ${theme.spacing(theme.space.tool.px)} 0 0 0 ${theme.palette.grey[100]},
               0 -12px 0 0 #faf8f5,
               0 4px 8px -2px rgba(0,0,0,0.1)
            `,
          }}
        >
          {renderScenarioRows(pinnedScenarios, {
            themeIds: pinnedThemeScenarioIds,
            isFirstGroup: true,
            showThemeBadgeInPinnedSection: true,
            registerTourFirstListItem: hasPinned,
          })}
        </Box>
      )}

      {/* Unpinned rows - scroll normally */}
      {renderScenarioRows(unpinnedScenarios, {
        themeIds: themeScenarioIds,
        isFirstGroup: !hasPinned,
        registerTourFirstListItem: !hasPinned && unpinnedScenarios.length > 0,
      })}
    </>
  )
}

export default StrategyGridContent
