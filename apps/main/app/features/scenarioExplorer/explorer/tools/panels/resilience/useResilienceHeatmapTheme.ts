"use client"

/**
 * useResilienceHeatmapTheme
 *
 * Pulls tier colors, tier labels, and the neutral chrome palette that
 * the ResilienceHeatmap viz component needs out of the MUI theme so
 * callers can mount a heatmap without duplicating the token wiring
 * from ResiliencePanel. Shared between the main resilience tool and
 * the Share-tab / drawer live thumbnails.
 */

import { useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import { type ResilienceHeatmapPalette } from "@repo/viz"
import { TIER_LABELS } from "../../../../../../content/tiers"

export interface ResilienceHeatmapThemeTokens {
  tierColors: readonly [string, string, string, string]
  tierLabels: readonly [string, string, string, string]
  palette: ResilienceHeatmapPalette
}

export function useResilienceHeatmapTheme(): ResilienceHeatmapThemeTokens {
  const theme = useTheme()

  const tier1 = theme.palette.tiers.tier1
  const tier2 = theme.palette.tiers.tier2
  const tier3 = theme.palette.tiers.tier3
  const tier4 = theme.palette.tiers.tier4
  const tierColors = useMemo(
    () => [tier1, tier2, tier3, tier4] as const,
    [tier1, tier2, tier3, tier4],
  )

  const tierLabels = useMemo(
    () =>
      [TIER_LABELS[1], TIER_LABELS[2], TIER_LABELS[3], TIER_LABELS[4]] as const,
    [],
  )

  const textPrimary = theme.palette.text.primary
  const commonWhite = theme.palette.common.white
  const grey100 = theme.palette.grey[100]
  const grey300 = theme.palette.grey[300]
  const grey400 = theme.palette.grey[400]
  const grey600 = theme.palette.grey[600]
  const grey700 = theme.palette.grey[700]
  const divNegStrong = theme.palette.tierDiverging.negStrong
  const divNegWeak = theme.palette.tierDiverging.negWeak
  const divZero = theme.palette.tierDiverging.zero
  const divPosWeak = theme.palette.tierDiverging.posWeak
  const divPosStrong = theme.palette.tierDiverging.posStrong
  const densOppMin = theme.palette.tierDensity.oppMin
  const densOppMax = theme.palette.tierDensity.oppMax
  const leverageMin = theme.palette.tierLeverage.min
  const leverageMax = theme.palette.tierLeverage.max

  const palette = useMemo<ResilienceHeatmapPalette>(
    () => ({
      text: textPrimary,
      textMuted: grey700,
      hoverStroke: textPrimary,
      onDarkTier: commonWhite,
      onLightTier: textPrimary,
      unavailableFill: grey100,
      unavailableStroke: grey400,
      unavailableHatch: grey300,
      axisHintUnderline: grey400,
      tooltipBg: commonWhite,
      tooltipBorder: grey300,
      tooltipShadow: `0 2px 8px ${grey600}1F`,
      divergingNegStrong: divNegStrong,
      divergingNegWeak: divNegWeak,
      divergingZero: divZero,
      divergingPosWeak: divPosWeak,
      divergingPosStrong: divPosStrong,
      densityOppMin: densOppMin,
      densityOppMax: densOppMax,
      leverageMin,
      leverageMax,
    }),
    [
      textPrimary,
      commonWhite,
      grey100,
      grey300,
      grey400,
      grey600,
      grey700,
      divNegStrong,
      divNegWeak,
      divZero,
      divPosWeak,
      divPosStrong,
      densOppMin,
      densOppMax,
      leverageMin,
      leverageMax,
    ],
  )

  return { tierColors, tierLabels, palette }
}
