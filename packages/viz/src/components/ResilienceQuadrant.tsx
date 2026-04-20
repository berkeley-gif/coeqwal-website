"use client"

/**
 * ResilienceQuadrant
 *
 * D3 scatter/lattice plotting climate sensitivity (X) vs operational
 * leverage (Y). Two modes:
 *
 *   - "outcome": continuous axes. One dot per outcome (≈ 19 dots).
 *     X ∈ [-3, +3] tier delta, Y ∈ [0, 3] tier range.
 *   - "loi":     integer-lattice scatter for individual locations of
 *     interest within a single outcome. Dots that land on the same
 *     lattice cell get a shared count marker (sized by count) to avoid
 *     overplotting. X ∈ [-3, +3], Y ∈ [0, 3].
 *
 * Follows the @repo/viz hover-flicker rules (ref-based tooltip, stable
 * updateChart deps, callbacks passed through refs by the parent).
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { scaleLinear, scaleSqrt, axisBottom, axisLeft, select } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export type ResilienceQuadrantUnit = "outcome" | "loi"

export interface ResilienceQuadrantDatum {
  /** Stable id (outcome code or LOI id). */
  id: string
  /** Display label used in the axis/tooltip. */
  label: string
  /** Climate sensitivity: tier delta relative to historical. */
  x: number | null
  /** Operational leverage: tier range across siblings. */
  y: number | null
  /** Mean tier level at the reference HC; drives the dot's fill color. */
  tierAtRefHc: number | null
  /** Optional secondary tooltip label (e.g. outcome code for LOI mode). */
  secondary?: string
}

export interface ResilienceQuadrantPalette {
  text: string
  textMuted: string
  hoverStroke: string
  unavailableFill: string
  unavailableStroke: string
  axisLine: string
  gridLine: string
  quadrantLabel: string
  tooltipBg: string
  tooltipBorder: string
  tooltipShadow: string
  onDarkTier: string
  onLightTier: string
}

export interface ResilienceQuadrantProps {
  /** "outcome" (continuous axes) or "loi" (lattice). */
  unit: ResilienceQuadrantUnit
  data: ResilienceQuadrantDatum[]
  tierColors: readonly [string, string, string, string]
  palette: ResilienceQuadrantPalette
  /** Label shown next to the reference HC in the axis title. */
  climateRefHcLabel: string
  /**
   * Copy for the four quadrants, rendered as faint background tags.
   * Defaults follow the plan's "Robust anchors / Climate-exposed / Policy
   * wins / Double uncertainty" framing.
   */
  quadrantLabels?: {
    /** |x| low, y low */
    robust: string
    /** |x| high, y low */
    exposed: string
    /** |x| low, y high */
    policy: string
    /** |x| high, y high */
    double: string
  }
  responsive?: boolean
  width?: number
  height?: number
  onDotHover?: (datum: ResilienceQuadrantDatum | null) => void
  onDotClick?: (datum: ResilienceQuadrantDatum) => void
}

const MARGIN = { top: 32, right: 28, bottom: 56, left: 64 }
const DOT_RADIUS_OUTCOME = 7
const DOT_RADIUS_LOI_BASE = 5
const LOI_LATTICE_STEP = 1 // integer lattice

