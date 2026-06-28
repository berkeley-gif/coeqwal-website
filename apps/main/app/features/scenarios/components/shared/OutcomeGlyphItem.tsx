"use client"

/**
 * OutcomeGlyphItem - Single outcome visualization with glyph and label
 *
 * Shared component for rendering outcome tier visualizations.
 * Used by both Learn mode (KeyOutcomesPanel) and Explore mode (StrategyGrid).
 *
 * The icon work throughout is provisional, until someone has time to make real 
 * icons.
 * 
 * Renders:
 * - ScenarioGlyph (bars or dots based on tier type)
 * - Outcome label
 * - Info button (optional)
 * - Sort button (optional, Explore mode only)
 */

import React, { useMemo } from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { InfoIconButton, ToggleSortButton } from "@repo/ui"
import {
  ScenarioGlyph,
  MorphableDistributionGlyph,
  SQUARE_SIZE,
  SQUARE_GAP,
  type GlyphVariant,
} from "@repo/viz"
import { themeValues } from "@repo/ui/themes/theme"
import { isSingleValueTier, type ChartDataPoint } from "./types"
import { NoDataAtThisTime } from "./NoDataAtThisTime"
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

type TierTuple = [number, number, number, number]
type TierColorTuple = [string, string, string, string]

/**
 * Derive fixed-length value, color, and location-count tuples from chartData.
 *
 * These are memoized on the underlying primitive fields rather than on the
 * chartData array, whose identity can churn even when the four tier values are
 * unchanged. Depending on the array directly would recompute these tuples (and
 * re-render the glyph) on every parent render.
 */
function useStableTierTuples(chartData: ChartDataPoint[] | undefined): {
  values: TierTuple
  tierColors: TierColorTuple
  locationCounts: TierTuple | undefined
} {
  const theme = useTheme()

  const v0 = chartData?.[0]?.value
  const v1 = chartData?.[1]?.value
  const v2 = chartData?.[2]?.value
  const v3 = chartData?.[3]?.value
  const values = useMemo<TierTuple>(() => {
    if (!chartData) return [0, 0, 0, 0]
    return chartData.map((tier) => tier.value).slice(0, 4) as TierTuple
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v0, v1, v2, v3])

  const c0 = chartData?.[0]?.color
  const c1 = chartData?.[1]?.color
  const c2 = chartData?.[2]?.color
  const c3 = chartData?.[3]?.color
  const fallbackTier1 = theme.palette.tiers.tier1
  const fallbackTier2 = theme.palette.tiers.tier2
  const fallbackTier3 = theme.palette.tiers.tier3
  const fallbackTier4 = theme.palette.tiers.tier4
  const tierColors = useMemo<TierColorTuple>(() => {
    if (!chartData) {
      return [fallbackTier1, fallbackTier2, fallbackTier3, fallbackTier4]
    }
    return chartData.map((tier) => tier.color).slice(0, 4) as TierColorTuple
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    c0,
    c1,
    c2,
    c3,
    fallbackTier1,
    fallbackTier2,
    fallbackTier3,
    fallbackTier4,
  ])

  const r0 = chartData?.[0]?.rawCount
  const r1 = chartData?.[1]?.rawCount
  const r2 = chartData?.[2]?.rawCount
  const r3 = chartData?.[3]?.rawCount
  const locationCounts = useMemo<TierTuple | undefined>(() => {
    if (
      r0 == null ||
      r1 == null ||
      r2 == null ||
      r3 == null ||
      !chartData ||
      chartData.length < 4
    ) {
      return undefined
    }
    return [r0, r1, r2, r3]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r0, r1, r2, r3])

  return { values, tierColors, locationCounts }
}

interface GlyphVisualProps {
  isActive: boolean
  displayName: string
  chartData: ChartDataPoint[] | undefined
  outcomeCode?: string
  isSingleValueDistribution: boolean
  useMorphable: boolean
  variant: GlyphVariant
  morphMode: "bars" | "distribution"
  compact: boolean
  size: number
  values: TierTuple
  tierColors: TierColorTuple
  locationCounts: TierTuple | undefined
}

/**
 * Renders the glyph itself, picking the representation that matches the data:
 * a single-value square strip, an animated morphable distribution, a static
 * bars/dots glyph, or the no-data placeholder.
 */
function GlyphVisual({
  isActive,
  displayName,
  chartData,
  outcomeCode,
  isSingleValueDistribution,
  useMorphable,
  variant,
  morphMode,
  compact,
  size,
  values,
  tierColors,
  locationCounts,
}: GlyphVisualProps) {
  const theme = useTheme()

  if (!isActive) return <NoDataAtThisTime />

  const ariaLabel = generateChartAriaLabel(displayName, chartData)

  if (isSingleValueDistribution) {
    const activeTier = chartData?.find((t) => t.value > 0)
    const color = activeTier?.color ?? theme.palette.grey[400]
    const count = outcomeCode ? getSingleValueLocationCount(outcomeCode) : 1
    const cell = SQUARE_SIZE + SQUARE_GAP
    const w = count * cell - SQUARE_GAP
    return (
      <Box role="img" aria-label={ariaLabel}>
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
  }

  if (useMorphable) {
    return (
      <Box role="img" aria-label={ariaLabel}>
        <MorphableDistributionGlyph
          values={values}
          tierColors={tierColors}
          mode={morphMode}
          locationCounts={locationCounts}
          compact={compact}
          size={compact ? size : undefined}
        />
      </Box>
    )
  }

  return (
    <Box role="img" aria-label={ariaLabel}>
      <ScenarioGlyph
        variant={variant}
        values={values}
        size={size}
        tierColors={tierColors}
      />
    </Box>
  )
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

  const { values, tierColors, locationCounts } = useStableTierTuples(chartData)

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
      <GlyphVisual
        isActive={isActive}
        displayName={displayName}
        chartData={chartData}
        outcomeCode={outcomeCode}
        isSingleValueDistribution={isSingleValueDistribution}
        useMorphable={useMorphable}
        variant={variant}
        morphMode={morphMode}
        compact={compact}
        size={actualSize}
        values={values}
        tierColors={tierColors}
        locationCounts={locationCounts}
      />

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
                fontFamily: themeValues.fontFamily.display,
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
