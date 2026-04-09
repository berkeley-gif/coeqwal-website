"use client"

/**
 * StrategyGridRow - Single scenario row in the StrategyGrid
 *
 * Uses CSS subgrid to inherit column definitions from parent StrategyGrid,
 * (ensuring vertical alignment between components)
 *
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useRef } from "react"
import { Box, Typography, useTheme, Checkbox } from "@repo/ui/mui"
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
}: StrategyGridRowProps) {
  const theme = useTheme()
  const outcomeDisplayMode = useScenarioExplorerStore(
    (s) => s.outcomeDisplayMode,
  )
  const isListMode = useScenarioExplorerStore((s) => s.exploreMode === "list")
  const showDefinitions = useScenarioExplorerStore((s) => s.showDefinitions)

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
          isSelected={isSelected}
          isTooltipActive={activeTooltip === shortCode}
          variant={variantOverride}
          morphEnabled={isListMode}
          size={glyphSize}
          showLabel={showLabelBelowGlyph}
          showInfoButton={showControlsBelowGlyph}
          showSortButton={showControlsBelowGlyph && sortEnabled}
          sortState={isSorted ? sortDirection : null}
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
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        // Subgrid inherits parent's column tracks; compact uses simple 2-col
        gridTemplateColumns: outcomesOnly
          ? "1fr"
          : compact
            ? "32px 1fr"
            : { xs: "subgrid", sm: "subgrid" },
        backgroundColor: isHighlighted ? theme.palette.common.white : "#faf8f5",
        borderRadius: theme.borderRadius.sm,
        // Compact mode uses row-level padding; non-compact uses column-level
        ...(compact && {
          py: theme.scenarios.grid.row.padding,
          px: theme.space.component.xl,
        }),
        // Row gap for internal content; columnGap inherited from parent via subgrid
        rowGap: theme.scenarios.grid.row.internalGap,
        alignItems: "stretch", // Stretch columns so dividers span full height
        transition: "background-color 0.2s ease, border-color 0.2s ease",
        // Outline (not border) to avoid shifting content
        outline: isHighlighted
          ? `1px solid ${theme.palette.blue.bright}`
          : "none",
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
        "&:hover": {
          backgroundColor: theme.palette.background.paper,
        },
        "&:last-child": {
          borderBottom: "1px solid transparent",
        },
        // First row offset from headers
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
              ...(!compact && {
                pt: `calc(${theme.spacing(theme.scenarios.grid.row.padding as number)} + 19px)`,
                pb: theme.scenarios.grid.row.padding,
              }),
              ...(compact && { gridRow: "1 / -1" }),
            }}
          >
            <Checkbox
              checked={isChosen}
              onChange={() => onToggleScenario(scenario.scenarioId)}
              inputProps={{
                "aria-label": `Select ${scenario.label} scenario`,
              }}
              sx={{
                padding: 0,
                margin: 0,
                cursor: "pointer",
                transform: "scale(0.9)",
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
            />
          )}
        </>
      )}
    </Box>
  )
})

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
          <Typography variant="subtitle2">Key operations</Typography>
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
        <Typography variant="subtitle2">Key outcomes</Typography>
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
              gridTemplateColumns: {
                xs: "repeat(3, 1fr)",
                sm: "repeat(5, 1fr)",
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
              gridTemplateColumns: {
                xs: "repeat(3, 1fr)",
                sm: "repeat(5, 1fr)",
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
 * In "full" mode (1400px+): 4 columns inline
 * In "wrapped" mode (600-1399px): 3 columns with outcomes wrapping below
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
}: NonCompactRowContentProps) {
  const theme = useTheme()

  // In wrapped mode, outcomes span full width below the first 3 columns
  const isWrappedMode = layoutMode === "wrapped"
  // Any responsive view below 1400px (wrapped or xs/compact layout modes)
  const isResponsiveView = layoutMode !== "full"

  return (
    <>
      {/* Column 2: Scenario name and description */}
      <Box
        sx={{
          gridColumn: { xs: "2", sm: "2" },
          // Standard gap before divider
          pr: theme.scenarios.grid.divider.gap,
          pt: theme.scenarios.grid.row.padding,
          // In responsive views (<1400px), no bottom padding since content wraps below
          // In full mode, standard row padding
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
        />
      </Box>

      {/* Column 3: Key operations - at xs, stacks in column 2 under scenario */}
      {showOperations && (
        <Box
          sx={{
            gridColumn: { xs: "2", sm: "3" },
            borderLeft: isWrappedMode
              ? "none"
              : { sm: `1px solid ${theme.palette.grey[300]}` },
            pl: isWrappedMode ? 0 : { sm: theme.scenarios.grid.divider.gap },
            pr: isResponsiveView ? theme.scenarios.grid.divider.gap : 0,
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.md,
            justifyContent: "flex-start",
            alignItems: "flex-start",
            pt: theme.scenarios.grid.row.padding,
            pb: isResponsiveView ? 0 : theme.scenarios.grid.row.padding,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              display: { xs: "block", sm: "none" },
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

      {/* Column 4: Outcome glyphs - wraps below in wrapped mode */}
      <Box
        sx={{
          // In wrapped mode and xs, start at column 2 (aligns with scenario title); in full mode, use column 4
          gridColumn: isWrappedMode
            ? { xs: "2", sm: "2 / -1" }
            : { xs: "2", sm: "4" },
          // Vertical divider only in full mode
          borderLeft: isWrappedMode
            ? "none"
            : { sm: `1px solid ${theme.palette.grey[300]}` },
          // Padding adjustments based on mode
          pl: isWrappedMode ? 0 : { sm: theme.scenarios.grid.divider.gap },
          // xs: 16px top padding for more separation from operations
          // sm wrapped: 8px top padding (+ 8px rowGap = 16px total)
          // Full mode: glyph alignment offset to align with scenario title
          pt: isResponsiveView
            ? { xs: theme.space.gap.lg, sm: theme.space.gap.md }
            : { sm: theme.scenarios.grid.glyphOffset },
          pb: { sm: theme.scenarios.grid.row.padding },
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: theme.space.gap.md,
        }}
      >
        {/* Key outcomes header - in wrapped mode and at xs */}
        <Typography
          variant="subtitle2"
          sx={{
            // Show at xs always, at sm only in wrapped mode
            display: {
              xs: "block",
              sm: isWrappedMode ? "block" : "none",
            },
            color: theme.palette.grey[600],
            fontWeight: 500,
          }}
        >
          Key outcomes
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              // In wrapped mode: 5 columns (breaks 9 outcomes into 5+4 rows)
              // At 1000px+: all 9 fit on one row
              sm: isWrappedMode
                ? "repeat(5, 1fr)"
                : "repeat(auto-fit, minmax(60px, 1fr))",
            },
            // At 1000px+ in wrapped mode, show all on one row
            ...(isWrappedMode && {
              "@media (min-width: 1000px)": {
                gridTemplateColumns: "repeat(9, 1fr)",
              },
            }),
            gap: theme.space.gap.sm,
            alignItems: isDistributionView ? "center" : undefined,
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
              gridTemplateColumns: {
                xs: "repeat(3, 1fr)",
                sm: isWrappedMode
                  ? "repeat(5, 1fr)"
                  : "repeat(auto-fit, minmax(60px, 1fr))",
              },
              ...(isWrappedMode && {
                "@media (min-width: 1000px)": {
                  gridTemplateColumns: "repeat(9, 1fr)",
                },
              }),
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
        borderLeft: { sm: `1px solid ${theme.palette.grey[300]}` },
        alignItems: "end",
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
