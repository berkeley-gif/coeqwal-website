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
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react"
import {
  Box,
  Typography,
  useTheme,
  Checkbox,
  IconButton,
  Tooltip,
  icons,
} from "@repo/ui/mui"
import {
  OutcomeGlyphItem,
  OperationsIconGroup,
  StrategyHeader,
  TierSummaryCell,
  type ChartDataPoint,
  type OutcomeName,
  type ScenarioForDisplay,
} from "../../scenarios/components/shared"
import { useScenarioExplorerStore } from "../store"
import type { OutcomeDisplayMode, ShareItem } from "../store"
import { useOutcomeMapAction } from "../../map/hooks"
import { useTourAnchor } from "../tour/TourAnchorContext"
import type { LayoutMode } from "./StrategyGridHeader"
import type { ScenarioTheme } from "../../../content/scenarios"
import { describeOutcomeLocations } from "../../../content/outcomes"
import { composeAndRasterize } from "../dataExplorer/utils/exportUtils"

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
  const outcomeDisplayMode = useScenarioExplorerStore(
    (s) => s.outcomeDisplayMode,
  )
  const isListMode = useScenarioExplorerStore((s) => s.exploreMode === "list")
  const showDefinitions = useScenarioExplorerStore((s) => s.showDefinitions)
  const addShareItem = useScenarioExplorerStore((s) => s.addShareItem)
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)
  const togglePinnedScenario = useScenarioExplorerStore(
    (s) => s.togglePinnedScenario,
  )

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

  // Bridge the outcome column ref into the tour registry as well. We
  // cannot replace `outcomeColRef` with the tour callback ref because
  // it is also used for the share-image capture above, so we mirror it
  // through an effect.
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

  const handleShare = useCallback(async () => {
    const itemId = crypto.randomUUID()
    const item: ShareItem = {
      id: itemId,
      type: "barChart",
      scenarioId: scenario.scenarioId,
      viewMode: outcomeDisplayMode,
      hydroclimate,
      cachedChartData: scenarioChartData as Record<string, unknown>,
    }

    // Bar-chart row is a composed React layout of many small SVGs
    // (one OutcomeGlyph per outcome). composeAndRasterize stitches
    // them into one stand-alone SVG document at their on-screen
    // positions, then rasterizes a PNG companion.
    const el = outcomeColRef.current
    if (el) {
      try {
        const { svg, dataUrl } = await composeAndRasterize(el)
        item.cachedSvg = svg
        item.cachedImageDataUrl = dataUrl
      } catch {
        // capture failed - scorecard still renders from live data
      }
    }

    addShareItem(item)
  }, [
    scenario.scenarioId,
    outcomeDisplayMode,
    scenarioChartData,
    addShareItem,
    hydroclimate,
  ])
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

/**
 * Inline pin and share icons rendered in the shortcode row of StrategyHeader.
 * Always visible (full opacity). Reverse order of sidebar (pin first, then share).
 */
