"use client"

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface SankeyScenarioFlow {
  scenarioId: string
  scenarioName: string
  color: string
  flows: { tier: "tier1" | "tier2" | "tier3" | "tier4"; value: number }[]
}

export interface TierSankeyProps {
  data: SankeyScenarioFlow[]
  outcomeName: string
  tierColors?: Record<string, string>
  responsive?: boolean
  width?: number
  height?: number
  onScenarioHover?: (scenarioId: string | null) => void
  onScenarioClick?: (scenarioId: string) => void
  highlightedIds?: Set<string> | null
  chosenIds?: Set<string>
}

const MARGIN = { top: 20, right: 120, bottom: 20, left: 140 }
const NODE_WIDTH = 18
const NODE_PAD = 4
const TIER_PAD = 24
const DEFAULT_TIER_COLORS: Record<string, string> = {
  tier1: "#1ca367",
  tier2: "#31b2c5",
  tier3: "#f2944f",
  tier4: "#ee5d32",
}
const TIER_LABELS: Record<string, string> = {
  tier1: "Tier 1",
  tier2: "Tier 2",
  tier3: "Tier 3",
  tier4: "Tier 4",
}
const TIER_ORDER = ["tier1", "tier2", "tier3", "tier4"] as const

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  tier: string
  value: number
  total: number
}

