"use client"

/**
 * SpillChart - Two-panel SVG chart for monthly reservoir spill data
 *
 * Top panel (60% height): Monthly spill frequency bar chart (Oct-Sep)
 * Bottom panel (40% height): Conditional spill magnitude (q50-q100 range)
 *
 * Water months: 1=October, 2=November, ..., 12=September
 */

import React from "react"

/**
 * Monthly spill statistics for a single month
 */
export interface SpillMonthlyStats {
  spill_months_count: number
  total_months: number
  spill_frequency_pct: number // 0-100
  spill_avg_cfs: number
  spill_max_cfs: number
  spill_q50: number // median spill CFS
  spill_q90: number
  spill_q100: number // max spill CFS
  storage_at_spill_avg_pct: number | null
}

/**
 * Monthly spill data keyed by month string ("1"-"12")
 */
export type MonthlySpillData = Record<string, SpillMonthlyStats>

export interface SpillChartProps {
  /** Monthly spill data: { "1": SpillMonthlyStats, ... } keyed by water month */
  data: MonthlySpillData
  /** Chart width in pixels */
  width: number
  /** Chart height in pixels */
  height: number
}

// Water month labels (short single-letter, Oct=1 through Sep=12)
const WATER_MONTH_LABELS = [
  "O",
  "N",
  "D",
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
]

// Colors
const BAR_COLOR = "#f59e0b" // Amber for frequency bars
const MAGNITUDE_COLOR = "#d97706" // Darker amber for magnitude
const TEXT_COLOR = "#5a6c7a"
const SEPARATOR_COLOR = "#d0d8dd"
const NO_SPILL_COLOR = "#9ca3af"

const SpillChart: React.FC<SpillChartProps> = ({ data, width, height }) => {
  // Gather monthly data in water-month order (1-12)
  const months: Array<{ month: number; stats: SpillMonthlyStats | undefined }> =
    []
  for (let i = 1; i <= 12; i++) {
    months.push({ month: i, stats: data[i.toString()] })
  }

  // Check if there is any spill at all
  const hasAnySpill = months.some(
    (m) => m.stats && m.stats.spill_frequency_pct > 0,
  )

  // Layout constants
  const margin = { top: 6, right: 6, bottom: 16, left: 28 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  if (innerWidth <= 0 || innerHeight <= 0) {
    return (
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="transparent" />
      </svg>
    )
  }

  // If no spill at all, show centered message
  if (!hasAnySpill) {
    return (
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="transparent" />
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11px"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontWeight="500"
          fill={NO_SPILL_COLOR}
        >
          No spill
        </text>
      </svg>
    )
  }

  // Panel heights (within inner area)
  const separatorHeight = 1
  const topPanelHeight = (innerHeight - separatorHeight) * 0.6
  const bottomPanelHeight = (innerHeight - separatorHeight) * 0.4

  // X positioning for 12 bars
  const barGroupWidth = innerWidth / 12
  const barPadding = Math.max(1, barGroupWidth * 0.15)
  const barWidth = barGroupWidth - barPadding * 2

  // Top panel: frequency bars (0-100%)
  const freqScale = (pct: number) =>
    topPanelHeight - (pct / 100) * topPanelHeight

  // Bottom panel: spill magnitude
  // Find max q100 across months with spill
  const maxQ100 = Math.max(
    ...months
      .filter((m) => m.stats && m.stats.spill_frequency_pct > 0)
      .map((m) => m.stats!.spill_q100),
    1, // Prevent division by zero
  )

  const magnitudeScale = (cfs: number) =>
    bottomPanelHeight - (cfs / maxQ100) * (bottomPanelHeight - 4) // 4px top padding

  // Y positions for each panel (relative to inner group)
  const topPanelY = 0
  const separatorY = topPanelHeight
  const bottomPanelY = topPanelHeight + separatorHeight

  // Format CFS values for axis labels
  const formatCfs = (val: number): string => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}k`
    }
    return val.toFixed(0)
  }

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* ============ TOP PANEL: Frequency bars ============ */}

        {/* Y-axis labels for frequency */}
        <text
          x={-4}
          y={topPanelY + freqScale(100)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="8px"
          fontFamily="'Inter', -apple-system, sans-serif"
          fill={TEXT_COLOR}
        >
          100%
        </text>
        <text
          x={-4}
          y={topPanelY + freqScale(0)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="8px"
          fontFamily="'Inter', -apple-system, sans-serif"
          fill={TEXT_COLOR}
        >
          0
        </text>

        {/* Frequency bars */}
        {months.map((m, i) => {
          const freq = m.stats?.spill_frequency_pct ?? 0
          if (freq <= 0) return null

          const barHeight = (freq / 100) * topPanelHeight
          const x = i * barGroupWidth + barPadding
          const y = topPanelY + topPanelHeight - barHeight

          return (
            <rect
              key={`freq-${m.month}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={BAR_COLOR}
              rx={Math.min(barWidth / 4, 2)}
            />
          )
        })}

        {/* ============ SEPARATOR ============ */}
        <line
          x1={0}
          y1={separatorY}
          x2={innerWidth}
          y2={separatorY}
          stroke={SEPARATOR_COLOR}
          strokeWidth={separatorHeight}
        />

        {/* ============ BOTTOM PANEL: Spill magnitude ============ */}

        {/* Y-axis label for magnitude (max value) */}
        <text
          x={-4}
          y={bottomPanelY + magnitudeScale(maxQ100)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="8px"
          fontFamily="'Inter', -apple-system, sans-serif"
          fill={TEXT_COLOR}
        >
          {formatCfs(maxQ100)}
        </text>
        <text
          x={-4}
          y={bottomPanelY + magnitudeScale(0)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="8px"
          fontFamily="'Inter', -apple-system, sans-serif"
          fill={TEXT_COLOR}
        >
          0
        </text>

        {/* Magnitude lines and dots for months with spill */}
        {months.map((m, i) => {
          const stats = m.stats
          if (!stats || stats.spill_frequency_pct <= 0) return null

          const x = i * barGroupWidth + barGroupWidth / 2
          const yQ100 = bottomPanelY + magnitudeScale(stats.spill_q100)
          const yQ50 = bottomPanelY + magnitudeScale(stats.spill_q50)

          return (
            <g key={`mag-${m.month}`}>
              {/* Vertical line from q50 to q100 */}
              <line
                x1={x}
                y1={yQ100}
                x2={x}
                y2={yQ50}
                stroke={MAGNITUDE_COLOR}
                strokeWidth={1.5}
              />
              {/* Dot at q50 (median) */}
              <circle
                cx={x}
                cy={yQ50}
                r={Math.min(barWidth / 3, 3)}
                fill={MAGNITUDE_COLOR}
              />
            </g>
          )
        })}

        {/* ============ MONTH LABELS (shared at bottom) ============ */}
        {WATER_MONTH_LABELS.map((label, i) => (
          <text
            key={`label-${i}`}
            x={i * barGroupWidth + barGroupWidth / 2}
            y={innerHeight + 11}
            textAnchor="middle"
            fontSize="8px"
            fontFamily="'Inter', -apple-system, sans-serif"
            fill={TEXT_COLOR}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  )
}

export default React.memo(SpillChart)