export function InlineRowActions({
  scenarioId,
  scenarioLabel,
  displayMode,
  isPinned,
  accentColor,
  onShare,
  togglePinnedScenario,
  hidePinning,
  shareIconNudgeTop,
  dense,
  pinTourRef,
  shareTourRef,
}: {
  scenarioId: string
  scenarioLabel: string
  displayMode: OutcomeDisplayMode
  isPinned: boolean
  accentColor: string
  onShare: () => void
  togglePinnedScenario: (id: string) => void
  hidePinning?: boolean
  /** Optional visual offset for the share control (e.g. sidebar alignment) */
  shareIconNudgeTop?: string
  /** Tighter padding and gaps (e.g. radar axis detail foreignObject row) */
  dense?: boolean
  /**
   * List tour: the pin step anchors to this wrapper so the popper and highlight
   * target the pin control, not the whole row.
   */
  pinTourRef?: React.RefCallback<HTMLElement | null>
  shareTourRef?: React.RefCallback<HTMLElement | null>
}) {
  const theme = useTheme()
  const shareItems = useScenarioExplorerStore((s) => s.shareItems)
  const isShared = shareItems.some(
    (s) =>
      s.type === "barChart" &&
      s.scenarioId === scenarioId &&
      s.viewMode === displayMode,
  )
  const [justShared, setJustShared] = useState(false)

  useEffect(() => {
    if (!justShared) return
    const timer = setTimeout(() => setJustShared(false), 3000)
    return () => clearTimeout(timer)
  }, [justShared])

  const viewLabel =
    displayMode === "average"
      ? "Key outcomes average"
      : displayMode === "distribution"
        ? "Key outcomes distribution"
        : "Key outcomes bar chart"

  const shareTooltip = justShared ? (
    <span>
      Saved <strong>{scenarioLabel}</strong> scenario
      <br />
      {viewLabel}
    </span>
  ) : isShared ? (
    <span>
      Already shared: <strong>{scenarioLabel}</strong> scenario
      <br />
      {viewLabel}
    </span>
  ) : (
    <span>
      Share <strong>{scenarioLabel}</strong> scenario
      <br />
      {viewLabel}
    </span>
  )

  const pinTooltip = isPinned ? (
    <span>
      Unpin <strong>{scenarioLabel}</strong> scenario
    </span>
  ) : (
    <span>
      Pin <strong>{scenarioLabel}</strong> scenario
    </span>
  )

  const iconPad = dense ? 0.125 : 0.375
  const iconSize = dense ? "0.8125rem" : "1rem"
  const iconButtonTight = dense
    ? { width: 24, height: 24, minWidth: 24, p: 0.125 }
    : undefined

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: dense ? 0 : 0.25,
        ml: dense ? 0 : 0.25,
      }}
    >
      {!hidePinning && (
        <Box
          component="span"
          ref={pinTourRef}
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          <Tooltip
            title={pinTooltip}
            arrow
            placement="top-start"
            slotProps={{
              popper: {
                modifiers: [
                  { name: "flip", enabled: true },
                  {
                    name: "preventOverflow",
                    enabled: true,
                    options: { boundary: "viewport", padding: 8 },
                  },
                ],
              },
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                togglePinnedScenario(scenarioId)
              }}
              sx={{
                p: iconPad,
                ...iconButtonTight,
                color: isPinned ? accentColor : theme.palette.grey[500],
                "&:hover": {
                  color: isPinned ? accentColor : theme.palette.grey[700],
                },
              }}
            >
              <icons.PushPin
                sx={{
                  fontSize: iconSize,
                  transform: isPinned ? "none" : "rotate(45deg)",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box
        component="span"
        ref={shareTourRef}
        sx={{ display: "inline-flex", alignItems: "center" }}
      >
        <Tooltip
          title={shareTooltip}
          arrow
          placement="top-start"
          slotProps={{
            popper: {
              modifiers: [
                { name: "flip", enabled: true },
                {
                  name: "preventOverflow",
                  enabled: true,
                  options: { boundary: "viewport", padding: 8 },
                },
              ],
            },
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onShare()
              setJustShared(true)
            }}
            sx={{
              p: iconPad,
              ...iconButtonTight,
              ...(shareIconNudgeTop != null && {
                position: "relative",
                top: shareIconNudgeTop,
              }),
              color: isShared
                ? theme.palette.blue.bright
                : theme.palette.grey[500],
              "&:hover": {
                color: isShared
                  ? theme.palette.blue.bright
                  : theme.palette.grey[700],
              },
            }}
          >
            <icons.IosShare sx={{ fontSize: iconSize }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

/**
 * Compact mode content - flexbox-based layout for mobile/condensed view
 */
interface CompactRowContentProps {
  scenario: ScenarioForDisplay
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (displayName: string, name: string) => React.ReactNode
  showThemeBadge?: boolean
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  onIconClick?: (iconId: string) => void
}

function CompactRowContent({
  scenario,
  outcomeNames,
  renderOutcomeItem,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
}: CompactRowContentProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.space.gap.md,
        pl: 0.5,
      }}
    >
      {/* First row: Title/description + Key operations */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: theme.space.gap.lg,
        }}
      >
        <StrategyHeader
          strategy={scenario}
          titleVariant="body2"
          showThemeBadge={showThemeBadge}
          onThemeBadgeClick={onThemeBadgeClick}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.md,
            flexShrink: 0,
          }}
        >
          <Typography
            variant="dashboard"
            sx={{ fontWeight: 500, color: theme.palette.grey[600] }}
          >
            Key operations
          </Typography>
          <OperationsIconGroup
            scenarioId={scenario.scenarioId}
            theme={scenario.theme}
            size="md"
            onIconClick={onIconClick}
          />
        </Box>
      </Box>

      {/* Key outcomes section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.md,
        }}
      >
        <Typography
          variant="dashboard"
          sx={{ fontWeight: 500, color: theme.palette.grey[600] }}
        >
          Key outcomes
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.lg,
          }}
        >
          {/* First 5 outcomes */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              "@container strategy-grid (min-width: 600px)": {
                gridTemplateColumns: "repeat(5, 1fr)",
              },
              gap: theme.space.gap.sm,
            }}
          >
            {outcomeNames
              .slice(0, 5)
              .map(({ shortCode, displayName }) =>
                renderOutcomeItem(shortCode, displayName),
              )}
          </Box>
          {/* Remaining outcomes */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              "@container strategy-grid (min-width: 600px)": {
                gridTemplateColumns: "repeat(5, 1fr)",
              },
              gap: theme.space.gap.sm,
            }}
          >
            {outcomeNames
              .slice(5)
              .map(({ shortCode, displayName }) =>
                renderOutcomeItem(shortCode, displayName),
              )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

/**
 * Non-compact mode content - grid-based layout with vertical dividers
 *
 * In "full" mode (≥ fullBreakpoint): 4 columns inline
 * In "wrapped" mode (600px - fullBreakpoint): 3 columns with outcomes wrapping below
 */
interface NonCompactRowContentProps {
  scenario: ScenarioForDisplay
  layoutMode: LayoutMode
  showOperations?: boolean
  showDescription?: boolean
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (displayName: string, name: string) => React.ReactNode
  showThemeBadge?: boolean
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  onIconClick?: (iconId: string) => void
  isDistributionView?: boolean
  scenarioChartData?: Record<string, ChartDataPoint[]>
}

function NonCompactRowContent({
  scenario,
  layoutMode,
  showOperations = true,
  showDescription = true,
  outcomeNames,
  renderOutcomeItem,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
  isDistributionView = false,
  scenarioChartData = {},
  isPinned = false,
  accentColor,
  handleShare,
  togglePinnedScenario,
  outcomeColRef,
  pinRowTourRef,
  shareRowTourRef,
  operationsRowTourRef,
}: NonCompactRowContentProps & {
  isPinned?: boolean
  accentColor?: string
  handleShare?: () => void
  togglePinnedScenario?: (id: string) => void
  outcomeColRef?: React.RefObject<HTMLDivElement | null>
  pinRowTourRef?: React.RefCallback<HTMLElement | null>
  shareRowTourRef?: React.RefCallback<HTMLElement | null>
  operationsRowTourRef?: React.RefCallback<HTMLElement | null>
}) {
  const theme = useTheme()
  const isListMode = useScenarioExplorerStore((s) => s.exploreMode === "list")
  const outcomeDisplayMode = useScenarioExplorerStore(
    (s) => s.outcomeDisplayMode,
  )

  const isWrappedMode = layoutMode === "wrapped"
  const isCompactMode = layoutMode === "compact"
  const isFullMode = layoutMode === "full"

  const inlineActionsNode =
    isListMode && handleShare && togglePinnedScenario && accentColor ? (
      <Box sx={{ display: "inline-flex", alignItems: "center" }}>
        <InlineRowActions
          scenarioId={scenario.scenarioId}
          scenarioLabel={scenario.label}
          displayMode={outcomeDisplayMode}
          isPinned={isPinned}
          accentColor={accentColor}
          onShare={handleShare}
          togglePinnedScenario={togglePinnedScenario}
          pinTourRef={pinRowTourRef}
          shareTourRef={shareRowTourRef}
        />
      </Box>
    ) : undefined

  const strategyHeaderBlock = (disableTrunc: boolean) => (
    <StrategyHeader
      strategy={scenario}
      titleVariant="body2"
      compact={isListMode}
      showDescription={showDescription}
      disableTruncation={disableTrunc}
      descriptionMaxWidth="none"
      showThemeBadge={showThemeBadge}
      onThemeBadgeClick={onThemeBadgeClick}
      inlineActions={inlineActionsNode}
    />
  )

  return (
    <>
      {/* Columns 2+3: In wrapped/compact mode, merge into a single flex row;
          in full mode, keep as separate subgrid cells */}
      {isFullMode ? (
        <>
          {/* Column 2: Scenario name and description */}
          <Box
            sx={{
              gridColumn: "2",
              minWidth: 0,
              pr: theme.scenarios.grid.divider.gap,
              pt: theme.scenarios.grid.row.padding,
              pb: theme.scenarios.grid.row.padding,
              alignSelf: "start",
            }}
          >
            {strategyHeaderBlock(false)}
          </Box>

          {/* Column 3: Key operations */}
          <Box
            ref={operationsRowTourRef}
            sx={{
              gridColumn: "3",
              borderLeft: `1px solid ${theme.palette.grey[300]}`,
              pl: 1,
              display: "flex",
              flexDirection: "column",
              gap: theme.space.gap.md,
              justifyContent: "flex-start",
              alignItems: "flex-start",
              pt: theme.scenarios.grid.row.padding,
              pb: theme.scenarios.grid.row.padding,
              overflow: "hidden",
              opacity: showOperations ? 1 : 0,
              pointerEvents: showOperations ? "auto" : "none",
              transition: "opacity 200ms ease",
            }}
          >
            <OperationsIconGroup
              scenarioId={scenario.scenarioId}
              theme={scenario.theme}
              size="md"
              onIconClick={onIconClick}
            />
          </Box>
        </>
      ) : (
        <Box
          sx={{
            gridColumn: "2 / -1",
            display: "flex",
            alignItems: "stretch",
            gap: theme.space.gap.xl,
            pt: theme.scenarios.grid.row.padding,
            minWidth: 0,
          }}
        >
          <Box sx={{ flex: "none", width: "50%", minWidth: 0 }}>
            {strategyHeaderBlock(true)}
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: showOperations ? 1 : 0,
              pointerEvents: showOperations ? "auto" : "none",
              transition: "opacity 200ms ease",
            }}
          >
            {isCompactMode && (
              <Typography
                variant="dashboard"
                sx={{
                  color: theme.palette.grey[600],
                  fontWeight: 500,
                  mb: theme.space.gap.md,
                }}
              >
                Key operations
              </Typography>
            )}
            <OperationsIconGroup
              scenarioId={scenario.scenarioId}
              theme={scenario.theme}
              size="md"
              layout="horizontal"
              onIconClick={onIconClick}
            />
          </Box>
        </Box>
      )}

      {/* Column 4: Outcome glyphs - wraps below in wrapped mode */}
      <Box
        ref={outcomeColRef}
        className="outcome-col"
        data-outcome-col-scenario-id={scenario.scenarioId}
        sx={{
          gridColumn:
            layoutMode === "compact" ? "2" : isWrappedMode ? "2 / -1" : "4",
          borderLeft:
            layoutMode === "full"
              ? `1px solid ${theme.palette.grey[300]}`
              : "none",
          pl: layoutMode === "full" ? theme.scenarios.grid.divider.gap : 0,
          pt:
            layoutMode === "full"
              ? theme.scenarios.grid.glyphOffset
              : layoutMode === "wrapped"
                ? theme.space.gap.md
                : theme.space.gap.lg,
          pb: layoutMode === "compact" ? 0 : theme.scenarios.grid.row.padding,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: theme.space.gap.md,
        }}
      >
        {/* Key outcomes label - compact mode only (wrapped uses header row) */}
        {layoutMode === "compact" && (
          <Typography
            variant="dashboard"
            sx={{
              color: theme.palette.grey[600],
              fontWeight: 500,
            }}
          >
            Key outcomes
          </Typography>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              layoutMode === "compact"
                ? "repeat(3, 1fr)"
                : "repeat(auto-fit, minmax(60px, 1fr))",
            gap: theme.space.gap.sm,
            alignItems: isDistributionView ? "flex-start" : undefined,
            mt: 0,
            maxWidth: "100%",
            width: "100%",
          }}
        >
          {outcomeNames.map(({ shortCode, displayName }) =>
            renderOutcomeItem(shortCode, displayName),
          )}
        </Box>
        {isDistributionView && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                layoutMode === "compact"
                  ? "repeat(3, 1fr)"
                  : "repeat(auto-fit, minmax(60px, 1fr))",
              gap: theme.space.gap.sm,
              maxWidth: "100%",
              width: "100%",
            }}
          >
            {outcomeNames.map(({ shortCode }) => {
              const totalLocations =
                scenarioChartData[shortCode]?.[0]?.totalLocations
              const description = describeOutcomeLocations(
                shortCode,
                totalLocations,
              )
              if (!description) return <Box key={`loc-${shortCode}`} />
              return (
                <Typography
                  key={`loc-${shortCode}`}
                  variant="outcomeLabel"
                  sx={{
                    color: theme.palette.grey[500],
                    fontSize: "0.65rem",
                    textAlign: "center",
                    lineHeight: 1.3,
                    px: 0.25,
                  }}
                >
                  {description}
                </Typography>
              )
            })}
          </Box>
        )}
      </Box>
    </>
  )
}

