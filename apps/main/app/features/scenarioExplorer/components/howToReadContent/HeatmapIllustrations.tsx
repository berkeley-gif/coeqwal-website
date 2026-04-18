"use client"

/**
 * Small static SVG illustrations that mirror the resilience heatmap's
 * cell encodings. These are pure presentational figures (no data
 * fetching) that use the same theme palettes the real chart uses so
 * they read as honest samples.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { TIER_LABELS } from "../../../../content/tiers"

const CELL = 48
const CELL_RADIUS = 6
const CELL_GAP = 6

function Figure({
  caption,
  children,
}: {
  caption: string
  children: React.ReactNode
}) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        my: theme.space.component.sm,
        p: theme.space.component.md,
        border: theme.border.light,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.palette.grey[50],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.space.component.xs,
      }}
    >
      {children}
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          textAlign: "center",
          maxWidth: 520,
        }}
      >
        {caption}
      </Typography>
    </Box>
  )
}

/** Row of four tier swatches with their labels underneath. */
export function TierLegend() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const entries: Array<{ level: 1 | 2 | 3 | 4; color: string }> = [
    { level: 1, color: tiers.tier1 },
    { level: 2, color: tiers.tier2 },
    { level: 3, color: tiers.tier3 },
    { level: 4, color: tiers.tier4 },
  ]
  const width = entries.length * CELL + (entries.length - 1) * CELL_GAP
  const textY = CELL + 22
  const labelY = CELL + 38
  return (
    <Figure caption="The four categorical tiers. Lower numbers are better.">
      <svg
        width={width}
        height={CELL + 48}
        role="img"
        aria-label="Tier color scale"
      >
        {entries.map((e, i) => {
          const x = i * (CELL + CELL_GAP)
          return (
            <g key={e.level}>
              <rect
                x={x}
                y={0}
                width={CELL}
                height={CELL}
                rx={CELL_RADIUS}
                fill={e.color}
              />
              <text
                x={x + CELL / 2}
                y={CELL / 2 + 5}
                textAnchor="middle"
                fontSize={16}
                fontWeight={600}
                fill="#ffffff"
              >
                {e.level}
              </text>
              <text
                x={x + CELL / 2}
                y={textY}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill={theme.palette.text.primary}
              >
                Tier {e.level}
              </text>
              <text
                x={x + CELL / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fill={theme.palette.text.secondary}
              >
                {TIER_LABELS[e.level]}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** Summary cell with an arrow pointing to the continuous mean value. */
export function SummaryCellExample() {
  const theme = useTheme()
  const size = 96
  return (
    <Figure caption="Summary mode: color encodes the categorical tier; the number is the arithmetic mean across LOIs.">
      <svg width={260} height={size + 20} role="img" aria-label="Summary cell">
        <rect
          x={0}
          y={10}
          width={size}
          height={size}
          rx={CELL_RADIUS}
          fill={theme.palette.tiers.tier2}
        />
        <text
          x={size / 2}
          y={size / 2 + 18}
          textAnchor="middle"
          fontSize={30}
          fontWeight={600}
          fill="#ffffff"
        >
          2.3
        </text>
        <line
          x1={size + 12}
          y1={size / 2 + 10}
          x2={size + 60}
          y2={size / 2 + 10}
          stroke={theme.palette.text.secondary}
          strokeWidth={1.2}
          markerEnd="url(#arrowHead)"
        />
        <defs>
          <marker
            id="arrowHead"
            markerWidth={8}
            markerHeight={8}
            refX={6}
            refY={4}
            orient="auto"
          >
            <path
              d="M0,0 L6,4 L0,8 Z"
              fill={theme.palette.text.secondary}
            />
          </marker>
        </defs>
        <text
          x={size + 66}
          y={size / 2 + 2}
          fontSize={11}
          fontWeight={600}
          fill={theme.palette.text.primary}
        >
          mean tier = 2.3
        </text>
        <text
          x={size + 66}
          y={size / 2 + 18}
          fontSize={10}
          fill={theme.palette.text.secondary}
        >
          colored as tier 2
        </text>
      </svg>
    </Figure>
  )
}

/** Five-stop diverging strip showing delta anchors. */
export function DeltaCellExample() {
  const theme = useTheme()
  const d = theme.palette.tierDiverging
  const entries = [
    { color: d.negStrong, label: "-3", caption: "improved" },
    { color: d.negWeak, label: "-1.5", caption: "" },
    { color: d.zero, label: "0", caption: "no change" },
    { color: d.posWeak, label: "+1.5", caption: "" },
    { color: d.posStrong, label: "+3", caption: "worse" },
  ]
  const width = entries.length * CELL + (entries.length - 1) * CELL_GAP
  return (
    <Figure caption="Delta mode: diverging palette anchored at zero. Cool = better than reference, warm = worse.">
      <svg
        width={width}
        height={CELL + 36}
        role="img"
        aria-label="Delta diverging scale"
      >
        {entries.map((e, i) => {
          const x = i * (CELL + CELL_GAP)
          return (
            <g key={i}>
              <rect
                x={x}
                y={0}
                width={CELL}
                height={CELL}
                rx={CELL_RADIUS}
                fill={e.color}
                stroke={theme.palette.grey[300]}
                strokeWidth={0.5}
              />
              <text
                x={x + CELL / 2}
                y={CELL / 2 + 5}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill={theme.palette.text.primary}
              >
                {e.label}
              </text>
              {e.caption && (
                <text
                  x={x + CELL / 2}
                  y={CELL + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill={theme.palette.text.secondary}
                >
                  {e.caption}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** Two-channel density: risk (red ramp) and opportunity (green ramp). */
export function DensityCellExample() {
  const theme = useTheme()
  const d = theme.palette.tierDensity
  const size = 64
  const samples: Array<{
    risk: number
    opp: number
    label: string
  }> = [
    { risk: 0.1, opp: 0.7, label: "mostly opportunity" },
    { risk: 0.4, opp: 0.4, label: "mixed" },
    { risk: 0.8, opp: 0.05, label: "high risk" },
  ]

  function mix(from: string, to: string, t: number): string {
    const fr = parseInt(from.slice(1, 3), 16)
    const fg = parseInt(from.slice(3, 5), 16)
    const fb = parseInt(from.slice(5, 7), 16)
    const tr = parseInt(to.slice(1, 3), 16)
    const tg = parseInt(to.slice(3, 5), 16)
    const tb = parseInt(to.slice(5, 7), 16)
    const r = Math.round(fr + (tr - fr) * t)
    const g = Math.round(fg + (tg - fg) * t)
    const b = Math.round(fb + (tb - fb) * t)
    return `#${[r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`
  }

  const gap = 12
  const perCell = size * 2 + gap
  const width = samples.length * perCell + (samples.length - 1) * 24
  return (
    <Figure caption="Density mode: each cell has two stacked halves — top half shows share of LOIs at risk, bottom shows share that are performing well.">
      <svg
        width={width}
        height={size * 2 + 36}
        role="img"
        aria-label="Density cells"
      >
        {samples.map((s, i) => {
          const x = i * (perCell + 24)
          return (
            <g key={i}>
              <rect
                x={x}
                y={0}
                width={size * 2}
                height={size}
                rx={CELL_RADIUS}
                fill={mix(d.riskMin, d.riskMax, s.risk)}
                stroke={theme.palette.grey[300]}
                strokeWidth={0.5}
              />
              <rect
                x={x}
                y={size + 2}
                width={size * 2}
                height={size}
                rx={CELL_RADIUS}
                fill={mix(d.oppMin, d.oppMax, s.opp)}
                stroke={theme.palette.grey[300]}
                strokeWidth={0.5}
              />
              <text
                x={x + size}
                y={size * 2 + 22}
                textAnchor="middle"
                fontSize={10}
                fill={theme.palette.text.secondary}
              >
                {s.label}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** Cell filled with a grid of rounded squares, one per scenario, colored
 *  by that scenario's tier. Matches the rendering in aggregate/distribution
 *  mode of the heatmap and the key-outcomes glyph in get-started.
 *  Illustrates the **"By scenario"** sub-mode. */
export function DistributionCellExample() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const tierColor = (t: 1 | 2 | 3 | 4) =>
    ({ 1: tiers.tier1, 2: tiers.tier2, 3: tiers.tier3, 4: tiers.tier4 })[t]

  // Mock 24 entries (like the "all scenarios" aggregate scope) in three
  // shapes so readers can see why distribution is worth the extra layer.
  const samples: Array<{
    title: string
    counts: [number, number, number, number]
  }> = [
    { title: "healthy", counts: [14, 6, 3, 1] },
    { title: "uniform", counts: [6, 6, 6, 6] },
    { title: "bimodal", counts: [11, 0, 0, 13] },
  ]

  // Layout identical to the heatmap renderer: up to 10 cols, gap/corner
  // scaled to 20% of square size.
  const cellW = 140
  const cellH = 72
  const hPad = 4
  const vPad = 4
  const entries = samples.map((s) => {
    const list: Array<{ tier: 1 | 2 | 3 | 4 }> = []
    ;([1, 2, 3, 4] as const).forEach((t) => {
      const count = s.counts[t - 1] ?? 0
      for (let i = 0; i < count; i++) list.push({ tier: t })
    })
    return { ...s, list }
  })
  const innerW = cellW - hPad * 2
  const innerH = cellH - vPad * 2
  const cols = 10
  // Worst-case rows across samples so all three cells are the same size.
  const maxTotal = Math.max(...entries.map((e) => e.list.length))
  const rows = Math.max(1, Math.ceil(maxTotal / cols))
  const sW = innerW / (1.2 * cols - 0.2)
  const sH = innerH / (1.2 * rows - 0.2)
  const squareSize = Math.min(sW, sH)
  const gap = Math.max(0.5, squareSize * 0.2)
  const corner = Math.max(1, squareSize * 0.2)
  const stride = squareSize + gap
  const gridW = cols * stride - gap
  const gridH = rows * stride - gap

  const betweenGap = 20
  const width = samples.length * cellW + (samples.length - 1) * betweenGap
  return (
    <Figure caption="Distribution mode, By scenario: one small square per scenario, colored by its tier. 'Bimodal' is invisible to the mean alone. Hovering a square highlights that scenario in the sidebar and scrolls it into view.">
      <svg
        width={width}
        height={cellH + 28}
        role="img"
        aria-label="Distribution cells by scenario"
      >
        {entries.map((s, i) => {
          const x0 = i * (cellW + betweenGap)
          const gx = x0 + hPad + (innerW - gridW) / 2
          const gy = vPad + (innerH - gridH) / 2
          return (
            <g key={i}>
              <rect
                x={x0}
                y={0}
                width={cellW}
                height={cellH}
                rx={CELL_RADIUS}
                fill={theme.palette.common.white ?? "#ffffff"}
                stroke={theme.palette.grey[300]}
                strokeWidth={0.5}
              />
              {s.list.map((e, idx) => {
                const col = idx % cols
                const row = Math.floor(idx / cols)
                return (
                  <rect
                    key={idx}
                    x={gx + col * stride}
                    y={gy + row * stride}
                    width={squareSize}
                    height={squareSize}
                    rx={corner}
                    ry={corner}
                    fill={tierColor(e.tier)}
                    opacity={0.9}
                  />
                )
              })}
              <text
                x={x0 + cellW / 2}
                y={cellH + 18}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill={theme.palette.text.secondary}
              >
                {s.title}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** Same grid-of-squares encoding, but each square is one LOI (location
 *  of interest) colored by its mean tier across the aggregated scenarios.
 *  Illustrates the **"By location"** sub-mode. */
export function DistributionCellLocationExample() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const tierColor = (t: 1 | 2 | 3 | 4) =>
    ({ 1: tiers.tier1, 2: tiers.tier2, 3: tiers.tier3, 4: tiers.tier4 })[t]

  // A representative LOI count (~14 per outcome is typical) arranged
  // into scenes the reader can compare.
  const samples: Array<{
    title: string
    counts: [number, number, number, number]
  }> = [
    { title: "mostly healthy", counts: [9, 3, 1, 1] },
    { title: "mixed", counts: [4, 4, 3, 3] },
    { title: "stressed pocket", counts: [3, 2, 4, 5] },
  ]

  const cellW = 140
  const cellH = 72
  const hPad = 4
  const vPad = 4
  const entries = samples.map((s) => {
    const list: Array<{ tier: 1 | 2 | 3 | 4 }> = []
    ;([1, 2, 3, 4] as const).forEach((t) => {
      const count = s.counts[t - 1] ?? 0
      for (let i = 0; i < count; i++) list.push({ tier: t })
    })
    return { ...s, list }
  })
  const innerW = cellW - hPad * 2
  const innerH = cellH - vPad * 2
  const cols = 8
  const maxTotal = Math.max(...entries.map((e) => e.list.length))
  const rows = Math.max(1, Math.ceil(maxTotal / cols))
  const sW = innerW / (1.2 * cols - 0.2)
  const sH = innerH / (1.2 * rows - 0.2)
  const squareSize = Math.min(sW, sH)
  const gap = Math.max(0.5, squareSize * 0.2)
  const corner = Math.max(1, squareSize * 0.2)
  const stride = squareSize + gap
  const gridW = cols * stride - gap
  const gridH = rows * stride - gap

  const betweenGap = 20
  const width = samples.length * cellW + (samples.length - 1) * betweenGap
  return (
    <Figure caption="Distribution mode, By location: one small square per LOI (location of interest), colored by the mean tier across the aggregated scenarios. Hovering a square highlights that LOI on the map (when the map is open).">
      <svg
        width={width}
        height={cellH + 28}
        role="img"
        aria-label="Distribution cells by location"
      >
        {entries.map((s, i) => {
          const x0 = i * (cellW + betweenGap)
          const gx = x0 + hPad + (innerW - gridW) / 2
          const gy = vPad + (innerH - gridH) / 2
          return (
            <g key={i}>
              <rect
                x={x0}
                y={0}
                width={cellW}
                height={cellH}
                rx={CELL_RADIUS}
                fill={theme.palette.common.white ?? "#ffffff"}
                stroke={theme.palette.grey[300]}
                strokeWidth={0.5}
              />
              {s.list.map((e, idx) => {
                const col = idx % cols
                const row = Math.floor(idx / cols)
                return (
                  <rect
                    key={idx}
                    x={gx + col * stride}
                    y={gy + row * stride}
                    width={squareSize}
                    height={squareSize}
                    rx={corner}
                    ry={corner}
                    fill={tierColor(e.tier)}
                    opacity={0.9}
                  />
                )
              })}
              <text
                x={x0 + cellW / 2}
                y={cellH + 18}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill={theme.palette.text.secondary}
              >
                {s.title}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/** Simple 2x2 quadrant diagram with axis labels and quadrant captions. */
export function QuadrantDiagram() {
  const theme = useTheme()
  const W = 360
  const H = 260
  const padL = 60
  const padR = 20
  const padT = 24
  const padB = 44
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const midX = padL + innerW / 2
  const midY = padT + innerH / 2
  const stroke = theme.palette.grey[400]
  const faint = theme.palette.grey[200]

  const labels: Array<{
    x: number
    y: number
    text: string
    subtitle: string
  }> = [
    {
      x: padL + innerW * 0.25,
      y: padT + innerH * 0.25,
      text: "Robust",
      subtitle: "low sensitivity, low leverage",
    },
    {
      x: padL + innerW * 0.75,
      y: padT + innerH * 0.25,
      text: "Climate-limited",
      subtitle: "policy can't rescue it",
    },
    {
      x: padL + innerW * 0.25,
      y: padT + innerH * 0.75,
      text: "Operationally tractable",
      subtitle: "policy moves it a lot",
    },
    {
      x: padL + innerW * 0.75,
      y: padT + innerH * 0.75,
      text: "High-stakes",
      subtitle: "climate + policy both matter",
    },
  ]

  const dots = [
    { x: padL + innerW * 0.18, y: padT + innerH * 0.28 },
    { x: padL + innerW * 0.3, y: padT + innerH * 0.22 },
    { x: padL + innerW * 0.72, y: padT + innerH * 0.2 },
    { x: padL + innerW * 0.8, y: padT + innerH * 0.3 },
    { x: padL + innerW * 0.22, y: padT + innerH * 0.78 },
    { x: padL + innerW * 0.3, y: padT + innerH * 0.7 },
    { x: padL + innerW * 0.68, y: padT + innerH * 0.72 },
    { x: padL + innerW * 0.82, y: padT + innerH * 0.82 },
  ]

  return (
    <Figure caption="Quadrant view: one dot per outcome. The axes separate what climate controls from what operations can move.">
      <svg width={W} height={H} role="img" aria-label="Quadrant schematic">
        <rect
          x={padL}
          y={padT}
          width={innerW}
          height={innerH}
          fill="#ffffff"
          stroke={faint}
          strokeWidth={1}
        />
        <line
          x1={midX}
          y1={padT}
          x2={midX}
          y2={padT + innerH}
          stroke={stroke}
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={midY}
          x2={padL + innerW}
          y2={midY}
          stroke={stroke}
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        {labels.map((l, i) => (
          <g key={i}>
            <text
              x={l.x}
              y={l.y - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill={theme.palette.text.primary}
            >
              {l.text}
            </text>
            <text
              x={l.x}
              y={l.y + 8}
              textAnchor="middle"
              fontSize={9}
              fill={theme.palette.text.secondary}
            >
              {l.subtitle}
            </text>
          </g>
        ))}
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={4}
            fill={theme.palette.blue.bright}
            opacity={0.75}
          />
        ))}
        <text
          x={padL + innerW / 2}
          y={H - 14}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={theme.palette.text.primary}
        >
          climate sensitivity →
        </text>
        <text
          x={18}
          y={padT + innerH / 2}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={theme.palette.text.primary}
          transform={`rotate(-90 18 ${padT + innerH / 2})`}
        >
          operational leverage →
        </text>
      </svg>
    </Figure>
  )
}

export default {}
