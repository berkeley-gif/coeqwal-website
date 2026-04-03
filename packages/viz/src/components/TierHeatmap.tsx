"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { scaleBand, select } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface TierHeatmapCell {
  scenarioId: string
  scenarioName: string
  outcomeCode: string
  outcomeName: string
  tierLevel: number // 1–4
  normalizedScore: number // 0–1
}

export interface TierHeatmapProps {
  cells: TierHeatmapCell[]
  scenarioIds: string[]
  scenarioNames: string[]
  outcomeNames: string[]
  responsive?: boolean
  width?: number
  height?: number
  lineColors?: string[]
  onCellHover?: (cell: TierHeatmapCell | null) => void
  onCellClick?: (cell: TierHeatmapCell) => void
  highlightedIds?: Set<string> | null
  chosenIds?: Set<string>
  /** Monotonically increasing counter.triggers morph transitions instead of full rebuild */
  morphGeneration?: number
}

const MARGIN = { top: 10, right: 20, bottom: 100, left: 160 }
const TIER_COLOR_SCALE = ["#08519c", "#3182bd", "#9ecae1", "#deebf7"] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  outcomeName: string
}

const TierHeatmap: React.FC<TierHeatmapProps> = React.memo(
  ({
    cells,
    scenarioIds,
    scenarioNames,
    outcomeNames,
    responsive = true,
    width = 700,
    height = 500,
    lineColors,
    onCellHover,
    onCellClick,
    highlightedIds,
    chosenIds,
    morphGeneration,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)

    // Hydroclimate morph detection
    const shouldMorphNextRef = useRef(false)
    const prevMorphGenRef = useRef(morphGeneration)
    if (
      morphGeneration !== undefined &&
      prevMorphGenRef.current !== undefined &&
      morphGeneration !== prevMorphGenRef.current
    ) {
      shouldMorphNextRef.current = true
    }
    prevMorphGenRef.current = morphGeneration

    const onCellHoverRef = useRef(onCellHover)
    useEffect(() => {
      onCellHoverRef.current = onCellHover
    }, [onCellHover])
    const onCellClickRef = useRef(onCellClick)
    useEffect(() => {
      onCellClickRef.current = onCellClick
    }, [onCellClick])

    useEffect(() => {
      if (responsive && dimensions.width > 0 && dimensions.height > 0) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else if (!responsive) {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [dimensions, responsive, width, height])

    const updateChart = useCallback(
      (w: number, h: number) => {
        // ── Hydroclimate morph: transition cell colors ──
        if (shouldMorphNextRef.current && cells.length > 0) {
          shouldMorphNextRef.current = false
          const HC_DUR = 600
          const svg = select(svgRef.current)
          const cellMap = new Map(
            cells.map((c) => [`${c.scenarioId}__${c.outcomeName}`, c]),
          )
          const colorScale = (tier: number) =>
            TIER_COLOR_SCALE[Math.min(Math.max(tier - 1, 0), 3)]

          svg
            .selectAll<SVGRectElement, unknown>("rect.hm-cell")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const oName = el.attr("data-outcome")
              if (!sid || !oName) return
              const cell = cellMap.get(`${sid}__${oName}`)
              if (!cell) return
              el.transition()
                .duration(HC_DUR)
                .attr("fill", colorScale(cell.tierLevel) ?? "#deebf7")
            })

          svg
            .selectAll<SVGTextElement, unknown>("text.hm-label")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const oName = el.attr("data-outcome")
              if (!sid || !oName) return
              const cell = cellMap.get(`${sid}__${oName}`)
              if (!cell) return
              el.text(cell.tierLevel).attr(
                "fill",
                cell.tierLevel <= 2 ? "#fff" : "#333",
              )
            })

          return
        }
        shouldMorphNextRef.current = false

        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (cells.length === 0 || w <= 0 || h <= 0) return

        const innerW = w - MARGIN.left - MARGIN.right
        const innerH = h - MARGIN.top - MARGIN.bottom
        if (innerW <= 0 || innerH <= 0) return

        const g = svg
          .append("g")
          .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

        const xScale = scaleBand<string>()
          .domain(outcomeNames)
          .range([0, innerW])
          .padding(0.06)

        const yScale = scaleBand<string>()
          .domain(scenarioNames)
          .range([0, innerH])
          .padding(0.06)

        const colorScale = (tier: number) =>
          TIER_COLOR_SCALE[Math.min(Math.max(tier - 1, 0), 3)]

        const cellLookup = new Map(
          cells.map((c) => [`${c.scenarioName}__${c.outcomeName}`, c]),
        )

        const getOpacity = (scenarioId: string) => {
          if (highlightedIds && highlightedIds.size > 0) {
            return highlightedIds.has(scenarioId) ? 1.0 : 0.2
          }
          if (chosenIds && chosenIds.size > 0) {
            return chosenIds.has(scenarioId) ? 1.0 : 0.3
          }
          return 1.0
        }

        scenarioNames.forEach((sName, si) => {
          const scenarioId = scenarioIds[si] ?? ""
          const opacity = getOpacity(scenarioId)

          outcomeNames.forEach((oName) => {
            const cell = cellLookup.get(`${sName}__${oName}`)
            if (!cell) return

            const x = xScale(oName) ?? 0
            const y = yScale(sName) ?? 0

            g.append("rect")
              .attr("class", "hm-cell")
              .attr("data-scenario-id", scenarioId)
              .attr("data-outcome", oName)
              .attr("x", x)
              .attr("y", y)
              .attr("width", xScale.bandwidth())
              .attr("height", yScale.bandwidth())
              .attr("fill", colorScale(cell.tierLevel) ?? "#deebf7")
              .attr("fill-opacity", opacity)
              .attr("rx", 2)
              .attr("cursor", "pointer")
              .on("mouseenter", function (event: MouseEvent) {
                select(this).attr("stroke", "#333").attr("stroke-width", 2)
                const rect = containerRef.current?.getBoundingClientRect()
                if (rect) {
                  setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top - 70,
                    scenarioName: cell.scenarioName,
                    outcomeName: cell.outcomeName,
                  })
                }
                onCellHoverRef.current?.(cell)
              })
              .on("mouseleave", function () {
                select(this).attr("stroke", "none")
                setTooltip(null)
                onCellHoverRef.current?.(null)
              })
              .on("click", () => onCellClickRef.current?.(cell))

            // Tier number inside cell when large enough
            if (xScale.bandwidth() > 24 && yScale.bandwidth() > 18) {
              g.append("text")
                .attr("class", "hm-label")
                .attr("data-scenario-id", scenarioId)
                .attr("data-outcome", oName)
                .attr("x", x + xScale.bandwidth() / 2)
                .attr("y", y + yScale.bandwidth() / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("font-size", Math.min(xScale.bandwidth() * 0.35, 13))
                .attr("fill", cell.tierLevel <= 2 ? "#fff" : "#333")
                .attr("fill-opacity", opacity)
                .attr("pointer-events", "none")
                .text(cell.tierLevel)
            }
          })
        })

        // Y-axis: scenario names with optional color indicator
        const yAxis = g.append("g").attr("class", "y-axis")

        scenarioNames.forEach((sName, si) => {
          const y = (yScale(sName) ?? 0) + yScale.bandwidth() / 2

          if (lineColors?.[si]) {
            yAxis
              .append("circle")
              .attr("cx", -12)
              .attr("cy", y)
              .attr("r", 4)
              .attr("fill", lineColors[si])
          }

          yAxis
            .append("text")
            .attr("x", -20)
            .attr("y", y)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "central")
            .attr("font-size", 11)
            .attr("fill", "#555")
            .text(sName.length > 20 ? sName.slice(0, 18) + "..." : sName)
        })

        // X-axis: outcome names (rotated)
        const xAxis = g.append("g").attr("transform", `translate(0,${innerH})`)

        outcomeNames.forEach((oName) => {
          const x = (xScale(oName) ?? 0) + xScale.bandwidth() / 2
          xAxis
            .append("text")
            .attr("x", x)
            .attr("y", 12)
            .attr("text-anchor", "end")
            .attr("transform", `rotate(-45, ${x}, 12)`)
            .attr("font-size", 11)
            .attr("fill", "#555")
            .text(oName)
        })

        // Legend
        const legendG = g
          .append("g")
          .attr("transform", `translate(${innerW - 200}, ${innerH + 60})`)

        TIER_COLOR_SCALE.forEach((color, i) => {
          legendG
            .append("rect")
            .attr("x", i * 48)
            .attr("y", 0)
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", color)
            .attr("rx", 2)
          legendG
            .append("text")
            .attr("x", i * 48 + 18)
            .attr("y", 11)
            .attr("font-size", 10)
            .attr("fill", "#666")
            .text(TIER_LABELS[i] ?? "")
        })
      },
      [
        cells,
        scenarioIds,
        scenarioNames,
        outcomeNames,
        lineColors,
        highlightedIds,
        chosenIds,
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
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              background: "rgba(255,255,255,0.96)",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 11,
              lineHeight: 1.5,
              pointerEvents: "none",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              whiteSpace: "nowrap",
              transform: "translateX(-50%)",
            }}
          >
            <div style={{ fontWeight: 600, color: "#333" }}>
              {tooltip.scenarioName}
            </div>
            <div style={{ color: "#666" }}>{tooltip.outcomeName}</div>
          </div>
        )}
      </div>
    )
  },
)

TierHeatmap.displayName = "TierHeatmap"

export default TierHeatmap