/**
 * Outcomes-only row content - just the outcome glyphs, no title/ops/checkbox.
 * Uses the same CSS grid as OutcomeCategoryLabels in the header so columns align.
 *
 * In distribution view, a second grid row of location descriptions is appended
 * so all descriptions align horizontally across outcomes.
 */
function OutcomesOnlyRowContent({
  outcomeNames,
  renderOutcomeItem,
  isDistributionView = false,
  scenarioChartData = {},
}: {
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (shortCode: string, displayName: string) => React.ReactNode
  isDistributionView?: boolean
  scenarioChartData?: Record<string, ChartDataPoint[]>
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: `repeat(${outcomeNames.length}, 1fr)`,
        columnGap: theme.space.gap.sm,
        rowGap: isDistributionView ? "2px" : theme.space.gap.sm,
        pt: theme.scenarios.grid.glyphOffset,
        pb: theme.scenarios.grid.row.padding,
        pl: theme.scenarios.grid.divider.gap,
        borderLeft: "none",
        "@container strategy-grid (min-width: 600px)": {
          borderLeft: `1px solid ${theme.palette.grey[300]}`,
        },
        alignItems: isDistributionView ? "start" : "end",
      }}
    >
      {outcomeNames.map(({ shortCode, displayName }) =>
        renderOutcomeItem(shortCode, displayName),
      )}
      {isDistributionView &&
        outcomeNames.map(({ shortCode }) => {
          const totalLocations =
            scenarioChartData[shortCode]?.[0]?.totalLocations
          const description = describeOutcomeLocations(
            shortCode,
            totalLocations,
          )
          if (!description) return <Box key={`loc-${shortCode}`} />
          return (
            <Typography
              key={`loc-${shortCode}`}
              variant="outcomeLabel"
              sx={{
                color: theme.palette.grey[500],
                fontSize: "0.65rem",
                textAlign: "center",
                lineHeight: 1.3,
                px: 0.25,
              }}
            >
              {description}
            </Typography>
          )
        })}
    </Box>
  )
}

export default StrategyGridRow
