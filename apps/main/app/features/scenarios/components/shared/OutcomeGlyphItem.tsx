"use client"

/**
 * OutcomeGlyphItem - Single outcome visualization with glyph and label
 *
 * Shared component for rendering outcome tier visualizations.
 * Used by both Learn mode (KeyOutcomesPanel) and Explore mode (StrategyGrid).
 *
 * Renders:
 * - ScenarioGlyph (bars or dots based on tier type)
 * - Outcome label
 * - Info button (optional)
 * - Sort button (optional, Explore mode only)
 */

import React from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { InfoIconButton, ToggleSortButton } from "@repo/ui"
import {
  ScenarioGlyph,
  MorphableDistributionGlyph,
  SQUARE_SIZE,
  SQUARE_GAP,
  type GlyphVariant,
} from "@repo/viz"
import { isSingleValueTier, type ChartDataPoint } from "./types"
import { getSingleValueLocationCount } from "../../../../content/outcomes"

/**
 * Generate accessible description of chart data for screen readers
 * WCAG 1.1.1: Provide text alternative for non-text content
 */
function generateChartAriaLabel(
  displayName: string,
  chartData: ChartDataPoint[] | undefined,
): string {
  if (!chartData || chartData.length === 0) {
    return `${displayName}: No data available`
  }

  if (isSingleValueTier(chartData)) {
    // Single-value tier: find the active tier (value > 0)
    const activeTier = chartData.find((t) => t.value > 0)
    return `${displayName}: ${activeTier?.label || "Unknown"} tier`
  }

  // Multi-value: describe distribution
  const tierDescriptions = chartData
    .filter((t) => t.value > 0)
    .map((t) => `${Math.round(t.value)}% ${t.label}`)
    .join(", ")

  return `${displayName} tier distribution: ${tierDescriptions}`
}

/**
 * Format outcome label with consistent line breaks
 * Each outcome breaks at a specific point for visual consistency
 */
export function formatOutcomeLabel(displayName: string): React.ReactNode {
  const breakPoints: Record<string, [string, string]> = {
    "Community deliveries": ["Community", "deliveries"],
    "Agricultural revenue": ["Agricultural", "revenue"],
    "Environmental flows": ["Environmental", "flows"],
    "Reservoir storage": ["Reservoir", "storage"],
    "Groundwater storage": ["Groundwater", "storage"],
    "Delta estuary ecology": ["Delta estuary", "ecology"],
    "Freshwater for Delta exports": ["Freshwater for", "Delta exports"],
    "Freshwater for in-Delta uses": ["Freshwater for", "in-Delta uses"],
    "Winter-run salmon": ["Winter-run", "salmon"],
  }

  const parts = breakPoints[displayName]
  if (parts) {
    return (
      <>
        {parts[0]}
        <br />
        {parts[1]}
      </>
    )
  }
  return displayName
}

export interface OutcomeGlyphItemProps {
  /** Display name of the outcome (shown as label) */
  displayName: string
  /** Internal name (used for tooltip key) */
  name: string
  /** Outcome short code (e.g. "DELTA_ECO") - used for single-value square count */
  outcomeCode?: string
  /** Chart data for this outcome */
  chartData: ChartDataPoint[] | undefined
  /** Whether this outcome has active/valid data */
  isActive: boolean
  /** Whether this outcome is currently selected (shows border) */
  isSelected?: boolean
  /** Whether tooltip is active for this outcome */
  isTooltipActive?: boolean
  /** Override the auto-detected glyph variant (bars/dots/distribution) */
  variant?: GlyphVariant
  /** When true, use the morphable glyph that animates between bars and distribution */
  morphEnabled?: boolean
  /**
   * Compact view. When true, the `size` prop is forwarded to the underlying
   * morphable bar glyph so it renders in a `size x size` box instead of the
   * default 120px-wide distribution-aligned container. Use in tight
   * layouts (e.g. Learn-section panels) where the full bar container
   * overruns and no distribution-mode morph is needed.
   */
  compact?: boolean
  /** Size of the glyph (default: responsive 50/60px) */
  size?: number
  /** Whether to show the outcome label */
  showLabel?: boolean
  /** Whether to show the info button */
  showInfoButton?: boolean
  /** Whether to show sort buttons (Explore mode) */
  showSortButton?: boolean
  /** Current sort state for this outcome */
  sortState?: "asc" | "desc" | null
  /** Called when glyph is clicked (triggers contextual tooltip) */
  onGlyphClick?: () => void
  /** Called when info button is clicked */
  onInfoClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Called when sort state changes */
  onSortToggle?: (newState: "asc" | "desc" | null) => void
}

