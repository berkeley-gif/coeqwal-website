"use client"

/**
 * StrategyGridRow - Single scenario row in the StrategyGrid
 *
 * Uses CSS subgrid to inherit column definitions from parent StrategyGrid,
 * (ensuring vertical alignment between components)
 *
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useRef, useState, useEffect } from "react"
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
import { useMapVisualizationAction, useActiveMapOutcome } from "../../map/hooks"
import type { LayoutMode } from "./StrategyGridHeader"
import type { ScenarioTheme } from "../../../content/scenarios"
import { describeOutcomeLocations } from "../../../content/outcomes"

export interface StrategyGridRowProps {
  /** Scenario data to display */
  scenario: ScenarioForDisplay
  /** Whether this is the first row (adds top margin) */
  isFirst: boolean
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
  /** Show alternative baseline scenarios */
  showAlternativeBaselines: boolean
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
  /** Toggle tooltip with anchor */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Sort change handler */
  onSortChange?: (outcomeCode: string | null, direction: "asc" | "desc") => void
  /** Whether to show inline theme badge on each row */
  showThemeBadge?: boolean
  /** Select all scenarios sharing a theme when badge is clicked */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Select all scenarios sharing an operation icon when clicked */
  onIconClick?: (iconId: string) => void
  /** Show share/pin action buttons on each row */
  showActions?: boolean
  /** Show left accent border on active/chosen/pinned rows */
  accentBorder?: boolean
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
  onSortChange,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
  showActions = false,
  accentBorder = false,
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
  const sharedScenarioIds = useScenarioExplorerStore((s) => s.sharedScenarioIds)
  const addToShare = useScenarioExplorerStore((s) => s.addToShare)
  const togglePinnedScenario = useScenarioExplorerStore(
    (s) => s.togglePinnedScenario,
  )

  const accentColor = scenarioColor || theme.palette.blue.bright
  const isShared = sharedScenarioIds.includes(scenario.scenarioId)

  // Map visualization hooks
  const { showOnMapForGroup, isMapVisible } = useMapVisualizationAction()
  const activeMapOutcome = useActiveMapOutcome()

  // Get chart data for this scenario
  const scenarioChartData = getChartDataForScenario(scenario.scenarioId)
  const isDistributionView = isListMode && outcomeDisplayMode === "distribution"

  // Refs to store glyph container elements for tooltip anchoring
  const glyphRefs = useRef<Record<string, HTMLDivElement | null>>({})

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
   *   summary      → OutcomeGlyphItem (bars)
   *   distribution → OutcomeGlyphItem (distribution squares)
   *
   * Other tools:
   *   summary      → TierSummaryCell (compact heatmap)
   *   distribution → OutcomeGlyphItem (bars)
   */
  const renderOutcomeItem = (shortCode: string, displayName: string) => {
    const chartData = scenarioChartData[shortCode]
    const isActive = chartData !== undefined && chartData.length > 0
    const isSelected = selectedOutcome === displayName
    const isSorted = sortBy === shortCode

    // Non-list + summary toggle → compact heatmap cell
    if (!isListMode && outcomeDisplayMode === "summary") {
      return (
        <Box
          key={shortCode}
          ref={(el: HTMLDivElement | null) => {
            glyphRefs.current[shortCode] = el
          }}
        >
          <TierSummaryCell
            chartData={chartData}
            isActive={isActive}
            isTooltipActive={activeTooltip === shortCode}
            onClick={() => handleOutcomeClick(shortCode)}
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
      <Box
        key={shortCode}
        ref={(el: HTMLDivElement | null) => {
          glyphRefs.current[shortCode] = el
        }}
      >
        <OutcomeGlyphItem
          displayName={displayName}
          name={displayName}
          outcomeCode={shortCode}
          chartData={chartData}
          isActive={isActive}
          isSelected={
            isSelected ||
            (isMapVisible &&
              activeMapOutcome?.outcomeCode === shortCode &&
              (activeMapOutcome?.siblingGroupId ??
                activeMapOutcome?.scenarioId) === scenario.scenarioId)
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
              ? () => showOnMapForGroup(shortCode, scenario.scenarioId)
              : undefined
          }
          onInfoClick={(e) => {
            onTooltipToggle(shortCode, e.currentTarget)
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
        ...(accentBorder && {
          borderLeft: `3px solid ${
            isActive || isChosen || isPinned ? accentColor : "transparent"
          }`,
        }),
        "&:hover": {
          "--row-bg": isActive
            ? `${accentColor}26`
            : theme.palette.background.paper,
          backgroundColor: "var(--row-bg)",
          ...(accentBorder && { borderLeftColor: accentColor }),
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
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              alignSelf: "start",
              mr: -0.5,
              ...(!compact && {
                pt: `calc(${theme.spacing(theme.scenarios.grid.row.padding as number)} + 20px)`,
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
              addToShare={addToShare}
              togglePinnedScenario={togglePinnedScenario}
            />
          )}

          {showActions && (
            <RowActions
              scenarioId={scenario.scenarioId}
              isActive={isActive}
              isPinned={isPinned}
              isShared={isShared}
              accentColor={accentColor}
              addToShare={addToShare}
              togglePinnedScenario={togglePinnedScenario}
            />
          )}
        </>
      )}
    </Box>
  )
})

/**
 * Share / pin action buttons — shown when showActions is true.
 * Positioned as a flex column overlaid at the row's trailing edge.
 */
interface RowActionsProps {
  scenarioId: string
  isActive: boolean
  isPinned: boolean
  isShared: boolean
  accentColor: string
  addToShare: (id: string) => void
  togglePinnedScenario: (id: string) => void
}

/**
 * Inline pin and share icons rendered in the shortcode row of StrategyHeader.
 * Always visible (full opacity). Reverse order of sidebar (pin first, then share).
 */
function InlineRowActions({
  scenarioId,
  scenarioLabel,
  displayMode,
  isPinned,
  accentColor,
  addToShare,
  togglePinnedScenario,
}: {
  scenarioId: string
  scenarioLabel: string
  displayMode: "summary" | "distribution"
  isPinned: boolean
  accentColor: string
  addToShare: (id: string) => void
  togglePinnedScenario: (id: string) => void
}) {
  const theme = useTheme()
  const sharedScenarioIds = useScenarioExplorerStore((s) => s.sharedScenarioIds)
  const shareKey = `${scenarioId}:${displayMode}`
  const isShared = sharedScenarioIds.includes(shareKey)
  const [justShared, setJustShared] = useState(false)

  useEffect(() => {
    if (!justShared) return
    const timer = setTimeout(() => setJustShared(false), 3000)
    return () => clearTimeout(timer)
  }, [justShared])

  const viewLabel =
    displayMode === "distribution"
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

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        ml: 0.25,
      }}
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
            p: 0.25,
            color: isPinned ? accentColor : theme.palette.grey[400],
          }}
        >
          <icons.PushPin
            sx={{
              fontSize: "0.85rem",
              transform: isPinned ? "none" : "rotate(45deg)",
            }}
          />
        </IconButton>
      </Tooltip>
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
            addToShare(shareKey)
            setJustShared(true)
          }}
          sx={{
            p: 0.25,
            color: isShared
              ? theme.palette.blue.bright
              : theme.palette.grey[400],
          }}
        >
          <icons.IosShare sx={{ fontSize: "0.85rem" }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

function RowActions({
  scenarioId,
  isActive,
  isPinned,
  isShared,
  accentColor,
  addToShare,
  togglePinnedScenario,
}: RowActionsProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "-1",
        gridRow: "1 / -1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 0.25,
        pt: 1,
        pr: 0.5,
      }}
    >
      <Tooltip title={isShared ? "Added to share" : "Add to share"} arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            addToShare(scenarioId)
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

      <Tooltip title={isPinned ? "Unpin" : "Pin"} arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            togglePinnedScenario(scenarioId)
          }}
          sx={{
            p: 0.25,
            opacity: isPinned || isActive ? 1 : 0,
            color: isPinned ? accentColor : theme.palette.grey[500],
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
 * In "wrapped" mode (600px – fullBreakpoint): 3 columns with outcomes wrapping below
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
  addToShare,
  togglePinnedScenario,
}: NonCompactRowContentProps & {
  isPinned?: boolean
  accentColor?: string
  addToShare?: (id: string) => void
  togglePinnedScenario?: (id: string) => void
}) {
  const theme = useTheme()
  const isListMode = useScenarioExplorerStore((s) => s.exploreMode === "list")
  const outcomeDisplayMode = useScenarioExplorerStore(
    (s) => s.outcomeDisplayMode,
  )

  // In wrapped mode, outcomes span full width below the first 3 columns
  const isWrappedMode = layoutMode === "wrapped"
  // Any responsive view below 1400px (wrapped or xs/compact layout modes)
  const isResponsiveView = layoutMode !== "full"

  return (
    <>
      {/* Column 2: Scenario name and description */}
      <Box
        sx={{
          gridColumn: "2",
          minWidth: 0,
          pr: theme.scenarios.grid.divider.gap,
          pt: theme.scenarios.grid.row.padding,
          pb: isResponsiveView ? 0 : theme.scenarios.grid.row.padding,
          alignSelf: "start",
        }}
      >
        <StrategyHeader
          strategy={scenario}
          titleVariant="body2"
          showDescription={showDescription}
          descriptionMaxWidth="none"
          showThemeBadge={showThemeBadge}
          onThemeBadgeClick={onThemeBadgeClick}
          inlineActions={
            isListMode && addToShare && togglePinnedScenario && accentColor ? (
              <InlineRowActions
                scenarioId={scenario.scenarioId}
                scenarioLabel={scenario.label}
                displayMode={outcomeDisplayMode as "summary" | "distribution"}
                isPinned={isPinned}
                accentColor={accentColor}
                addToShare={addToShare}
                togglePinnedScenario={togglePinnedScenario}
              />
            ) : undefined
          }
        />
      </Box>

      {/* Column 3: Key operations — always rendered in grid mode for smooth transition */}
      {(showOperations || layoutMode !== "compact") && (
        <Box
          sx={{
            gridColumn: layoutMode === "compact" ? "2" : "3",
            borderLeft:
              layoutMode === "full"
                ? `1px solid ${theme.palette.grey[300]}`
                : "none",
            pl: layoutMode === "full" ? 1 : 0,
            pr: isResponsiveView ? theme.scenarios.grid.divider.gap : 0,
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.md,
            justifyContent: "flex-start",
            alignItems: "flex-start",
            pt: theme.scenarios.grid.row.padding,
            pb: isResponsiveView ? 0 : theme.scenarios.grid.row.padding,
            ...(layoutMode !== "compact" && {
              overflow: "hidden",
              opacity: showOperations ? 1 : 0,
              pointerEvents: showOperations ? "auto" : "none",
              transition: "opacity 200ms ease",
            }),
          }}
        >
          <Typography
            variant="dashboard"
            sx={{
              display: layoutMode === "compact" ? "block" : "none",
              color: theme.palette.grey[600],
              fontWeight: 500,
            }}
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
      )}

      {/* Column 4: Outcome glyphs — wraps below in wrapped mode */}
      <Box
        className="outcome-col"
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
        {/* Key outcomes label — compact mode only (wrapped uses header row) */}
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
 * Outcomes-only row content — just the outcome glyphs, no title/ops/checkbox.
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