const DEFAULT_QUADRANT_LABELS = {
  robust: "Robust anchors",
  exposed: "Climate-exposed",
  policy: "Policy wins",
  double: "Double uncertainty",
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function clampTier(value: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4
}

const ResilienceQuadrant: React.FC<ResilienceQuadrantProps> = React.memo(
  ({
    unit,
    data,
    tierColors,
    palette,
    climateRefHcLabel,
    quadrantLabels = DEFAULT_QUADRANT_LABELS,
    responsive = true,
    width = 640,
    height = 480,
    onDotHover,
    onDotClick,
  }) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const tooltipRef = useRef<HTMLDivElement | null>(null)

    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

    const onDotHoverRef = useRef(onDotHover)
    useEffect(() => {
      onDotHoverRef.current = onDotHover
    }, [onDotHover])

    const onDotClickRef = useRef(onDotClick)
    useEffect(() => {
      onDotClickRef.current = onDotClick
    }, [onDotClick])

    useEffect(() => {
      if (responsive && dimensions.width > 0 && dimensions.height > 0) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else if (!responsive) {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [dimensions, responsive, width, height])

    const [tier1, tier2, tier3, tier4] = tierColors
    const colorScale = useCallback(
      (tier: number) => {
        const t = clampTier(tier)
        if (t === 1) return tier1
        if (t === 2) return tier2
        if (t === 3) return tier3
        return tier4
      },
      [tier1, tier2, tier3, tier4],
    )

    // LOI mode: bin datapoints on integer lattice for count sizing.
    const loiBinned = useMemo(() => {
      if (unit !== "loi") return null
      const bins = new Map<
        string,
        {
          bx: number
          by: number
          items: ResilienceQuadrantDatum[]
          tierSum: number
          tierCount: number
        }
      >()
      for (const d of data) {
        if (d.x == null || d.y == null) continue
        const bx = Math.round(d.x / LOI_LATTICE_STEP) * LOI_LATTICE_STEP
        const by = Math.round(d.y / LOI_LATTICE_STEP) * LOI_LATTICE_STEP
        const key = `${bx}|${by}`
        const existing = bins.get(key)
        if (existing) {
          existing.items.push(d)
          if (d.tierAtRefHc != null) {
            existing.tierSum += d.tierAtRefHc
            existing.tierCount += 1
          }
        } else {
          bins.set(key, {
            bx,
            by,
            items: [d],
            tierSum: d.tierAtRefHc ?? 0,
            tierCount: d.tierAtRefHc != null ? 1 : 0,
          })
        }
      }
      return Array.from(bins.values())
    }, [unit, data])

    const positionTooltip = useCallback((event: MouseEvent) => {
      const el = tooltipRef.current
      const container = containerRef.current
      if (!el || !container) return
      const rect = container.getBoundingClientRect()
      el.style.left = `${event.clientX - rect.left + 12}px`
      el.style.top = `${event.clientY - rect.top + 12}px`
    }, [])

    const showTooltip = useCallback(
      (event: MouseEvent, html: string) => {
        const el = tooltipRef.current
        if (!el) return
        el.innerHTML = html
        el.style.display = "block"
        positionTooltip(event)
      },
      [positionTooltip],
    )

    const hideTooltip = useCallback(() => {
      const el = tooltipRef.current
      if (el) el.style.display = "none"
    }, [])

    const {
      text: paletteText,
      textMuted: paletteTextMuted,
      hoverStroke: paletteHoverStroke,
      axisLine: paletteAxisLine,
      gridLine: paletteGridLine,
      quadrantLabel: paletteQuadrantLabel,
      unavailableFill: paletteUnavailFill,
      unavailableStroke: paletteUnavailStroke,
    } = palette

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (!svgRef.current) return
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (w <= 0 || h <= 0) return

        const innerW = w - MARGIN.left - MARGIN.right
        const innerH = h - MARGIN.top - MARGIN.bottom
        if (innerW <= 0 || innerH <= 0) return

        const g = svg
          .append("g")
          .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

        const xScale = scaleLinear().domain([-3, 3]).range([0, innerW]).nice()
        const yScale = scaleLinear().domain([0, 3]).range([innerH, 0]).nice()

        // Light grid.
        g.append("g")
          .attr("class", "resilience-quadrant-grid")
          .attr("stroke", paletteGridLine)
          .attr("stroke-dasharray", "2 3")
          .attr("opacity", 0.7)
          .call((gridG) => {
            const xTicks = xScale.ticks(7)
            xTicks.forEach((tx) => {
              const px = xScale(tx)
              gridG
                .append("line")
                .attr("x1", px)
                .attr("x2", px)
                .attr("y1", 0)
                .attr("y2", innerH)
            })
            const yTicks = yScale.ticks(4)
            yTicks.forEach((ty) => {
              const py = yScale(ty)
              gridG
                .append("line")
                .attr("x1", 0)
                .attr("x2", innerW)
                .attr("y1", py)
                .attr("y2", py)
            })
          })

        // Quadrant background labels. Y-axis starts at 0, so "low Y" is
        // the lower half and "high Y" the upper. X = 0 divides left/right
        // halves (|x| groupings are symmetric).
        const labelSpec: Array<{
          xFrac: number
          yFrac: number
          text: string
          anchor: "start" | "middle" | "end"
        }> = [
          {
            xFrac: 0.5,
            yFrac: 0.85,
            text: quadrantLabels.robust,
            anchor: "middle",
          },
          {
            xFrac: 0.08,
            yFrac: 0.85,
            text: quadrantLabels.exposed,
            anchor: "start",
          },
          {
            xFrac: 0.5,
            yFrac: 0.12,
            text: quadrantLabels.policy,
            anchor: "middle",
          },
          {
            xFrac: 0.92,
            yFrac: 0.12,
            text: quadrantLabels.double,
            anchor: "end",
          },
        ]
        labelSpec.forEach(({ xFrac, yFrac, text, anchor }) => {
          g.append("text")
            .attr("x", xFrac * innerW)
            .attr("y", yFrac * innerH)
            .attr("text-anchor", anchor)
            .attr("font-size", 10)
            .attr("font-weight", 600)
            .attr("font-style", "italic")
            .attr("fill", paletteQuadrantLabel)
            .text(text)
        })

        // Axes.
        const xAxis = axisBottom(xScale).tickValues([-3, -2, -1, 0, 1, 2, 3])
        const yAxis = axisLeft(yScale).tickValues([0, 1, 2, 3])

        const xAxisG = g
          .append("g")
          .attr("transform", `translate(0,${innerH})`)
          .call(xAxis)
        xAxisG.selectAll("path,line").attr("stroke", paletteAxisLine)
        xAxisG
          .selectAll("text")
          .attr("fill", paletteTextMuted)
          .attr("font-size", 10)

        const yAxisG = g.append("g").call(yAxis)
        yAxisG.selectAll("path,line").attr("stroke", paletteAxisLine)
        yAxisG
          .selectAll("text")
          .attr("fill", paletteTextMuted)
          .attr("font-size", 10)

        // Axis titles.
        g.append("text")
          .attr("x", innerW / 2)
          .attr("y", innerH + 40)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("font-weight", 600)
          .attr("fill", paletteText)
          .text(`Climate shift (Δ tier vs historical at ${climateRefHcLabel})`)

        g.append("text")
          .attr("transform", `translate(${-46},${innerH / 2}) rotate(-90)`)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("font-weight", 600)
          .attr("fill", paletteText)
          .text("Operational leverage (tier range across ops)")

        // Zero-x emphasis line.
        g.append("line")
          .attr("x1", xScale(0))
          .attr("x2", xScale(0))
          .attr("y1", 0)
          .attr("y2", innerH)
          .attr("stroke", paletteAxisLine)
          .attr("stroke-width", 1)
          .attr("opacity", 0.9)

        // Dots.
        const plotLayer = g
          .append("g")
          .attr("class", "resilience-quadrant-dots")

        if (unit === "outcome") {
          data.forEach((d) => {
            const available = d.x != null && d.y != null
            const px = available ? xScale(clamp(d.x!, -3, 3)) : 0
            const py = available ? yScale(clamp(d.y!, 0, 3)) : 0
            const fill =
              d.tierAtRefHc != null
                ? colorScale(d.tierAtRefHc)
                : paletteUnavailFill
            const stroke =
              d.tierAtRefHc != null ? "transparent" : paletteUnavailStroke

            const node = plotLayer
              .append("g")
              .attr("class", "quadrant-dot")
              .style("cursor", onDotClick ? "pointer" : "default")

            if (available) {
              node
                .append("circle")
                .attr("cx", px)
                .attr("cy", py)
                .attr("r", DOT_RADIUS_OUTCOME)
                .attr("fill", fill)
                .attr("stroke", stroke)
                .attr("stroke-width", 1.5)
              node
                .append("text")
                .attr("x", px + DOT_RADIUS_OUTCOME + 3)
                .attr("y", py)
                .attr("dominant-baseline", "central")
                .attr("font-size", 10)
                .attr("fill", paletteText)
                .attr("pointer-events", "none")
                .text(d.label)
            }

            node
              .on("mouseenter", function (event: MouseEvent) {
                if (!available) return
                select(this)
                  .select("circle")
                  .attr("stroke", paletteHoverStroke)
                  .attr("stroke-width", 2)
                showTooltip(
                  event,
                  `<div style="font-weight:600;color:${paletteText}">${escapeHtml(
                    d.label,
                  )}</div>
                  <div style="color:${paletteTextMuted}">Climate shift: ${formatSigned(
                    d.x!,
                  )} tiers</div>
                  <div style="color:${paletteTextMuted}">Operational leverage: ${d.y!.toFixed(
                    1,
                  )} tiers</div>
                  ${
                    d.tierAtRefHc != null
                      ? `<div style="color:${paletteTextMuted}">Mean tier at ${escapeHtml(
                          climateRefHcLabel,
                        )}: ${d.tierAtRefHc.toFixed(2)}</div>`
                      : ""
                  }`,
                )
                onDotHoverRef.current?.(d)
              })
              .on("mousemove", (event: MouseEvent) => positionTooltip(event))
              .on("mouseleave", function () {
                select(this)
                  .select("circle")
                  .attr("stroke", stroke)
                  .attr("stroke-width", 1.5)
                hideTooltip()
                onDotHoverRef.current?.(null)
              })
              .on("click", () => {
                if (available) onDotClickRef.current?.(d)
              })
          })
        } else if (unit === "loi" && loiBinned) {
          // Bin-sized dots; area scales with count.
          const maxCount = Math.max(1, ...loiBinned.map((b) => b.items.length))
          const sizeScale = scaleSqrt()
            .domain([1, Math.max(1, maxCount)])
            .range([DOT_RADIUS_LOI_BASE, DOT_RADIUS_LOI_BASE * 3])

          loiBinned.forEach((bin) => {
            const px = xScale(clamp(bin.bx, -3, 3))
            const py = yScale(clamp(bin.by, 0, 3))
            const meanTier =
              bin.tierCount > 0 ? bin.tierSum / bin.tierCount : null
            const fill =
              meanTier != null ? colorScale(meanTier) : paletteUnavailFill
            const stroke =
              meanTier != null ? "transparent" : paletteUnavailStroke
            const r = sizeScale(bin.items.length)

            const node = plotLayer.append("g").attr("class", "quadrant-bin")

            node
              .append("circle")
              .attr("cx", px)
              .attr("cy", py)
              .attr("r", r)
              .attr("fill", fill)
              .attr("stroke", stroke)
              .attr("stroke-width", 1.25)
              .attr("fill-opacity", 0.85)

            if (bin.items.length > 1) {
              node
                .append("text")
                .attr("x", px)
                .attr("y", py)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", Math.min(r * 0.95, 11))
                .attr("font-weight", 600)
                .attr(
                  "fill",
                  meanTier != null && meanTier <= 2
                    ? palette.onDarkTier
                    : palette.onLightTier,
                )
                .attr("pointer-events", "none")
                .text(String(bin.items.length))
            }

            node
              .on("mouseenter", function (event: MouseEvent) {
                select(this)
                  .select("circle")
                  .attr("stroke", paletteHoverStroke)
                  .attr("stroke-width", 2)
                const names = bin.items
                  .slice(0, 5)
                  .map((it) => escapeHtml(it.label))
                  .join("<br/>")
                const more =
                  bin.items.length > 5
                    ? `<br/><span style="color:${paletteTextMuted}">+ ${
                        bin.items.length - 5
                      } more…</span>`
                    : ""
                showTooltip(
                  event,
                  `<div style="font-weight:600;color:${paletteText}">${
                    bin.items.length === 1
                      ? escapeHtml(bin.items[0]!.label)
                      : `${bin.items.length} locations`
                  }</div>
                  <div style="color:${paletteTextMuted}">Climate shift: ${formatSigned(
                    bin.bx,
                  )} tiers</div>
                  <div style="color:${paletteTextMuted}">Operational leverage: ${bin.by.toFixed(
                    1,
                  )} tiers</div>
                  ${
                    meanTier != null
                      ? `<div style="color:${paletteTextMuted}">Mean tier: ${meanTier.toFixed(
                          2,
                        )}</div>`
                      : ""
                  }
                  ${
                    bin.items.length > 1
                      ? `<div style="margin-top:4px;color:${paletteText}">${names}${more}</div>`
                      : ""
                  }`,
                )
                // Fire hover with the first item in the bin; panel
                // decides how to react (e.g. focus the map on it).
                onDotHoverRef.current?.(bin.items[0] ?? null)
              })
              .on("mousemove", (event: MouseEvent) => positionTooltip(event))
              .on("mouseleave", function () {
                select(this)
                  .select("circle")
                  .attr("stroke", stroke)
                  .attr("stroke-width", 1.25)
                hideTooltip()
                onDotHoverRef.current?.(null)
              })
              .on("click", () => {
                if (bin.items.length > 0) onDotClickRef.current?.(bin.items[0]!)
              })
          })
        }
      },
      [
        unit,
        data,
        loiBinned,
        colorScale,
        onDotClick,
        climateRefHcLabel,
        quadrantLabels,
        paletteText,
        paletteTextMuted,
        paletteHoverStroke,
        paletteAxisLine,
        paletteGridLine,
        paletteQuadrantLabel,
        paletteUnavailFill,
        paletteUnavailStroke,
        palette.onDarkTier,
        palette.onLightTier,
        showTooltip,
        positionTooltip,
        hideTooltip,
      ],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        updateChart(currentWidth, currentHeight)
      }
    }, [currentWidth, currentHeight, updateChart])

    return (
      <div
        ref={containerRef}
        style={{
          width: responsive ? "100%" : currentWidth,
          height: responsive ? "100%" : currentHeight,
          minHeight: 300,
          position: "relative",
        }}
      >
        <svg
          ref={svgRef}
          width={currentWidth}
          height={currentHeight}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            display: "none",
            pointerEvents: "none",
            background: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            lineHeight: 1.5,
            zIndex: 20,
            boxShadow: palette.tooltipShadow,
            maxWidth: 320,
          }}
        />
      </div>
    )
  },
)

ResilienceQuadrant.displayName = "ResilienceQuadrant"

function formatSigned(value: number): string {
  if (Math.abs(value) < 0.05) return "0"
  const sign = value > 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(1)}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export default ResilienceQuadrant
