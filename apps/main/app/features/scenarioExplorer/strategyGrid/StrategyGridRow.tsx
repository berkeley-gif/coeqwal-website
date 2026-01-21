"use client"

/**
 * StrategyGridRow - Single scenario row in the StrategyGrid
 *
 * Renders a full-width subgrid row containing:
 * - Column 1: Checkbox for scenario selection
 * - Column 2: Scenario name and description (StrategyHeader)
 * - Column 3: Key operations icons (OperationsIconGroup)
 * - Column 4: Outcome glyphs (OutcomeGlyphItem grid)
 *
 * Uses CSS subgrid to inherit column definitions from parent StrategyGrid,
 * ensuring vertical dividers align perfectly between header and content rows.
 *
 * @see layoutConfig.ts for spacing constant documentation
 */

import React from "react"
import { Box, Typography, useTheme, Checkbox } from "@repo/ui/mui"
import {
  OutcomeGlyphItem,
  OperationsIconGroup,
  StrategyHeader,
  type ChartDataPoint,
  type OutcomeName,
  type ScenarioForDisplay,
} from "../../scenarios/components/shared"
import { LAYOUT } from "./layoutConfig"
import type { LayoutMode } from "./StrategyGridHeader"

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
  /** Show scenario descriptions */
  showDefinitions: boolean
  /** Outcome names with display info */
  outcomeNames: OutcomeName[]
  /** Get chart data for this scenario */
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  /** Currently expanded summary outcome (if any) */
  expandedSummaryOutcome: string | null
  /** Currently selected outcome for this scenario */
  selectedOutcome: string | null
  /** Whether tier click handler exists */
  hasTierClick: boolean
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
  /** Select an outcome */
  onOutcomeSelect: (scenarioId: string, outcome: string) => void
  /** Tier click handler */
  onTierClick?: (scenarioId: string, outcome: string) => void
  /** Toggle summary panel */
  onToggleSummary: (scenarioId: string, outcome: string) => void
  /** Toggle tooltip with anchor */
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  /** Sort change handler */
  onSortChange?: (outcome: string | null, direction: "asc" | "desc") => void
}

/**
 * StrategyGridRow renders a single scenario as a grid row.
 *
 * In non-compact mode, uses CSS subgrid to inherit the parent's 4-column layout,
 * ensuring dividers align between header and content. In compact mode, uses a
 * simpler 2-column layout with flexbox content.
 */
export const StrategyGridRow = React.memo(function StrategyGridRow({
  scenario,
  isFirst,
  isHighlighted,
  isChosen,
  compact,
  layoutMode,
  showDefinitions,
  outcomeNames,
  getChartDataForScenario,
  expandedSummaryOutcome,
  selectedOutcome,
  hasTierClick,
  activeTooltip,
  sortBy,
  sortDirection,
  sortEnabled,
  glyphSize,
  isAlignedGrid,
  onToggleScenario,
  onOutcomeSelect,
  onTierClick,
  onToggleSummary,
  onTooltipToggle,
  onSortChange,
}: StrategyGridRowProps) {
  const theme = useTheme()

  // Get chart data for this scenario
  const scenarioChartData = getChartDataForScenario(scenario.scenarioId)

  /**
   * Render a single outcome glyph item.
   * Handles all the display logic for labels, controls, and interaction.
   */
  const renderOutcomeItem = (displayName: string, name: string) => {
    const chartData = scenarioChartData[displayName]
    const isActive = chartData !== undefined && chartData.length > 0
    const isSelected =
      expandedSummaryOutcome === displayName ||
      (selectedOutcome === displayName && hasTierClick)
    const isSorted = sortBy === displayName

    // In aligned grid mode, labels and controls are in the header row
    // In all other modes (compact, map view, xs-md responsive), show below glyph
    const showLabelBelowGlyph = !isAlignedGrid
    const showControlsBelowGlyph = !isAlignedGrid

    return (
      <OutcomeGlyphItem
        key={displayName}
        displayName={displayName}
        name={name}
        chartData={chartData}
        isActive={isActive}
        isSelected={isSelected}
        isTooltipActive={activeTooltip === name}
        size={glyphSize}
        showLabel={showLabelBelowGlyph}
        showInfoButton={showControlsBelowGlyph}
        showSortButton={showControlsBelowGlyph && sortEnabled}
        sortState={isSorted ? sortDirection : null}
        onGlyphClick={() => {
          if (isActive) {
            onOutcomeSelect(scenario.scenarioId, displayName)
            if (onTierClick) onTierClick(scenario.scenarioId, displayName)
            onToggleSummary(scenario.scenarioId, displayName)
          }
        }}
        onInfoClick={(e) => {
          onTooltipToggle(name, e.currentTarget)
        }}
        onSortToggle={(newState) => {
          if (newState === null) {
            onSortChange?.(null, "asc")
          } else {
            onSortChange?.(displayName, newState)
          }
        }}
      />
    )
  }

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        // Subgrid inherits parent's column tracks; compact uses simple 2-col
        gridTemplateColumns: compact ? "32px 1fr" : { xs: "subgrid", sm: "subgrid" },
        backgroundColor: isHighlighted
          ? theme.palette.common.white
          : "#faf8f5",
        borderRadius: theme.borderRadius.sm,
        // Compact mode uses row-level padding; non-compact uses column-level
        ...(compact && {
          py: LAYOUT.spacing.rowPadding,
          px: theme.space.component.xl,
        }),
        // Row gap for internal content; columnGap inherited from parent via subgrid
        rowGap: LAYOUT.spacing.internalRowGap,
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
        ...(isFirst && { marginTop: LAYOUT.spacing.firstRowOffset }),
      }}
    >
      {/* Column 1: Checkbox */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end", // Align checkbox closer to scenario title
          alignItems: "flex-start",
          alignSelf: "start",
          pointerEvents: "auto",
          cursor: "pointer",
          // Non-compact: vertical padding matches scenario title alignment
          ...(!compact && {
            pt: LAYOUT.spacing.rowPadding,
            pb: LAYOUT.spacing.rowPadding,
          }),
          // Compact: checkbox spans all rows
          ...(compact && { gridRow: "1 / -1" }),
        }}
        onClick={(event) => {
          event.stopPropagation()
          onToggleScenario(scenario.scenarioId)
        }}
      >
        <Checkbox
          checked={isChosen}
          onChange={() => {}}
          sx={{
            padding: 0,
            margin: 0,
            cursor: "pointer",
            pointerEvents: "none",
            transform: "scale(0.9)",
          }}
        />
      </Box>

      {/* Content: compact vs non-compact layout */}
      {compact ? (
        <CompactRowContent
          scenario={scenario}
          showDefinitions={showDefinitions}
          outcomeNames={outcomeNames}
          renderOutcomeItem={renderOutcomeItem}
        />
      ) : (
        <NonCompactRowContent
          scenario={scenario}
          layoutMode={layoutMode}
          showDefinitions={showDefinitions}
          outcomeNames={outcomeNames}
          renderOutcomeItem={renderOutcomeItem}
        />
      )}
    </Box>
  )
})

