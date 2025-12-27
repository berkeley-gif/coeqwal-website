"use client"

/**
 * ScenarioRow - Row layout for scenario summaries in grids/lists
 *
 * Composes shared primitives into a row format suitable for explore grids.
 * Used in Explore mode (StrategyGrid, ListView).
 *
 * Features:
 * - Checkbox for selection
 * - Compact and expanded layouts
 * - Outcome glyph rendering
 * - Optional summary expansion
 */

import { Box, Checkbox, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { StrategyHeader } from "./shared/StrategyHeader"
import { OperationsIconGroup } from "./shared/OperationsIconGroup"
import { OutcomeGlyphItem } from "./shared/OutcomeGlyphItem"
import { SmartSummary } from "./shared/SmartSummary"
import type { ChartDataPoint } from "./shared/types"
import type { OutcomeSummary, AtRiskLocation } from "../../summary/summaryGenerator"
import type { StrategyTheme } from "../../../content/scenarios"

// =============================================================================
// Types
// =============================================================================

export interface ScenarioRowProps {
  /** Strategy data */
  strategy: {
    value: string
    label: string
    description: string
    theme?: StrategyTheme
  }
  /** Chart data for outcomes (keyed by display name) */
  chartData: Record<string, ChartDataPoint[]>
  /** Outcome names in display order */
  outcomeNames: Array<{ name: string; displayName: string }>
  /** Whether this row is selected (checkbox checked) */
  isSelected?: boolean
  /** Whether this row is highlighted (search match) */
  isHighlighted?: boolean
  /** Whether to show in compact mode */
  compact?: boolean
  /** Whether to show descriptions */
  showDefinitions?: boolean
  /** Currently expanded outcome for summary (null if none) */
  expandedOutcome?: string | null
  /** Summary data for expanded outcome */
  outcomeSummary?: OutcomeSummary | null
  /** Whether summary is loading */
  summaryLoading?: boolean
  /** Active tooltip outcome */
  activeTooltip?: string | null
  /** Sort state */
  sortBy?: string | null
  sortDirection?: "asc" | "desc"
  /** Callbacks */
  onToggleSelect?: () => void
  onOutcomeClick?: (outcome: string) => void
  onOutcomeInfoClick?: (outcome: string, e: React.MouseEvent<HTMLButtonElement>) => void
  onSortChange?: (outcome: string | null, direction: "asc" | "desc") => void
  onLocationClick?: (location: AtRiskLocation) => void
  /** Icon size */
  iconSize?: "sm" | "md" | "lg"
}

// =============================================================================
// Component
// =============================================================================

export function ScenarioRow({
  strategy,
  chartData,
  outcomeNames,
  isSelected = false,
  isHighlighted = false,
  compact = false,
  showDefinitions = true,
  expandedOutcome,
  outcomeSummary,
  summaryLoading = false,
  activeTooltip,
  sortBy,
  sortDirection = "asc",
  onToggleSelect,
  onOutcomeClick,
  onOutcomeInfoClick,
  onSortChange,
  onLocationClick,
  iconSize = "md",
}: ScenarioRowProps) {
  const theme = useTheme()

  // Responsive glyph size
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const glyphSize = isMdUp ? 60 : 50

  // Helper to check if outcome has valid data
  const hasData = (outcome: string): boolean => {
    const tierData = chartData[outcome]
    return (
      tierData !== undefined &&
      tierData.length > 0 &&
      tierData.some((tier) => tier.value > 0)
    )
  }

  // Render single outcome item
  const renderOutcomeItem = (displayName: string, name: string) => {
    const isActive = hasData(displayName)
    const isOutcomeSelected = expandedOutcome === displayName
    const isSorted = sortBy === displayName

    return (
      <OutcomeGlyphItem
        key={displayName}
        displayName={displayName}
        name={name}
        chartData={chartData[displayName]}
        isActive={isActive}
        isSelected={isOutcomeSelected}
        isTooltipActive={activeTooltip === name}
        size={glyphSize}
        showLabel={true}
        showInfoButton={true}
        showSortButton={!!onSortChange}
        sortState={isSorted ? sortDirection : null}
        onGlyphClick={() => {
          if (isActive && onOutcomeClick) {
            onOutcomeClick(displayName)
          }
        }}
        onInfoClick={(e) => onOutcomeInfoClick?.(name, e)}
        onSortAsc={(e) => {
          e.stopPropagation()
          if (sortDirection === "asc" && sortBy === displayName) {
            onSortChange?.(null, "asc")
          } else {
            onSortChange?.(displayName, "asc")
          }
        }}
        onSortDesc={(e) => {
          e.stopPropagation()
          if (sortDirection === "desc" && sortBy === displayName) {
            onSortChange?.(null, "asc")
          } else {
            onSortChange?.(displayName, "desc")
          }
        }}
      />
    )
  }

  return (
    <>
      {/* Main row */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: compact
            ? "32px 1fr"
            : { xs: "subgrid", lg: "subgrid" },
          backgroundColor: isHighlighted
            ? theme.palette.common.white
            : theme.palette.undertone.warm,
          borderRadius: theme.borderRadius.md,
          padding: compact ? theme.spacing(3) : theme.spacing(1.5),
          gap: theme.spacing(1),
          alignItems: compact ? "stretch" : "start",
          transition: theme.transition.default,
          border: isHighlighted
            ? theme.border.focus
            : "2px solid transparent",
          "&:hover": {
            backgroundColor: theme.palette.common.white,
          },
        }}
      >
        {/* Checkbox */}
        {onToggleSelect && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              pointerEvents: "auto",
              cursor: "pointer",
              ...(compact && { gridRow: "1 / -1" }),
            }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => {}}
              sx={{
                padding: 0,
                margin: 0,
                cursor: "pointer",
                pointerEvents: "none",
                position: "relative",
                top: theme.spacing(0.125),
                transform: "scale(0.9)",
              }}
            />
          </Box>
        )}

        {/* Content: compact vs non-compact layout */}
        {compact ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(1.5),
            }}
          >
            {/* First row: Title/description + Key operations */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "stretch",
                gap: theme.spacing(2),
              }}
            >
              <StrategyHeader
                strategy={strategy}
                showDescription={showDefinitions}
                titleVariant="body2"
              />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing(1.5),
                  flexShrink: 0,
                }}
              >
                <Typography variant="subtitle2">Key operations</Typography>
                <OperationsIconGroup
                  strategyValue={strategy.value}
                  theme={strategy.theme}
                  size={iconSize}
                />
              </Box>
            </Box>

            {/* Key outcomes section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(1.5),
              }}
            >
              <Typography variant="subtitle2">Key outcomes</Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing(2.5),
                }}
              >
                {/* First 5 outcomes (multi-location) */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(3, 1fr)",
                      sm: "repeat(5, 1fr)",
                    },
                    gap: theme.spacing(1),
                  }}
                >
                  {outcomeNames.slice(0, 5).map(({ name, displayName }) =>
                    renderOutcomeItem(displayName, name),
                  )}
                </Box>
                {/* Remaining outcomes (single-location) */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(3, 1fr)",
                      sm: "repeat(5, 1fr)",
                    },
                    gap: theme.spacing(1),
                  }}
                >
                  {outcomeNames.slice(5).map(({ name, displayName }) =>
                    renderOutcomeItem(displayName, name),
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            {/* Non-compact: Strategy name and description */}
            <Box sx={{ pr: 1 }}>
              <StrategyHeader
                strategy={strategy}
                showDescription={showDefinitions}
                titleVariant="body2"
                descriptionMaxWidth={theme.layout.maxWidth.sm}
              />
            </Box>

            {/* Non-compact: Key operations */}
            <OperationsIconGroup
              strategyValue={strategy.value}
              theme={strategy.theme}
              size={iconSize}
            />

            {/* Non-compact: Outcome charts */}
            <Box
              sx={{
                gridColumn: { xs: "1 / -1", lg: "auto" },
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(3, 1fr)",
                  lg: "repeat(auto-fit, minmax(60px, 1fr))",
                },
                gap: theme.spacing(1),
                mt: { xs: 2, lg: 0 },
                maxWidth: "100%",
              }}
            >
              {outcomeNames.map(({ name, displayName }) =>
                renderOutcomeItem(displayName, name),
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Summary row (expanded) */}
      {expandedOutcome && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "grid",
            gridTemplateColumns: {
              xs: "32px minmax(0, 1fr)",
              lg: "32px minmax(0, 1fr)",
            },
            backgroundColor: theme.palette.grey[50],
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing(1.5),
            gap: theme.spacing(1),
            mt: -0.5,
            mb: 0.5,
          }}
        >
          <Box /> {/* Spacer for checkbox column */}
          <SmartSummary
            outcome={expandedOutcome}
            summary={outcomeSummary ?? null}
            isLoading={summaryLoading}
            variant="inline"
            onLocationClick={onLocationClick}
            showTitle={true}
            showTierBreakdown={true}
            showLocations={true}
          />
        </Box>
      )}
    </>
  )
}

export default ScenarioRow








