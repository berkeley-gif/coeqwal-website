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
import { ScenarioGlyph } from "@repo/viz"
import { isSingleValueTier, type ChartDataPoint } from "./types"

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
    "Salmon abundance": ["Salmon", "abundance"],
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
  /** Chart data for this outcome */
  chartData: ChartDataPoint[] | undefined
  /** Whether this outcome has active/valid data */
  isActive: boolean
  /** Whether this outcome is currently selected (shows border) */
  isSelected?: boolean
  /** Whether tooltip is active for this outcome */
  isTooltipActive?: boolean
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
  /** Called when glyph is clicked */
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
  chartData,
  isActive,
  isSelected = false,
  isTooltipActive = false,
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

  const variant = isSingleValueTier(chartData) ? "dots" : "bars"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space.gap.sm,
        cursor: isActive ? "pointer" : "default",
        padding: theme.space.component.sm,
        borderRadius: theme.borderRadius.sm,
        transition: "opacity 0.2s ease, background-color 0.2s ease",
        opacity: isActive ? 1 : 0.5,
        border: isSelected ? theme.border.active : "2px solid transparent",
        minWidth: 0,
        overflow: "hidden",
        "&:hover": {
          backgroundColor: isActive ? theme.palette.grey[100] : "transparent",
        },
      }}
      onClick={isActive ? onGlyphClick : undefined}
    >
      {/* Glyph or placeholder */}
      {isActive ? (
        <ScenarioGlyph
          variant={variant}
          values={values}
          size={actualSize}
          tierColors={tierColors}
        />
      ) : (
        <Box
          sx={{
            width: actualSize,
            height: actualSize,
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
              color: theme.palette.text.primary,
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
            gap: 0.25, // 2px - intentionally tight for label spacing
            minHeight: "2rem",
            width: "100%",
          }}
        >
          {showLabel && (
            <Typography
              variant="outcomeLabel"
              sx={{
                color: isActive
                  ? theme.palette.grey[700]
                  : theme.palette.grey[400],
                textAlign: "center",
                lineHeight: 1.3,
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
                gap: 0,
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

export default OutcomeGlyphItem
