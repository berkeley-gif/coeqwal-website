/**
 * Tier score calculation and color blending utilities.
 *
 * computeTierScore:    ChartDataPoint[] -> weighted mean tier (1.0-4.0)
 * interpolateTierColor: score + theme tier colors → blended hex string
 * getTierLabelForScore: score → "Optimal" | "Acceptable" | "At-risk" | "Critical"
 */

import type { ChartDataPoint } from "./types"
import { isSingleValueTier } from "./types"
import { getTierLabel, type TierColors } from "../../../../content/tiers"

/**
 * Compute a weighted-mean tier score from chart data.
 *
 * Multi-value:  sum(tier_i × normalized_share_i) where tier_i = 1,2,3,4
 * Single-value: the active tier level (whichever has value = 1)
 *
 * Returns null when data is missing or empty.
 */
export function computeTierScore(
  chartData: ChartDataPoint[] | undefined,
): number | null {
  if (!chartData || chartData.length === 0) return null

  if (isSingleValueTier(chartData)) {
    const activeIndex = chartData.findIndex((d) => d.value > 0)
    return activeIndex >= 0 ? activeIndex + 1 : null
  }

  const points = chartData.slice(0, 4)
  const total = points.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  const weighted = points.reduce(
    (sum, d, i) => sum + (i + 1) * (d.value / total),
    0,
  )
  return weighted
}

/**
 * Map a tier score to a human-readable label.
 */
export function getTierLabelForScore(score: number): string {
  return getTierLabel(getTierLevelForScore(score))
}

/**
 * Map a tier score to a tier level (1-4) for color lookup.
 */
export function getTierLevelForScore(score: number): 1 | 2 | 3 | 4 {
  if (score < 1.5) return 1
  if (score < 2.5) return 2
  if (score < 3.5) return 3
  return 4
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`
}

/**
 * Linearly interpolate between adjacent tier colors based on score.
 *
 * 1.0 = pure tier1, 2.0 = pure tier2, 1.5 = 50/50 blend of tier1+tier2, etc.
 * Uses theme.palette.tiers exclusively.no hardcoded colors.
 */
export function interpolateTierColor(
  score: number,
  tierColors: TierColors,
): string {
  const colors = [
    tierColors.tier1,
    tierColors.tier2,
    tierColors.tier3,
    tierColors.tier4,
  ]

  const clamped = Math.max(1, Math.min(4, score))
  const index = Math.min(Math.floor(clamped) - 1, 2) // 0,1,2
  const t = clamped - (index + 1) // fractional part within segment

  const [r1, g1, b1] = hexToRgb(colors[index]!)
  const [r2, g2, b2] = hexToRgb(colors[index + 1]!)

  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
