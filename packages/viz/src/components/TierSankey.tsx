"use client"

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface SankeyScenarioFlow {
  scenarioId: string
  scenarioName: string
  color: string
  flows: { tier: string; value: number }[]
}

export interface SankeyGroup {
  key: string
  label: string
}

export interface TierSankeyProps {
  data: SankeyScenarioFlow[]
  outcomeName: string
  tierColors?: Record<string, string>
  groups?: SankeyGroup[]
  responsive?: boolean
  width?: number
  height?: number
  onScenarioHover?: (scenarioId: string | null) => void
  onScenarioClick?: (scenarioId: string) => void
  highlightedIds?: Set<string> | null
  chosenIds?: Set<string>
}

const NODE_WIDTH = 18
const NODE_PAD = 4
const TIER_PAD = 24
const GROUP_PAD = 16
const DEFAULT_TIER_COLORS: Record<string, string> = {
  tier1: "#1ca367",
  tier2: "#31b2c5",
  tier3: "#f2944f",
  tier4: "#ee5d32",
}
const TIER_LABELS: Record<string, string> = {
  tier1: "T1",
  tier2: "T2",
  tier3: "T3",
  tier4: "T4",
}
const TIER_LABELS_FULL: Record<string, string> = {
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
  group?: string
  value: number
  total: number
}

interface NodePos {
  y0: number
  y1: number
  height: number
}