export function OutcomeGlyphItem({
  displayName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  name, // Reserved for future tooltip key usage
  outcomeCode,
  chartData,
  isActive,
  isSelected = false,
  isTooltipActive = false,
  variant: variantOverride,
  morphEnabled = false,
  compact = false,
  size,
  showLabel = true,
  showInfoButton = true,
  showSortButton = false,
  sortState,
  onGlyphClick,
  onInfoClick,
  onSortToggle,
}: OutcomeGlyphItemProps) {
  const theme = useTheme()

  // Responsive glyph size: 50px at sm, 60px at md+
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const responsiveSize = isMdUp ? 60 : 50
  const actualSize = size ?? responsiveSize

  // Compute glyph values and colors
  const values: [number, number, number, number] = chartData
    ? (chartData.map((tier) => tier.value).slice(0, 4) as [
        number,
        number,
        number,
        number,
      ])
    : [0, 0, 0, 0]

  const tierColors: [string, string, string, string] = chartData
    ? (chartData.map((tier) => tier.color).slice(0, 4) as [
        string,
        string,
        string,
        string,
      ])
    : [
        theme.palette.tiers.tier1,
        theme.palette.tiers.tier2,
        theme.palette.tiers.tier3,
        theme.palette.tiers.tier4,
      ]

  const locationCounts: [number, number, number, number] | undefined =
    chartData?.every((t) => t.rawCount != null)
      ? (chartData.map((t) => t.rawCount!).slice(0, 4) as [
          number,
          number,
          number,
          number,
        ])
      : undefined

  const isSingleValue = isSingleValueTier(chartData)
  const autoVariant = isSingleValue ? "dots" : "bars"
  const isSingleValueDistribution =
    variantOverride === "distribution" && isSingleValue
  const variant = isSingleValueDistribution
    ? "dots"
    : (variantOverride ?? autoVariant)

  const useMorphable = morphEnabled && !isSingleValue
  const morphMode: "bars" | "distribution" =
    variantOverride === "distribution" ? "distribution" : "bars"

  // Glyph is clickable when active and has a click handler
  const isClickable = isActive && !!onGlyphClick

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space.gap.sm,
        cursor: isClickable ? "pointer" : "default",
        padding: theme.space.component.sm,
        borderRadius: theme.borderRadius.sm,
        transition: "background-color 0.2s ease",
        // Note: opacity removed from parent - inactive styling handled per-element for WCAG compliance
        border: isSelected ? theme.border.active : "2px solid transparent",
        minWidth: 0,
        overflow: "hidden",
        "&:hover": {
          backgroundColor: isClickable
            ? theme.palette.grey[100]
            : "transparent",
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.blue.bright}`,
          outlineOffset: "2px",
        },
      }}
      onClick={isClickable ? onGlyphClick : undefined}
      // WCAG 2.1.1: Make clickable glyphs keyboard accessible
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      aria-label={isClickable ? `View details for ${displayName}` : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onGlyphClick?.()
              }
            }
          : undefined
      }
    >
      {/* Glyph or placeholder */}
      {isActive && isSingleValueDistribution ? (
        (() => {
          const activeTier = chartData?.find((t) => t.value > 0)
          const color = activeTier?.color ?? theme.palette.grey[400]
          const count = outcomeCode
            ? getSingleValueLocationCount(outcomeCode)
            : 1
          const cell = SQUARE_SIZE + SQUARE_GAP
          const w = count * cell - SQUARE_GAP
          return (
            <Box
              role="img"
              aria-label={generateChartAriaLabel(displayName, chartData)}
            >
              <svg width={w} height={SQUARE_SIZE}>
                {Array.from({ length: count }, (_, i) => (
                  <rect
                    key={i}
                    x={i * cell}
                    y={0}
                    width={SQUARE_SIZE}
                    height={SQUARE_SIZE}
                    rx={2}
                    fill={color}
                    stroke={color}
                    strokeWidth={0.5}
                    strokeOpacity={0.4}
                  />
                ))}
              </svg>
            </Box>
          )
        })()
      ) : isActive && useMorphable ? (
        <Box
          role="img"
          aria-label={generateChartAriaLabel(displayName, chartData)}
        >
          <MorphableDistributionGlyph
            values={values}
            tierColors={tierColors}
            mode={morphMode}
            locationCounts={locationCounts}
            compact={compact}
            size={compact ? actualSize : undefined}
          />
        </Box>
      ) : isActive ? (
        <Box
          role="img"
          aria-label={generateChartAriaLabel(displayName, chartData)}
        >
          <ScenarioGlyph
            variant={variant}
            values={values}
            size={actualSize}
            tierColors={tierColors}
          />
        </Box>
      ) : (
        <Box
          sx={{
            // Fixed size - never scales with viewport
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.grey[100],
            borderRadius: theme.borderRadius.md,
            border: theme.border.medium,
          }}
        >
          <Typography
            variant="outcomeLabel"
            sx={{
              color: theme.palette.grey[700],
              px: theme.space.component.xs,
            }}
          >
            No data at this time
          </Typography>
        </Box>
      )}

      {/* Label and controls */}
      {(showLabel || showInfoButton || showSortButton) && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            minHeight: "2rem",
            width: "100%",
          }}
        >
          {showLabel && (
            <Typography
              component="div"
              sx={{
                fontFamily: theme.typography.tabLabelDocked.fontFamily,
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: "0.01em",
                color: theme.palette.text.primary,
                textAlign: "center",
              }}
            >
              {formatOutcomeLabel(displayName)}
            </Typography>
          )}

          {/* Info and sort buttons */}
          {(showInfoButton || showSortButton) && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              {showInfoButton && onInfoClick && (
                <InfoIconButton
                  isActive={isTooltipActive}
                  onClick={(e) => {
                    e.stopPropagation()
                    onInfoClick(e)
                  }}
                  title="Click for outcome details"
                />
              )}
              {showSortButton && onSortToggle && (
                <ToggleSortButton
                  sortState={sortState ?? null}
                  onToggle={onSortToggle}
                  title="Sort by this outcome"
                />
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