const TierSankey: React.FC<TierSankeyProps> = ({
  data,
  outcomeName,
  tierColors: tierColorsProp,
  responsive = true,
  width = 700,
  height = 500,
  onScenarioHover,
  onScenarioClick,
  highlightedIds,
  chosenIds,
}) => {
  const tierColors = useMemo(
    () => ({ ...DEFAULT_TIER_COLORS, ...tierColorsProp }),
    [tierColorsProp],
  )
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
      if (data.length === 0 || w <= 0 || h <= 0) return

      const innerW = w - MARGIN.left - MARGIN.right
      const innerH = h - MARGIN.top - MARGIN.bottom
      if (innerW <= 0 || innerH <= 0) return

      const g = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

      // Left nodes: scenarios. Right nodes: tiers.
      // Compute totals for vertical sizing.
      const scenarioTotals = data.map((s) =>
        s.flows.reduce((sum, f) => sum + f.value, 0),
      )
      const grandTotal = scenarioTotals.reduce((a, b) => a + b, 0)
      if (grandTotal === 0) return

      const tierTotals: Record<string, number> = {}
      TIER_ORDER.forEach((t) => (tierTotals[t] = 0))
      data.forEach((s) => {
        s.flows.forEach((f) => {
          tierTotals[f.tier] = (tierTotals[f.tier] || 0) + f.value
        })
      })

      const leftX = 0
      const rightX = innerW - NODE_WIDTH

      // Vertical layout: proportional heights
      const availableH = innerH - NODE_PAD * (data.length - 1)
      const pxPerUnit = availableH / grandTotal

      // Left node positions
      interface NodePos {
        y0: number
        y1: number
        height: number
      }
      const leftNodes: NodePos[] = []
      let cumY = 0
      data.forEach((s, i) => {
        const nodeH = (scenarioTotals[i] ?? 0) * pxPerUnit
        leftNodes.push({ y0: cumY, y1: cumY + nodeH, height: nodeH })
        cumY += nodeH + NODE_PAD
      })

      // Right node positions (with larger gaps between tiers)
      const activeTierCount = TIER_ORDER.filter((t) => (tierTotals[t] ?? 0) > 0).length
      const tierAvailH = innerH - TIER_PAD * Math.max(activeTierCount - 1, 0)
      const tierPxPerUnit = tierAvailH / grandTotal
      const rightNodes: Record<string, NodePos> = {}
      let cumTierY = 0
      TIER_ORDER.forEach((t) => {
        const total = tierTotals[t] ?? 0
        if (total === 0) return
        const nodeH = total * tierPxPerUnit
        rightNodes[t] = { y0: cumTierY, y1: cumTierY + nodeH, height: nodeH }
        cumTierY += nodeH + TIER_PAD
      })

      const getOpacity = (scenarioId: string) => {
        if (highlightedIds && highlightedIds.size > 0) {
          return highlightedIds.has(scenarioId) ? 0.6 : 0.08
        }
        if (chosenIds && chosenIds.size > 0) {
          return chosenIds.has(scenarioId) ? 0.5 : 0.1
        }
        return 0.4
      }

      // Track how much of each right node has been filled
      const tierFillY: Record<string, number> = {}
      TIER_ORDER.forEach((t) => {
        if (rightNodes[t]) tierFillY[t] = rightNodes[t].y0
      })

      // Track how much of each left node has been used
      const scenarioFillY = leftNodes.map((n) => n.y0)

      // Create defs for gradient fills
      const defs = svg.append("defs")

      // Draw flows with gradients from scenario color -> tier color
      let flowIdx = 0
      data.forEach((scenario, si) => {
        const opacity = getOpacity(scenario.scenarioId)

        TIER_ORDER.forEach((tier) => {
          const flow = scenario.flows.find((f) => f.tier === tier)
          if (!flow || flow.value === 0 || !rightNodes[tier]) return

          const gradId = `sankey-grad-${flowIdx++}`
          const grad = defs
            .append("linearGradient")
            .attr("id", gradId)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", MARGIN.left + leftX + NODE_WIDTH)
            .attr("x2", MARGIN.left + rightX)
            .attr("y1", 0)
            .attr("y2", 0)
          grad
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", scenario.color)
          grad
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", tierColors[tier] ?? "#999")

          const flowH = flow.value * pxPerUnit
          const srcY0 = scenarioFillY[si] ?? 0
          const srcY1 = srcY0 + flowH
          scenarioFillY[si] = srcY1

          const flowHTier = flow.value * tierPxPerUnit
          const tgtY0 = tierFillY[tier] ?? 0
          const tgtY1 = tgtY0 + flowHTier
          tierFillY[tier] = tgtY1

          const path = d3.path()
          const midX = (leftX + NODE_WIDTH + rightX) / 2
          path.moveTo(leftX + NODE_WIDTH, srcY0)
          path.bezierCurveTo(midX, srcY0, midX, tgtY0, rightX, tgtY0)
          path.lineTo(rightX, tgtY1)
          path.bezierCurveTo(midX, tgtY1, midX, srcY1, leftX + NODE_WIDTH, srcY1)
          path.closePath()

          g.append("path")
            .attr("d", path.toString())
            .attr("fill", `url(#${gradId})`)
            .attr("fill-opacity", opacity)
            .attr("stroke", "none")
            .attr("cursor", "pointer")
            .on("mouseenter", function (event: MouseEvent) {
              d3.select(this).attr("fill-opacity", Math.min(opacity + 0.3, 0.85))
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                setTooltip({
                  x: event.clientX - rect.left + 14,
                  y: event.clientY - rect.top - 14,
                  scenarioName: scenario.scenarioName,
                  tier: TIER_LABELS[tier] ?? tier,
                  value: flow.value,
                  total: scenarioTotals[si] ?? 0,
                })
              }
              onScenarioHoverRef.current?.(scenario.scenarioId)
            })
            .on("mouseleave", function () {
              d3.select(this).attr("fill-opacity", opacity)
              setTooltip(null)
              onScenarioHoverRef.current?.(null)
            })
            .on("click", () =>
              onScenarioClickRef.current?.(scenario.scenarioId),
            )
        })
      })

      // Draw left nodes (scenario bars)
      data.forEach((scenario, si) => {
        const node = leftNodes[si]
        if (!node) return
        g.append("rect")
          .attr("x", leftX)
          .attr("y", node.y0)
          .attr("width", NODE_WIDTH)
          .attr("height", Math.max(node.height, 1))
          .attr("fill", scenario.color)
          .attr("rx", 2)

        g.append("text")
          .attr("x", leftX - 6)
          .attr("y", node.y0 + node.height / 2)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "central")
          .attr("font-size", 11)
          .attr("fill", "#555")
          .text(
            scenario.scenarioName.length > 18
              ? scenario.scenarioName.slice(0, 16) + "..."
              : scenario.scenarioName,
          )
      })

      // Draw right nodes (tier bars)
      TIER_ORDER.forEach((tier) => {
        const node = rightNodes[tier]
        if (!node) return

        g.append("rect")
          .attr("x", rightX)
          .attr("y", node.y0)
          .attr("width", NODE_WIDTH)
          .attr("height", Math.max(node.height, 1))
          .attr("fill", tierColors[tier] ?? "#999")
          .attr("rx", 2)

        g.append("text")
          .attr("x", rightX + NODE_WIDTH + 8)
          .attr("y", node.y0 + node.height / 2)
          .attr("dominant-baseline", "central")
          .attr("font-size", 11)
          .attr("fill", "#555")
          .text(TIER_LABELS[tier] ?? tier)
      })

      // Title
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#888")
        .text(outcomeName)
    },
    [data, outcomeName, highlightedIds, chosenIds, tierColors],
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
          <div style={{ color: "#666" }}>
            {tooltip.tier}: {tooltip.value} of {tooltip.total} units
          </div>
          <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
            {tooltip.total > 0
              ? ((tooltip.value / tooltip.total) * 100).toFixed(0)
              : 0}
            %
          </div>
        </div>
      )}
    </div>
  )
}

export default TierSankey