/**
 * Compact mode content - flexbox-based layout for mobile/condensed view
 */
interface CompactRowContentProps {
  scenario: ScenarioForDisplay
  showDefinitions: boolean
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (displayName: string, name: string) => React.ReactNode
}

function CompactRowContent({
  scenario,
  showDefinitions,
  outcomeNames,
  renderOutcomeItem,
}: CompactRowContentProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.space.gap.md,
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
          showDescription={showDefinitions}
          titleVariant="body2"
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.md,
            flexShrink: 0,
          }}
        >
          <Typography variant="smallSectionLabel">Key operations</Typography>
          <OperationsIconGroup
            scenarioId={scenario.scenarioId}
            theme={scenario.theme}
            size="md"
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
        <Typography variant="smallSectionLabel">Key outcomes</Typography>
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
              .map(({ name, displayName }) => renderOutcomeItem(displayName, name))}
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
              .map(({ name, displayName }) => renderOutcomeItem(displayName, name))}
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
  showDefinitions: boolean
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (displayName: string, name: string) => React.ReactNode
}

function NonCompactRowContent({
  scenario,
  layoutMode,
  showDefinitions,
  outcomeNames,
  renderOutcomeItem,
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
          pr: LAYOUT.spacing.dividerGap,
          pt: LAYOUT.spacing.rowPadding,
          // In responsive views (<1400px), no bottom padding since content wraps below
          // In full mode, standard row padding
          pb: isResponsiveView ? 0 : LAYOUT.spacing.rowPadding,
          alignSelf: "start",
        }}
      >
        <StrategyHeader
          strategy={scenario}
          showDescription={showDefinitions}
          titleVariant="body2"
          descriptionMaxWidth="none"
        />
      </Box>

      {/* Column 3: Key operations - at xs, stacks in column 2 under scenario */}
      <Box
        sx={{
          gridColumn: { xs: "2", sm: "3" },
          // Vertical divider only in full mode
          borderLeft: isWrappedMode
            ? "none"
            : { sm: `1px solid ${theme.palette.grey[300]}` },
          // Standard gap after divider (only in full mode)
          pl: isWrappedMode ? 0 : { sm: LAYOUT.spacing.dividerGap },
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.md,
          // Top-align in all modes
          justifyContent: "flex-start",
          alignItems: "flex-start",
          // Responsive views: 8px top padding (+ 8px rowGap = 16px total, less than 24px outer)
          // Full mode: standard row padding
          pt: isResponsiveView ? theme.space.gap.md : LAYOUT.spacing.rowPadding,
          // Responsive views: no bottom padding (pt handles section spacing)
          // Full mode: standard row padding
          pb: isResponsiveView ? 0 : LAYOUT.spacing.rowPadding,
        }}
      >
        {/* Key operations header - only at xs breakpoint */}
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
        />
      </Box>

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
          pl: isWrappedMode ? 0 : { sm: LAYOUT.spacing.dividerGap },
          // xs: 16px top padding for more separation from operations
          // sm wrapped: 8px top padding (+ 8px rowGap = 16px total)
          // Full mode: glyph alignment offset to align with scenario title
          pt: isResponsiveView
            ? { xs: theme.space.gap.lg, sm: theme.space.gap.md }
            : { sm: LAYOUT.glyphAlignmentOffset },
          pb: { sm: LAYOUT.spacing.rowPadding },
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
            // No margin - gap handles header→content spacing
            mt: 0,
            maxWidth: "100%",
            width: "100%",
          }}
        >
          {outcomeNames.map(({ name, displayName }) =>
            renderOutcomeItem(displayName, name),
          )}
        </Box>
      </Box>
    </>
  )
}

export default StrategyGridRow
