"use client"

/**
 * StrategyGridRow - Single scenario row in the StrategyGrid
 *
 * Uses CSS subgrid to inherit column definitions from parent StrategyGrid,
 * (ensuring vertical alignment between components)
 *
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react"
import { Box, useTheme, Checkbox } from "@repo/ui/mui"
import {
  OutcomeGlyphItem,
  TierSummaryCell,
  type ChartDataPoint,
  type OutcomeName,
  type ScenarioForDisplay,
} from "../../../../../../scenarios/components/shared"
import { useWorkspaceSlice, useListSlice } from "../../../../store"
import { useOutcomeMapAction } from "../../../../../../map/hooks"
import { useTourAnchor } from "../../../tour"
import type { LayoutMode } from "./StrategyGridHeader"
import type { ScenarioTheme } from "../../../../../../../content/scenarios"
import { captureBarChartRow } from "./captureBarChartRow"
import { stageShareItem } from "../../../../share/stage"
import {
  CompactRowContent,
  NonCompactRowContent,
  OutcomesOnlyRowContent,
} from "./StrategyGridRowLayouts"

export interface StrategyGridRowProps {
  /** Scenario data to display */
  scenario: ScenarioForDisplay
  /** Whether this is the first row (adds top margin) */
  isFirst: boolean
  /**
   * First visible scenario row in the list: only this row registers the List tour
   * pin control anchor (`list.row.pin`). Differs from `isFirst` when group-by-theme
   * is on or when pinned rows precede this block.
   */
  tourListFirstItem?: boolean
  /** Whether this row is highlighted (search result match) */
  isHighlighted: boolean
  /** Whether this scenario is selected/chosen */
  isChosen: boolean
  /** Compact mode uses different layout */
  compact: boolean
  /** Layout mode for responsive behavior */
  layoutMode: LayoutMode
  /** When false, hides the key operations column */
  showOperations?: boolean
  /** When true, only outcomes are shown (no checkbox, title, or ops) */
  outcomesOnly?: boolean
  /** Outcome names with display info */
  outcomeNames: OutcomeName[]
  /** Get chart data for this scenario */
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  /** Currently selected outcome for this scenario */
  selectedOutcome: string | null
  /** Active tooltip outcome name */
  activeTooltip: string | null
  /** Current sort column */
  sortBy: string | null
  /** Sort direction */
  sortDirection: "asc" | "desc"
  /** Whether sort controls are enabled */
  sortEnabled: boolean
  /** Glyph size in pixels */
  glyphSize: number
  /** Whether we're in aligned grid mode (labels in header) */
  isAlignedGrid: boolean
  /** Toggle scenario selection */
  onToggleScenario: (scenarioId: string) => void
  /** Called when a tier glyph is clicked (for map visualization) */
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  /** Toggle tooltip with anchor (may include scenario context for glyph clicks) */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Toggle tooltip without scenario context (for info icon clicks) */
  onInfoTooltipToggle?: (name: string, anchor: HTMLElement) => void
  /** Sort change handler */
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
  /** Whether to show inline theme badge on each row */
  showThemeBadge?: boolean
  /** Select all scenarios sharing a theme when badge is clicked */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Select all scenarios sharing an operation icon when clicked */
  onIconClick?: (iconId: string) => void
  /** Optional color for accent border and swatch */
  scenarioColor?: string
  /** Whether this scenario is pinned */
  isPinned?: boolean
  /** Whether this row is in an "active" state (hovered/highlighted externally) */
  isActive?: boolean
  /** Called on mouse enter/leave for hover sync with other panels */
  onRowHover?: (scenarioIds: string[] | null) => void
}

/**
 * StrategyGridRow renders a single scenario as a grid row.
 */