const TierSankey: React.FC<TierSankeyProps> = ({
  data,
  outcomeName,
  tierColors: tierColorsProp,
  groups,
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

  const isGrouped = groups && groups.length > 0
  const rightMargin = isGrouped ? 160 : 120
  const MARGIN = { top: 20, right: rightMargin, bottom: 20, left: 140 }

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

      const scenarioTotals = data.map((s) =>
        s.flows.reduce((sum, f) => sum + f.value, 0),
      )
      const grandTotal = scenarioTotals.reduce((a, b) => a + b, 0)
      if (grandTotal === 0) return

      const leftX = 0
      const rightX = innerW - NODE_WIDTH

      // Left nodes: proportional height per scenario
      const availableH = innerH - NODE_PAD * (data.length - 1)
      const pxPerUnit = availableH / grandTotal

      const leftNodes: NodePos[] = []
      let cumY = 0
      data.forEach((_s, i) => {
        const nodeH = (scenarioTotals[i] ?? 0) * pxPerUnit
        leftNodes.push({ y0: cumY, y1: cumY + nodeH, height: nodeH })
        cumY += nodeH + NODE_PAD
      })

      // Collect all right-side node keys and their totals
      const allRightKeys: string[] = []
      const rightTotals: Record<string, number> = {}

      if (isGrouped) {
        for (const group of groups) {
          for (const tier of TIER_ORDER) {
            const key = `${group.key}:${tier}`
            allRightKeys.push(key)
            rightTotals[key] = 0
          }
        }
      } else {
        for (const tier of TIER_ORDER) {
          allRightKeys.push(tier)
          rightTotals[tier] = 0
        }
      }

      data.forEach((s) => {
        s.flows.forEach((f) => {
          rightTotals[f.tier] = (rightTotals[f.tier] ?? 0) + f.value
        })
      })

      // Filter to active keys (non-zero totals)
      const activeKeys = allRightKeys.filter((k) => (rightTotals[k] ?? 0) > 0)

      // Right node layout: grouped mode has group-level spacing
      const rightNodes: Record<string, NodePos> = {}
      let tierPxPerUnit: number

      if (isGrouped) {
        const activeGroups = groups.filter((grp) =>
          TIER_ORDER.some((t) => (rightTotals[`${grp.key}:${t}`] ?? 0) > 0),
        )
        const activeWithinGroupCount = activeKeys.length
        const groupGapCount = Math.max(activeGroups.length - 1, 0)
        const withinGroupGapCount = Math.max(
          activeWithinGroupCount - activeGroups.length,
          0,
        )
        const tierAvailH =
          innerH - GROUP_PAD * groupGapCount - TIER_PAD * withinGroupGapCount
        tierPxPerUnit = tierAvailH / grandTotal

        let cumRightY = 0
        for (let gi = 0; gi < groups.length; gi++) {
          const grp = groups[gi]!
          let groupHasActive = false
          for (const tier of TIER_ORDER) {
            const key = `${grp.key}:${tier}`
            const total = rightTotals[key] ?? 0
            if (total === 0) continue
            if (groupHasActive) {
              cumRightY += TIER_PAD
            }
            groupHasActive = true
            const nodeH = total * tierPxPerUnit
            rightNodes[key] = {
              y0: cumRightY,
              y1: cumRightY + nodeH,
              height: nodeH,
            }
            cumRightY += nodeH
          }
          if (groupHasActive && gi < groups.length - 1) {
            cumRightY += GROUP_PAD
          }
        }
      } else {
        const activeTierCount = activeKeys.length
        const tierAvailH = innerH - TIER_PAD * Math.max(activeTierCount - 1, 0)
        tierPxPerUnit = tierAvailH / grandTotal

        let cumRightY = 0
        for (const key of TIER_ORDER) {
          const total = rightTotals[key] ?? 0
          if (total === 0) continue
          const nodeH = total * tierPxPerUnit
          rightNodes[key] = {
            y0: cumRightY,
            y1: cumRightY + nodeH,
            height: nodeH,
          }
          cumRightY += nodeH + TIER_PAD
        }
      }

      const getOpacity = (scenarioId: string) => {
        if (highlightedIds && highlightedIds.size > 0) {
          return highlightedIds.has(scenarioId) ? 0.6 : 0.08
        }
        if (chosenIds && chosenIds.size > 0) {
          return chosenIds.has(scenarioId) ? 0.5 : 0.1
        }
        return 0.4
      }

      // Track fill positions for each right node and each left node
      const tierFillY: Record<string, number> = {}
      for (const key of Object.keys(rightNodes)) {
        tierFillY[key] = rightNodes[key]!.y0
      }
      const scenarioFillY = leftNodes.map((n) => n.y0)

      // Draw flows — iterate data flows in declared order
      data.forEach((scenario, si) => {
        const opacity = getOpacity(scenario.scenarioId)

        const sortedFlows = [...scenario.flows].sort((a, b) => {
          const ya = rightNodes[a.tier]?.y0 ?? 0
          const yb = rightNodes[b.tier]?.y0 ?? 0
          return ya - yb
        })

        for (const flow of sortedFlows) {
          if (flow.value === 0 || !rightNodes[flow.tier]) continue

          const tierKey = flow.tier
          const baseTier = tierKey.includes(":")
            ? tierKey.split(":")[1]!
            : tierKey

          const flowH = flow.value * pxPerUnit
          const srcY0 = scenarioFillY[si] ?? 0
          const srcY1 = srcY0 + flowH
          scenarioFillY[si] = srcY1

          const flowHTier = flow.value * tierPxPerUnit
          const tgtY0 = tierFillY[tierKey] ?? 0
          const tgtY1 = tgtY0 + flowHTier
          tierFillY[tierKey] = tgtY1

          const path = d3.path()
          const midX = (leftX + NODE_WIDTH + rightX) / 2
          path.moveTo(leftX + NODE_WIDTH, srcY0)
          path.bezierCurveTo(midX, srcY0, midX, tgtY0, rightX, tgtY0)
          path.lineTo(rightX, tgtY1)
          path.bezierCurveTo(
            midX,
            tgtY1,
            midX,
            srcY1,
            leftX + NODE_WIDTH,
            srcY1,
          )
          path.closePath()

          const groupLabel = isGrouped
            ? groups.find((grp) => tierKey.startsWith(grp.key + ":"))?.label
            : undefined
          const tierLabel = isGrouped
            ? (TIER_LABELS[baseTier] ?? baseTier)
            : (TIER_LABELS_FULL[baseTier] ?? baseTier)
          const tooltipTier = groupLabel
            ? `${groupLabel} ${tierLabel}`
            : tierLabel

          g.append("path")
            .attr("d", path.toString())
            .attr("fill", scenario.color)
            .attr("fill-opacity", opacity)
            .attr("stroke", "none")
            .attr("cursor", "pointer")
            .on("mouseenter", function (event: MouseEvent) {
              d3.select(this).attr(
                "fill-opacity",
                Math.min(opacity + 0.3, 0.85),
              )
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                setTooltip({
                  x: event.clientX - rect.left + 14,
                  y: event.clientY - rect.top - 14,
                  scenarioName: scenario.scenarioName,
                  tier: tooltipTier,
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
        }
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

      // Draw right nodes
      if (isGrouped) {
        for (const grp of groups) {
          let groupMinY = Infinity
          let groupMaxY = -Infinity
          for (const tier of TIER_ORDER) {
            const key = `${grp.key}:${tier}`
            const node = rightNodes[key]
            if (!node) continue
            groupMinY = Math.min(groupMinY, node.y0)
            groupMaxY = Math.max(groupMaxY, node.y1)
            const baseTier = tier
            g.append("rect")
              .attr("x", rightX)
              .attr("y", node.y0)
              .attr("width", NODE_WIDTH)
              .attr("height", Math.max(node.height, 1))
              .attr("fill", tierColors[baseTier] ?? "#999")
              .attr("rx", 2)

            g.append("text")
              .attr("x", rightX + NODE_WIDTH + 6)
              .attr("y", node.y0 + node.height / 2)
              .attr("dominant-baseline", "central")
              .attr("font-size", 9)
              .attr("fill", "#888")
              .text(TIER_LABELS[baseTier] ?? baseTier)
          }
          if (groupMinY < Infinity) {
            g.append("text")
              .attr("x", rightX + NODE_WIDTH + 28)
              .attr("y", (groupMinY + groupMaxY) / 2)
              .attr("dominant-baseline", "central")
              .attr("font-size", 10)
              .attr("font-weight", 600)
              .attr("fill", "#555")
              .text(
                grp.label.length > 14
                  ? grp.label.slice(0, 12) + "..."
                  : grp.label,
              )
          }
        }
      } else {
        for (const tier of TIER_ORDER) {
          const node = rightNodes[tier]
          if (!node) continue
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
            .text(TIER_LABELS_FULL[tier] ?? tier)
        }
      }

      // Title
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#888")
        .text(outcomeName)
    },
    [
      data,
      outcomeName,
      highlightedIds,
      chosenIds,
      tierColors,
      groups,
      MARGIN.left,
      MARGIN.right,
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
          }}
        >
          <div style={{ fontWeight: 600, color: "#333" }}>
            {tooltip.scenarioName}
          </div>
          <div style={{ color: "#666" }}>
            {tooltip.tier}: {tooltip.value} of {tooltip.total}
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

export type { SankeyGroup as TierSankeyGroup }
export default TierSankey
