"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface BumpRanking {
  outcomeCode: string
  outcomeName: string
  rankings: { scenarioId: string; rank: number }[]
}

export interface BumpScenario {
  id: string
  name: string
  color: string
}

export interface BumpChartProps {
  rankings: BumpRanking[]
  scenarios: BumpScenario[]
  responsive?: boolean
  width?: number
  height?: number
  onScenarioHover?: (scenarioId: string | null) => void
  onScenarioClick?: (scenarioId: string) => void
  highlightedIds?: Set<string> | null
  chosenIds?: Set<string>
}

const MARGIN = { top: 30, right: 120, bottom: 80, left: 50 }

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  outcomeName: string
  rank: number
}

const BumpChart: React.FC<BumpChartProps> = ({
  rankings,
  scenarios,
  responsive = true,
  width = 700,
  height = 500,
  onScenarioHover,
  onScenarioClick,
  highlightedIds,
  chosenIds,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const onScenarioHoverRef = useRef(onScenarioHover)
  useEffect(() => {
    onScenarioHoverRef.current = onScenarioHover
  }, [onScenarioHover])
  const onScenarioClickRef = useRef(onScenarioClick)
  useEffect(() => {
    onScenarioClickRef.current = onScenarioClick
  }, [onScenarioClick])

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
      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()
      if (rankings.length === 0 || scenarios.length === 0 || w <= 0 || h <= 0)
        return

      const innerW = w - MARGIN.left - MARGIN.right
      const innerH = h - MARGIN.top - MARGIN.bottom
      if (innerW <= 0 || innerH <= 0) return

      const g = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

      const outcomeNames = rankings.map((r) => r.outcomeName)
      const maxRank = scenarios.length

      const xScale = d3
        .scalePoint<string>()
        .domain(outcomeNames)
        .range([0, innerW])
        .padding(0.3)

      const yScale = d3
        .scaleLinear()
        .domain([1, maxRank])
        .range([0, innerH])

      // Gridlines
      for (let rank = 1; rank <= maxRank; rank++) {
        g.append("line")
          .attr("x1", 0)
          .attr("y1", yScale(rank))
          .attr("x2", innerW)
          .attr("y2", yScale(rank))
          .attr("stroke", "#eee")
          .attr("stroke-width", 1)
      }

      // Build per-scenario path data: { scenarioId -> [{ outcomeName, rank }] }
      const scenarioColorMap = new Map(scenarios.map((s) => [s.id, s.color]))
      const scenarioNameMap = new Map(scenarios.map((s) => [s.id, s.name]))

      const scenarioPaths = new Map<
        string,
        { outcomeName: string; rank: number }[]
      >()
      scenarios.forEach((s) => scenarioPaths.set(s.id, []))

      rankings.forEach((r) => {
        r.rankings.forEach(({ scenarioId, rank }) => {
          scenarioPaths.get(scenarioId)?.push({
            outcomeName: r.outcomeName,
            rank,
          })
        })
      })

      const getOpacity = (scenarioId: string) => {
        if (highlightedIds && highlightedIds.size > 0) {
          return highlightedIds.has(scenarioId) ? 1.0 : 0.1
        }
        if (chosenIds && chosenIds.size > 0) {
          return chosenIds.has(scenarioId) ? 0.85 : 0.15
        }
        return 0.7
      }

      const lineGen = d3
        .line<{ outcomeName: string; rank: number }>()
        .x((d) => xScale(d.outcomeName) ?? 0)
        .y((d) => yScale(d.rank))
        .curve(d3.curveMonotoneX)

      // Draw lines
      scenarios.forEach((scenario) => {
        const points = scenarioPaths.get(scenario.id) || []
        if (points.length < 2) return

        const opacity = getOpacity(scenario.id)

        g.append("path")
          .datum(points)
          .attr("d", lineGen)
          .attr("fill", "none")
          .attr("stroke", scenario.color)
          .attr("stroke-width", 2.5)
          .attr("stroke-opacity", opacity)
          .attr("cursor", "pointer")
          .on("mouseenter", function () {
            d3.select(this)
              .attr("stroke-width", 4)
              .attr("stroke-opacity", 1)
              .raise()
            onScenarioHoverRef.current?.(scenario.id)
          })
          .on("mouseleave", function () {
            d3.select(this)
              .attr("stroke-width", 2.5)
              .attr("stroke-opacity", opacity)
            onScenarioHoverRef.current?.(null)
          })
          .on("click", () => onScenarioClickRef.current?.(scenario.id))
      })

      // Draw dots
      const dotRadius = scenarios.length > 12 ? 4 : 5
      scenarios.forEach((scenario) => {
        const points = scenarioPaths.get(scenario.id) || []
        const opacity = getOpacity(scenario.id)

        points.forEach((pt) => {
          const cx = xScale(pt.outcomeName) ?? 0
          const cy = yScale(pt.rank)

          g.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", dotRadius)
            .attr("fill", scenario.color)
            .attr("fill-opacity", opacity)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("cursor", "pointer")
            .on("mouseenter", function (event: MouseEvent) {
              d3.select(this)
                .attr("r", dotRadius + 2)
                .attr("fill-opacity", 1)
                .raise()
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                setTooltip({
                  x: event.clientX - rect.left + 14,
                  y: event.clientY - rect.top - 14,
                  scenarioName: scenarioNameMap.get(scenario.id) || scenario.id,
                  outcomeName: pt.outcomeName,
                  rank: pt.rank,
                })
              }
              onScenarioHoverRef.current?.(scenario.id)
            })
            .on("mouseleave", function () {
              d3.select(this)
                .attr("r", dotRadius)
                .attr("fill-opacity", opacity)
              setTooltip(null)
              onScenarioHoverRef.current?.(null)
            })
            .on("click", () => onScenarioClickRef.current?.(scenario.id))
        })
      })

      // X-axis
      const xAxisG = g
        .append("g")
        .attr("transform", `translate(0,${innerH + 10})`)

      outcomeNames.forEach((name) => {
        const x = xScale(name) ?? 0
        xAxisG
          .append("text")
          .attr("x", x)
          .attr("y", 8)
          .attr("text-anchor", "end")
          .attr("transform", `rotate(-40, ${x}, 8)`)
          .attr("font-size", 11)
          .attr("fill", "#555")
          .text(name)
      })

      // Y-axis: rank labels
      for (let rank = 1; rank <= maxRank; rank++) {
        g.append("text")
          .attr("x", -10)
          .attr("y", yScale(rank))
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "central")
          .attr("font-size", 10)
          .attr("fill", "#999")
          .text(`#${rank}`)
      }

      // Right-side legend: scenario names at their final rank
      const lastOutcome = rankings[rankings.length - 1]
      if (lastOutcome) {
        const sortedByFinalRank = [...lastOutcome.rankings].sort(
          (a, b) => a.rank - b.rank,
        )
        sortedByFinalRank.forEach(({ scenarioId, rank }) => {
          const name = scenarioNameMap.get(scenarioId) || scenarioId
          const color = scenarioColorMap.get(scenarioId) || "#666"
          const y = yScale(rank)

          g.append("circle")
            .attr("cx", innerW + 10)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", color)

          g.append("text")
            .attr("x", innerW + 18)
            .attr("y", y)
            .attr("dominant-baseline", "central")
            .attr("font-size", 10)
            .attr("fill", "#555")
            .text(name.length > 16 ? name.slice(0, 14) + "..." : name)
        })
      }
    },
    [rankings, scenarios, highlightedIds, chosenIds],
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
          }}
        >
          <div style={{ fontWeight: 600, color: "#333" }}>
            {tooltip.scenarioName}
          </div>
          <div style={{ color: "#666" }}>{tooltip.outcomeName}</div>
          <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
            Rank #{tooltip.rank}
          </div>
        </div>
      )}
    </div>
  )
}

export default BumpChart