export const StrategyGridRow = React.memo(function StrategyGridRow({
  scenario,
  isFirst,
  tourListFirstItem = false,
  isHighlighted,
  isChosen,
  compact,
  layoutMode,
  showOperations = true,
  outcomesOnly = false,
  outcomeNames,
  getChartDataForScenario,
  selectedOutcome,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  glyphSize,
  isAlignedGrid,
  onToggleScenario,
  onTierClick,
  onTooltipToggle,
  onInfoTooltipToggle,
  onSortChange,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
  scenarioColor,
  isPinned = false,
  isActive = false,
  onRowHover,
}: StrategyGridRowProps) {
  const theme = useTheme()
  const outcomeDisplayMode = useWorkspaceSlice((s) => s.outcomeDisplayMode)
  const isListMode = useWorkspaceSlice((s) => s.exploreMode === "list")
  const showDefinitions = useWorkspaceSlice((s) => s.showDefinitions)
  const addShareItem = useWorkspaceSlice((s) => s.addShareItem)
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)
  const togglePinnedScenario = useListSlice((s) => s.togglePinnedScenario)

  const accentColor = scenarioColor || theme.palette.blue.bright
  const outcomeColRef = useRef<HTMLDivElement>(null)
  const listBarChartTourCellRef = useRef<HTMLDivElement | null>(null)
  const glyphRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Tour anchors. Only the first list exemplar row registers (see
  // `tourListFirstItem`), so the tour highlights one checkbox / pin / share
  // instead of bulk-registering all rows.
  const listSelectCheckboxTourRef = useTourAnchor("list.select.checkbox")
  const listOutcomeBarChartTourRef = useTourAnchor("list.outcome.barChart")
  const listRowPinTourRef = useTourAnchor("list.row.pin")
  const listRowShareTourRef = useTourAnchor("list.row.share")
  const listRowOperationsTourRef = useTourAnchor("list.row.operations")
  const outcomeColAnchorRef = useTourAnchor("list.outcome.column")

  // Bridge the outcome column ref into the tour registry. Mirroring
  // through an effect lets `outcomeColRef` stay a stable React ref
  // while still notifying the tour anchor whenever the first row
  // remounts.
  useEffect(() => {
    if (!isFirst) return
    outcomeColAnchorRef(outcomeColRef.current)
    return () => outcomeColAnchorRef(null)
  }, [isFirst, outcomeColAnchorRef])

  const firstListOutcomeShort = outcomeNames[0]?.shortCode
  const glyphBoxRefByShortCode = useMemo(() => {
    const m = new Map<string, (el: HTMLDivElement | null) => void>()
    for (const { shortCode } of outcomeNames) {
      m.set(shortCode, (el) => {
        glyphRefs.current[shortCode] = el
        if (
          tourListFirstItem &&
          isListMode &&
          firstListOutcomeShort === shortCode
        ) {
          listBarChartTourCellRef.current =
            outcomeDisplayMode === "bar" ? el : null
        }
      })
    }
    return m
  }, [
    outcomeNames,
    tourListFirstItem,
    isListMode,
    firstListOutcomeShort,
    outcomeDisplayMode,
  ])

  // Tour anchor for the bar-chart step: useLayoutEffect + stable glyph refs
  // so we never register in an inline ref callback. Inline callbacks get a
  // new identity every parent render. React detaches/reattaches, toggling
  // the anchor and triggering TourAnchorContext notify loops.
  useLayoutEffect(() => {
    if (!tourListFirstItem || !isListMode || outcomeDisplayMode !== "bar") {
      listOutcomeBarChartTourRef(null)
      return
    }
    listOutcomeBarChartTourRef(listBarChartTourCellRef.current)
    return () => {
      listOutcomeBarChartTourRef(null)
    }
  }, [
    tourListFirstItem,
    isListMode,
    outcomeDisplayMode,
    listOutcomeBarChartTourRef,
  ])

  // Map visualization hook
  const { showOutcomeOnMap, isOutcomeActive, isMapVisible } =
    useOutcomeMapAction()

  // Get chart data for this scenario
  const scenarioChartData = getChartDataForScenario(scenario.scenarioId)

  const handleShare = useCallback(
    () =>
      stageShareItem({
        capture: () =>
          captureBarChartRow({
            outcomeNames,
            chartData: scenarioChartData,
            viewMode: outcomeDisplayMode,
            theme,
            glyphSize,
          }),
        buildItem: (captured) => ({
          id: crypto.randomUUID(),
          type: "barChart",
          scenarioId: scenario.scenarioId,
          viewMode: outcomeDisplayMode,
          hydroclimate,
          cachedChartData: scenarioChartData as Record<string, unknown>,
          cachedSvg: captured?.svg,
          cachedImageDataUrl: captured?.dataUrl,
        }),
        addItem: addShareItem,
        errorLabel: "StrategyGridRow.handleShare",
      }),
    [
      scenario.scenarioId,
      outcomeDisplayMode,
      scenarioChartData,
      addShareItem,
      hydroclimate,
      outcomeNames,
      theme,
      glyphSize,
    ],
  )
  const isDistributionView = isListMode && outcomeDisplayMode === "distribution"

  const handleOutcomeClick = (shortCode: string) => {
    const anchor = glyphRefs.current[shortCode]
    if (anchor) {
      onTooltipToggle(shortCode, anchor)
    }
    onTierClick?.(scenario.scenarioId, shortCode)
  }

  /**
   * Render a single outcome item. The visualization depends on the
   * current tool context and the outcomeDisplayMode toggle:
   *
   * List view:
   *   average      → TierSummaryCell
   *   bar          → OutcomeGlyphItem (bars)
   *   distribution → OutcomeGlyphItem (distribution squares)
   *
   * Other tools:
   *   average      → TierSummaryCell (compact heatmap)
   *   bar          → OutcomeGlyphItem (bars)
   *   distribution → OutcomeGlyphItem (bars)
   */
  const renderOutcomeItem = (shortCode: string, displayName: string) => {
    const chartData = scenarioChartData[shortCode]
    const isActive = chartData !== undefined && chartData.length > 0
    const isSelected = selectedOutcome === displayName
    const isSorted = sortBy === shortCode
    const glyphRefFor = glyphBoxRefByShortCode.get(shortCode)

    // The list tour's map step replays a real click on this cell. When
    // this render is that anchored cell, tag the wrapper with data-*
    // attributes so ToolTour can read (scenarioId, outcomeCode) straight
    // off the anchor element without coupling to the tour system here.
    const isTourAnchorCell =
      tourListFirstItem &&
      isListMode &&
      outcomeDisplayMode === "bar" &&
      firstListOutcomeShort === shortCode
    const tourCellDataAttrs = isTourAnchorCell
      ? {
          "data-tour-scenario-id": scenario.scenarioId,
          "data-tour-outcome-code": shortCode,
        }
      : undefined

    if (outcomeDisplayMode === "average") {
      return (
        <Box key={shortCode} ref={glyphRefFor} {...tourCellDataAttrs}>
          <TierSummaryCell
            chartData={chartData}
            isActive={isActive}
            isTooltipActive={activeTooltip === shortCode}
            onClick={() => handleOutcomeClick(shortCode)}
            mode={isListMode ? "numeric" : "label"}
          />
        </Box>
      )
    }

    // All other cases use the full OutcomeGlyphItem shell.
    // In list mode + distribution toggle, override variant to "distribution".
    const variantOverride =
      isListMode && outcomeDisplayMode === "distribution"
        ? ("distribution" as const)
        : undefined
    const showLabelBelowGlyph = !isAlignedGrid
    const showControlsBelowGlyph = !isAlignedGrid

    return (
      <Box key={shortCode} ref={glyphRefFor} {...tourCellDataAttrs}>
        <OutcomeGlyphItem
          displayName={displayName}
          name={displayName}
          outcomeCode={shortCode}
          chartData={chartData}
          isActive={isActive}
          isSelected={
            isSelected || isOutcomeActive(shortCode, scenario.scenarioId)
          }
          isTooltipActive={activeTooltip === shortCode}
          variant={variantOverride}
          morphEnabled={isListMode}
          size={glyphSize}
          showLabel={showLabelBelowGlyph}
          showInfoButton={showControlsBelowGlyph}
          showSortButton={showControlsBelowGlyph && sortEnabled}
          sortState={isSorted ? sortDirection : null}
          onGlyphClick={
            isMapVisible
              ? () => showOutcomeOnMap(shortCode, scenario.scenarioId)
              : undefined
          }
          onInfoClick={(e) => {
            ;(onInfoTooltipToggle ?? onTooltipToggle)(
              shortCode,
              e.currentTarget,
            )
          }}
          onSortToggle={(newState) => {
            if (newState === null) {
              onSortChange?.(null, "asc")
            } else {
              onSortChange?.(shortCode, newState)
            }
          }}
        />
      </Box>
    )
  }

  return (
    <Box
      onMouseEnter={
        onRowHover ? () => onRowHover([scenario.scenarioId]) : undefined
      }
      onMouseLeave={onRowHover ? () => onRowHover(null) : undefined}
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: outcomesOnly
          ? "1fr"
          : compact
            ? "32px 1fr"
            : "subgrid",
        "--row-bg": isActive
          ? `${accentColor}1A`
          : isHighlighted
            ? theme.palette.common.white
            : "#faf8f5",
        backgroundColor: "var(--row-bg)",
        borderRadius: theme.borderRadius.sm,
        ...(compact && {
          py: theme.scenarios.grid.row.padding,
          px: theme.space.component.xl,
        }),
        rowGap: theme.scenarios.grid.row.internalGap,
        alignItems: "stretch",
        transition:
          "background-color 0.2s ease, border-color 0.2s ease, border-left-color 0.2s ease",
        outline: isHighlighted
          ? `1px solid ${theme.palette.blue.bright}`
          : "none",
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
        "&:hover": {
          "--row-bg": isActive
            ? `${accentColor}26`
            : theme.palette.background.paper,
          backgroundColor: "var(--row-bg)",
        },
        "&:last-child": {
          borderBottom: "1px solid transparent",
        },
        ...(isFirst && { marginTop: theme.scenarios.grid.row.firstOffset }),
      }}
    >
      {outcomesOnly ? (
        <OutcomesOnlyRowContent
          outcomeNames={outcomeNames}
          renderOutcomeItem={renderOutcomeItem}
          isDistributionView={isDistributionView}
          scenarioChartData={scenarioChartData}
        />
      ) : (
        <>
          {/* Column 1: Checkbox */}
          <Box
            ref={
              tourListFirstItem && isListMode
                ? listSelectCheckboxTourRef
                : undefined
            }
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              alignSelf: "start",
              mr: -0.5,
              ...(!compact && {
                pt: isListMode
                  ? theme.spacing(theme.scenarios.grid.row.padding as number)
                  : `calc(${theme.spacing(theme.scenarios.grid.row.padding as number)} + 20px)`,
                pb: theme.scenarios.grid.row.padding,
              }),
              ...(compact && { gridRow: "1 / -1" }),
            }}
          >
            <Checkbox
              size="small"
              checked={isChosen}
              onChange={() => onToggleScenario(scenario.scenarioId)}
              slotProps={{
                input: { "aria-label": `Select ${scenario.label} scenario` },
              }}
              sx={{
                ...theme.scenarios.checkbox.sm,
                cursor: "pointer",
              }}
            />
          </Box>

          {/* Content: compact vs non-compact layout */}
          {compact ? (
            <CompactRowContent
              scenario={scenario}
              outcomeNames={outcomeNames}
              renderOutcomeItem={renderOutcomeItem}
              showThemeBadge={showThemeBadge}
              onThemeBadgeClick={onThemeBadgeClick}
              onIconClick={onIconClick}
            />
          ) : (
            <NonCompactRowContent
              scenario={scenario}
              layoutMode={layoutMode}
              showOperations={showOperations}
              showDescription={showDefinitions}
              outcomeNames={outcomeNames}
              renderOutcomeItem={renderOutcomeItem}
              showThemeBadge={showThemeBadge}
              onThemeBadgeClick={onThemeBadgeClick}
              onIconClick={onIconClick}
              isDistributionView={isDistributionView}
              scenarioChartData={scenarioChartData}
              isPinned={isPinned}
              accentColor={accentColor}
              handleShare={handleShare}
              togglePinnedScenario={togglePinnedScenario}
              outcomeColRef={outcomeColRef}
              pinRowTourRef={
                tourListFirstItem && isListMode ? listRowPinTourRef : undefined
              }
              shareRowTourRef={
                tourListFirstItem && isListMode
                  ? listRowShareTourRef
                  : undefined
              }
              operationsRowTourRef={
                tourListFirstItem && isListMode
                  ? listRowOperationsTourRef
                  : undefined
              }
            />
          )}
        </>
      )}
    </Box>
  )
})

export { InlineRowActions } from "./InlineRowActions"
