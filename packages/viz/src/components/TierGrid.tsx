import React, { useRef, useEffect, useCallback, useMemo, useState } from "react"
import { select, group, scaleOrdinal, easeCubicOut } from "d3"
import type { Selection, ScaleOrdinal } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

// ============================================================================
// Types
// ============================================================================

export interface CategoryLayout {
  category: string
  width: number
  startX: number
}

export interface Objective {
  id: number
  tier: string
  baselineTier: string
  category: string
  locationId: string
  locationName: string
  tierLevel: number
  tierContinuous?: number
  baselineTierContinuous?: number
  // Added for share functionality
  baselineTierLevel?: number
  tierCode: string // tier/outcome code for coordinate lookup
}

export interface Position {
  id: number | string
  x: number
  y: number
  width: number
  height: number
  obj: Objective
  shape: string
}

export interface TierGridProps {
  objectives: Objective[]
  categories: string[]
  tiers: string[]
  responsive?: boolean
  width?: number
  height?: number
  colorMode?: "default" | "tier" | "category"
  showComparison?: boolean
  yAxisMode?: "discrete" | "continuous"
  selectedObjectives?: Objective[]
  onObjectiveClick?: (objective: Objective) => void
  onCategoryClick?: (category: string) => void
  onTierCategoryClick?: (
    category: string,
    tier: string,
    event: MouseEvent,
  ) => void
  onShowOnMap?: (locationIds: string[]) => void
  tierColorMap?: Record<string, string>
  showMapView?: boolean
  /** When false, the dots layer skips event listeners; pair with omitted callbacks so the chart is purely visual. Used by capture mode. */
  interactive?: boolean
  /** When false, enter/update/exit transitions run with duration 0 so a single frame paints the final state. Used by capture mode. */
  animate?: boolean
  /** Invoked once after the first paint has committed. Capture hosts await this before serializing the SVG. */
  onReady?: () => void
  /** Scenario the grid currently represents (Distribution tool focus). */
  focusScenarioId?: string
  /** Chart → sidebar hover sync. Emitted when the pointer is over the grid or a dot. */
  onChartHover?: (
    info: {
      scenarioId: string
      outcome?: string
      tierValue?: number
    } | null,
  ) => void
}

// ============================================================================
// Constants
// ============================================================================

const MARGIN = { top: 50, right: 50, bottom: 100, left: 60 }
const MAX_DOT_SIZE = 24
const MIN_DOT_SIZE = 6
const CELL_PADDING = 0
const MIN_CATEGORY_WIDTH = 80

const DEFAULT_TIER_COLORS = {
  "Tier 1": "#1ca367",
  "Tier 2": "#31b2c5",
  "Tier 3": "#f2944f",
  "Tier 4": "#ee5d32",
}

const CATEGORY_COLORS = [
  "#4e79a7", // Blue
  "#f28e2b", // Orange
  "#e15759", // Red
  "#76b7b2", // Cyan
  "#59a14f", // Green
  "#edc948", // Yellow
  "#b07aa1", // Purple
  "#ff9da7", // Pink
  "#9c755f", // Brown
  "#bab0ac", // Gray
]

// ============================================================================
// Calculation Functions
// ============================================================================

export const calculateCategoryWidths = (
  objectives: Objective[],
  categories: string[],
  gridWidth: number,
): CategoryLayout[] => {
  const categoryObjectiveCounts = new Map<string, number>()
  categories.forEach((category) => {
    const count = objectives.filter((obj) => obj.category === category).length
    categoryObjectiveCounts.set(category, count)
  })

  const totalObjectives = Array.from(categoryObjectiveCounts.values()).reduce(
    (sum, count) => sum + count,
    0,
  )

  const proportionalWidths = new Map<string, number>()
  categories.forEach((category) => {
    const count = categoryObjectiveCounts.get(category) || 0
    const proportion =
      totalObjectives > 0 ? count / totalObjectives : 1 / categories.length
    const categoryWidth = gridWidth * proportion
    proportionalWidths.set(category, categoryWidth)
  })

  const categoriesNeedingMin: string[] = []
  const categoriesAboveMin: string[] = []
  let totalMinWidth = 0

  categories.forEach((category) => {
    const width = proportionalWidths.get(category) || 0
    if (width < MIN_CATEGORY_WIDTH) {
      categoriesNeedingMin.push(category)
      totalMinWidth += MIN_CATEGORY_WIDTH
    } else {
      categoriesAboveMin.push(category)
    }
  })

  const finalWidths = new Map<string, number>()
  const remainingWidth = gridWidth - totalMinWidth

  categoriesNeedingMin.forEach((category) => {
    finalWidths.set(category, MIN_CATEGORY_WIDTH)
  })

  if (categoriesAboveMin.length > 0) {
    if (remainingWidth > 0) {
      const totalAboveMinObjectives = categoriesAboveMin.reduce((sum, cat) => {
        return sum + (categoryObjectiveCounts.get(cat) || 0)
      }, 0)

      categoriesAboveMin.forEach((category) => {
        const count = categoryObjectiveCounts.get(category) || 0
        const proportion = count / totalAboveMinObjectives
        const categoryWidth = remainingWidth * proportion
        finalWidths.set(category, categoryWidth)
      })
    } else {
      const scaleFactor =
        gridWidth /
        (totalMinWidth + categoriesAboveMin.length * MIN_CATEGORY_WIDTH)

      categoriesNeedingMin.forEach((category) => {
        finalWidths.set(category, MIN_CATEGORY_WIDTH * scaleFactor)
      })

      categoriesAboveMin.forEach((category) => {
        finalWidths.set(category, MIN_CATEGORY_WIDTH * scaleFactor)
      })
    }
  }

  const layouts: CategoryLayout[] = []
  let currentX = 0

  categories.forEach((category) => {
    const width = finalWidths.get(category) || MIN_CATEGORY_WIDTH
    layouts.push({
      category,
      width,
      startX: currentX,
    })
    currentX += width
  })

  return layouts
}

const calculateTierPositions = (
  objectives: Objective[],
  categories: string[],
  tiers: string[],
  width: number,
  height: number,
  showComparison: boolean = false,
  yAxisMode: "discrete" | "continuous" = "discrete",
): {
  positions: Position[]
  cellLayouts: Map<
    string,
    {
      contentHeight: number
      x: number
      y: number
      width: number
      height: number
    }
  >
  globalDotSize: number
} => {
  const gridWidth = width - MARGIN.left - MARGIN.right
  const gridHeight = height - MARGIN.top - MARGIN.bottom

  const categoryLayouts = calculateCategoryWidths(
    objectives,
    categories,
    gridWidth,
  )
  const categoryWidths = new Map(
    categoryLayouts.map((l) => [l.category, l.width]),
  )
  const categoryStartX = new Map(
    categoryLayouts.map((l) => [l.category, l.startX]),
  )

  // In continuous mode, we have 40 levels (1.0, 1.1, 1.2, ..., 4.9, 5.0)
  // In discrete mode, we have 4 levels (Tier 1, Tier 2, Tier 3, Tier 4)
  const numLevels = yAxisMode === "continuous" ? 40 : tiers.length
  const cellHeight = gridHeight / numLevels
  const positions: Position[] = []

  const computeMaxDotSizeForCell = (
    count: number,
    cellWidth: number,
    cellHeight: number,
  ) => {
    if (count <= 0) return MAX_DOT_SIZE

    for (let size = MAX_DOT_SIZE; size >= MIN_DOT_SIZE; size -= 0.5) {
      const spacing = size * 1.2
      const maxCols = Math.floor(
        (cellWidth - CELL_PADDING - size / 2) / spacing,
      )
      const cols = Math.max(1, maxCols)
      const rows = Math.ceil(count / cols)
      const requiredHeight = rows * spacing + size / 2
      const requiredWidth = cols * spacing + size / 2
      if (
        requiredHeight <= cellHeight - CELL_PADDING &&
        requiredWidth <= cellWidth - CELL_PADDING
      ) {
        return size
      }
    }
    return MIN_DOT_SIZE
  }

  // Group objectives by tier/level and category
  // In continuous mode, group by floored tierContinuous (to 0.1 increments)
  // In discrete mode, group by tier string
  const getGroupKey = (obj: Objective): string => {
    if (yAxisMode === "continuous" && obj.tierContinuous !== undefined) {
      // Floor to 0.1 increment: 2.0-2.09 → 2.0, 2.1-2.19 → 2.1, etc.
      const floored = Math.floor(obj.tierContinuous / 0.1) * 0.1
      return floored.toFixed(1)
    }
    return obj.tier
  }

  const grouped = group(
    objectives,
    (d) => getGroupKey(d),
    (d) => d.category,
  )

  // In continuous mode, generate level keys (1.0, 1.1, 1.2, ..., 5.0)
  // In discrete mode, use tier strings
  const levelKeys =
    yAxisMode === "continuous"
      ? Array.from({ length: 40 }, (_, i) => (1.0 + i * 0.1).toFixed(1))
      : tiers

  let globalDotSize = MAX_DOT_SIZE
  levelKeys.forEach((levelKey) => {
    categories.forEach((category) => {
      const count = grouped.get(levelKey)?.get(category)?.length || 0

      if (count === 0) return
      const cellWidth = categoryWidths.get(category) || 0
      const maxSizeForCell = computeMaxDotSizeForCell(
        count,
        cellWidth,
        cellHeight,
      )
      globalDotSize = Math.min(globalDotSize, maxSizeForCell)
    })
  })
  const globalSpacing = globalDotSize * 1.2

  const cellLayouts = new Map<
    string,
    {
      contentHeight: number
      x: number
      y: number
      width: number
      height: number
    }
  >()

  levelKeys.forEach((levelKey, levelIndex) => {
    categories.forEach((category) => {
      const cellObjectives = grouped.get(levelKey)?.get(category) || []
      if (cellObjectives.length === 0) {
        return
      }

      // Sort by comparison outcome: improved first, same second, worsened last
      const sortedCellObjectives = [...cellObjectives].sort((a, b) => {
        if (!showComparison) return 0

        const aTierNum = parseInt(a.tier.replace("Tier ", ""))
        const aBaselineTierNum = parseInt(a.baselineTier.replace("Tier ", ""))
        const bTierNum = parseInt(b.tier.replace("Tier ", ""))
        const bBaselineTierNum = parseInt(b.baselineTier.replace("Tier ", ""))

        const aStatus =
          aTierNum < aBaselineTierNum
            ? 0
            : aTierNum === aBaselineTierNum
              ? 1
              : 2
        const bStatus =
          bTierNum < bBaselineTierNum
            ? 0
            : bTierNum === bBaselineTierNum
              ? 1
              : 2

        return aStatus - bStatus
      })

      const cellWidth = categoryWidths.get(category) || 0
      const cellStartX = categoryStartX.get(category) || 0

      const spacing = globalSpacing
      const dotSize = globalDotSize
      const dotsPerRow = Math.max(
        1,
        Math.floor((cellWidth - CELL_PADDING - dotSize / 2) / spacing),
      )

      let maxRow = -1

      sortedCellObjectives.forEach((obj, idx) => {
        const row = Math.floor(idx / dotsPerRow)
        const col = idx % dotsPerRow

        const x_rel = col * spacing + dotSize
        const y_rel = row * spacing + dotSize

        const globalX = MARGIN.left + cellStartX + x_rel - dotSize / 2
        const globalY =
          MARGIN.top + levelIndex * cellHeight + y_rel - dotSize / 2

        // Determine shape based on comparison mode
        let shape = "rect"
        if (showComparison && obj.baselineTier !== obj.tier) {
          const currentTierNum = parseInt(obj.tier.replace("Tier ", ""))
          const baselineTierNum = parseInt(
            obj.baselineTier.replace("Tier ", ""),
          )
          if (currentTierNum < baselineTierNum) {
            shape = "triangle-up" // Improved (lower tier number is better)
          } else if (currentTierNum > baselineTierNum) {
            shape = "triangle-down" // Worsened (higher tier number is worse)
          }
        }

        positions.push({
          id: `${obj.tierCode}:${obj.locationId}`, // Location ID is not unique
          x: globalX,
          y: globalY,
          width: dotSize,
          height: dotSize,
          obj: obj,
          shape: shape,
        })

        maxRow = Math.max(maxRow, row)
      })

      const contentHeight =
        maxRow === -1 ? 0 : (maxRow + 1) * spacing + dotSize / 2

      cellLayouts.set(`${levelKey}-${category}`, {
        contentHeight,
        x: MARGIN.left + cellStartX,
        y: MARGIN.top + levelIndex * cellHeight,
        width: cellWidth,
        height: cellHeight,
      })
    })
  })

  return { positions, cellLayouts, globalDotSize }
}

// ============================================================================
// Utility Functions
// ============================================================================

const getFillColor = (
  obj: Objective,
  colorMode: string,
  tierColorMap: Record<string, string>,
  categoryColorScale: ScaleOrdinal<string, string, never>,
  _showComparison: boolean = false,
): string => {
  if (colorMode === "tier") {
    // In comparison mode, use comparison colors (blue/red based on change)
    // if (showComparison) {
    //   const currentTierNum = parseInt(obj.tier.replace("Tier ", ""))
    //   const baselineTierNum = parseInt(obj.baselineTier.replace("Tier ", ""))

    //   if (currentTierNum === baselineTierNum) {
    //     return "#90caf9" // Light blue - no change
    //   } else if (currentTierNum < baselineTierNum) {
    //     return "#2196f3" // Default blue - improved
    //   } else {
    //     return "#f44336" // Red - worsened
    //   }
    // }

    // In normal mode, use tier colors
    return tierColorMap[obj.tier] || "#999"
    // return "#999"
  } else if (colorMode === "category") {
    return categoryColorScale(obj.category)
  }
  // Default: use tier colors
  return tierColorMap[obj.tier] || "#999"
}

const drawTierGrid = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  categoryLayouts: CategoryLayout[],
  tiers: string[],
  onTierCategoryClick?: (
    category: string,
    tier: string,
    event: MouseEvent,
  ) => void,
  showMapView: boolean = false,
  yAxisMode: "discrete" | "continuous" = "discrete",
) => {
  const gridWidth = width - MARGIN.left - MARGIN.right
  const gridHeight = height - MARGIN.top - MARGIN.bottom

  svg.selectAll(".grid-layer").remove()
  const gridLayer = svg.append("g").attr("class", "grid-layer")

  const tierHeight = gridHeight / tiers.length

  // Draw clickable cell backgrounds
  if (onTierCategoryClick && showMapView) {
    tiers.forEach((tier, tierIndex) => {
      categoryLayouts.forEach((layout) => {
        gridLayer
          .append("rect")
          .attr("class", "grid-cell-bg")
          .attr("x", MARGIN.left + layout.startX)
          .attr("y", MARGIN.top + tierIndex * tierHeight)
          .attr("width", layout.width)
          .attr("height", tierHeight)
          .attr("fill", "transparent")
          .style("cursor", "pointer")
          .on("click", (event) =>
            onTierCategoryClick(layout.category, tier, event),
          )
          .on("mouseover", function () {
            select(this).attr("fill", "rgba(0, 0, 0, 0.1)")
          })
          .on("mouseout", function () {
            select(this).attr("fill", "transparent")
          })
      })
    })
  }

  // Horizontal lines (tier separators)
  tiers.forEach((_, i) => {
    gridLayer
      .append("line")
      .attr("x1", MARGIN.left)
      .attr("y1", MARGIN.top + i * tierHeight)
      .attr("x2", MARGIN.left + gridWidth)
      .attr("y2", MARGIN.top + i * tierHeight)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .style("pointer-events", "none")
  })

  // Bottom border
  gridLayer
    .append("line")
    .attr("x1", MARGIN.left)
    .attr("y1", MARGIN.top + gridHeight)
    .attr("x2", MARGIN.left + gridWidth)
    .attr("y2", MARGIN.top + gridHeight)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .style("pointer-events", "none")

  // Vertical lines (category separators)
  categoryLayouts.forEach((layout) => {
    gridLayer
      .append("line")
      .attr("x1", MARGIN.left + layout.startX)
      .attr("y1", MARGIN.top)
      .attr("x2", MARGIN.left + layout.startX)
      .attr("y2", MARGIN.top + gridHeight)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .style("pointer-events", "none")
  })

  // Right border
  gridLayer
    .append("line")
    .attr("x1", MARGIN.left + gridWidth)
    .attr("y1", MARGIN.top)
    .attr("x2", MARGIN.left + gridWidth)
    .attr("y2", MARGIN.top + gridHeight)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .style("pointer-events", "none")

  // Tier labels on the left
  if (yAxisMode === "continuous") {
    // In continuous mode, show numeric labels at major tick marks (1.0, 2.0, 3.0, 4.0, 5.0)
    // Use same positioning as dots: levelIndex * cellHeight where levelIndex = (value - 1.0) / 0.1
    const cellHeight = gridHeight / 40
    const majorTicks = [1.0, 2.0, 3.0, 4.0, 5.0]
    majorTicks.forEach((tickValue) => {
      const levelIndex = (tickValue - 1.0) / 0.1
      const yPosition = levelIndex * cellHeight

      gridLayer
        .append("text")
        .attr("x", MARGIN.left - 10)
        .attr("y", MARGIN.top + yPosition)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .style("pointer-events", "none")
        .text(tickValue.toFixed(1))
    })
  } else {
    // Discrete mode: show tier labels
    tiers.forEach((tier, i) => {
      gridLayer
        .append("text")
        .attr("x", MARGIN.left - 10)
        .attr("y", MARGIN.top + i * tierHeight + tierHeight / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("fill", "#666")
        .style("pointer-events", "none")
        .text(tier)
    })
  }
}

const drawMeanLines = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  height: number,
  categoryLayouts: CategoryLayout[],
  objectives: Objective[],
  globalDotSize: number,
  yAxisMode?: "discrete" | "continuous",
) => {
  // Only draw mean lines in continuous mode
  if (yAxisMode !== "continuous") {
    // Remove mean lines if they exist
    svg.select(".mean-lines").remove()
    return
  }

  // Create or select mean lines layer and raise it above everything
  let meanLineLayer = svg.select<SVGGElement>(".mean-lines")
  if (meanLineLayer.empty()) {
    meanLineLayer = svg.append("g").attr("class", "mean-lines")
  }

  const gridHeight = height - MARGIN.top - MARGIN.bottom

  // Prepare data for mean lines
  const meanLineData = categoryLayouts
    .map((layout) => {
      const categoryObjectives = objectives.filter(
        (obj) =>
          obj.category === layout.category &&
          obj.tierContinuous !== undefined &&
          !isNaN(obj.tierContinuous),
      )

      if (categoryObjectives.length === 0) return null

      const sum = categoryObjectives.reduce(
        (acc, obj) => acc + (obj.tierContinuous ?? 0),
        0,
      )
      const mean = sum / categoryObjectives.length

      // Convert mean value to y position using same calculation as dots
      // In continuous mode, we have 40 levels (1.0, 1.1, 1.2, ..., 5.0)
      // Each level is 0.1 apart, so levelIndex = (mean - 1.0) / 0.1
      const cellHeight = gridHeight / 40
      const levelIndex = Math.floor((mean - 1.0) / 0.1)

      // Position where the first row of dots would go:
      // For row 0: y_rel = row * spacing + dotSize = 0 * spacing + dotSize = dotSize
      // globalY = MARGIN.top + levelIndex * cellHeight + y_rel - dotSize / 2
      // globalY = MARGIN.top + levelIndex * cellHeight + dotSize - dotSize / 2
      // globalY = MARGIN.top + levelIndex * cellHeight + dotSize / 2
      const yPosition = levelIndex * cellHeight + globalDotSize

      return {
        category: layout.category,
        mean,
        x1: MARGIN.left + layout.startX,
        x2: MARGIN.left + layout.startX + layout.width,
        y: MARGIN.top + yPosition,
      }
    })
    .filter((d) => d !== null) as {
    category: string
    mean: number
    x1: number
    x2: number
    y: number
  }[]

  // Bind data to line groups
  const lineGroups = meanLineLayer
    .selectAll<SVGGElement, (typeof meanLineData)[0]>(".mean-line-group")
    .data(meanLineData, (d) => d.category)

  // Remove old lines
  lineGroups.exit().transition().duration(300).style("opacity", 0).remove()

  // Add new line groups
  const enterGroups = lineGroups
    .enter()
    .append("g")
    .attr("class", "mean-line-group")

  // Add visible line for display (enter)
  enterGroups
    .append("line")
    .attr("class", "mean-line-visible")
    .attr("x1", (d) => d.x1)
    .attr("x2", (d) => d.x2)
    .attr("y1", (d) => d.y)
    .attr("y2", (d) => d.y)
    .attr("stroke", "#1976d2")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2")
    .style("opacity", 0.7)
    .style("pointer-events", "none")

  // Merge and update all lines with transition
  const allGroups = enterGroups.merge(lineGroups)

  allGroups
    .select(".mean-line-visible")
    .transition()
    .duration(1000)
    .attr("x1", (d) => d.x1)
    .attr("x2", (d) => d.x2)
    .attr("y1", (d) => d.y)
    .attr("y2", (d) => d.y)
}

const drawCategoryLabels = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  height: number,
  categoryLayouts: CategoryLayout[],
  onCategoryClick?: (category: string) => void,
  showMapView: boolean = false,
) => {
  svg.selectAll(".category-labels").remove()
  const labelLayer = svg.append("g").attr("class", "category-labels")

  const gridHeight = height - MARGIN.top - MARGIN.bottom

  categoryLayouts.forEach((layout) => {
    const x = MARGIN.left + layout.startX + layout.width / 2
    const y = MARGIN.top + gridHeight + 15

    // Split long category names into multiple lines
    const maxCharsPerLine = 8 // Approximate chars that fit
    const words = layout.category.split(" ")
    const lines: string[] = []
    let currentLine = ""

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })
    if (currentLine) lines.push(currentLine)

    // Create a group for the label (background + text)
    const labelGroup = labelLayer
      .append("g")
      .attr("class", "category-label-group")

    // Add background rectangle if clickable
    let backgroundRect: Selection<
      SVGRectElement,
      unknown,
      null,
      undefined
    > | null = null
    if (onCategoryClick && showMapView) {
      const padding = 4
      const lineHeight = 11 * 1.2
      const rectHeight = lines.length * lineHeight + padding * 2
      const rectWidth = layout.width * 0.9

      backgroundRect = labelGroup
        .append("rect")
        .attr("x", x - rectWidth / 2)
        .attr("y", y - padding)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("rx", 4)
        .attr("fill", "#f5f5f5")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
    }

    const textElement = labelGroup
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("cursor", onCategoryClick ? "pointer" : "default")
      .style("pointer-events", "none")

    // Add each line as a tspan
    lines.forEach((line, i) => {
      textElement
        .append("tspan")
        .attr("x", x)
        .attr("dy", i === 0 ? 0 : "1.2em")
        .text(line)
    })

    if (onCategoryClick && backgroundRect && showMapView) {
      // Add hover effects to background
      backgroundRect
        .on("click", () => onCategoryClick(layout.category))
        .on("mouseover", function () {
          select(this).attr("fill", "#e3f2fd").attr("stroke", "#1976d2")
        })
        .on("mouseout", function () {
          select(this).attr("fill", "#f5f5f5").attr("stroke", "#ddd")
        })
    }
  })
}

// ============================================================================
// Component
// ============================================================================

export default function TierGrid({
  objectives,
  categories,
  tiers,
  responsive = true,
  width = 800,
  height = 600,
  colorMode = "default",
  showComparison = false,
  yAxisMode = "discrete",
  selectedObjectives = [],
  onObjectiveClick,
  onCategoryClick,
  onTierCategoryClick,
  tierColorMap = DEFAULT_TIER_COLORS,
  showMapView = false,
  interactive = true,
  animate = true,
  onReady,
  focusScenarioId,
  onChartHover,
}: TierGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const svgSelection = useRef<Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null)

  // Refs let the d3 callbacks read the latest values without triggering
  // a re-bind on every render. Matches the pattern in RadarPlot and
  // ResilienceHeatmap.
  const interactiveRef = useRef(interactive)
  interactiveRef.current = interactive
  const animateRef = useRef(animate)
  animateRef.current = animate
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onChartHoverRef = useRef(onChartHover)
  onChartHoverRef.current = onChartHover
  const focusScenarioIdRef = useRef(focusScenarioId)
  focusScenarioIdRef.current = focusScenarioId
  const hasFiredOnReadyRef = useRef(false)

  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  useEffect(() => {
    if (responsive && dimensions) {
      setCurrentWidth(dimensions.width)
      setCurrentHeight(dimensions.height)
    }
  }, [responsive, dimensions])

  const getSvgSelection = useCallback(() => {
    if (!svgSelection.current && svgRef.current) {
      svgSelection.current = select(svgRef.current)
    }
    return svgSelection.current
  }, [])

  const categoryColorScale = useMemo(() => scaleOrdinal(CATEGORY_COLORS), [])

  const selectedOutcomeLocationCodes = useMemo(
    () =>
      new Set(
        selectedObjectives.map((obj) => `${obj.tierCode}:${obj.locationId}`),
      ),
    [selectedObjectives],
  )

  const initialize = useCallback(
    (w: number, h: number, currentObjectives: typeof objectives) => {
      const svg = getSvgSelection()
      if (!svg || categories.length === 0 || currentObjectives.length === 0)
        return

      // Only clear grid/label layers, not dots or mean lines
      svg.selectAll(".tier-grid").remove()
      svg.selectAll(".category-labels").remove()
      svg.selectAll(".tier-labels").remove()

      svg
        .attr("width", w)
        .attr("height", h)
        .attr("viewBox", `0 0 ${w} ${h}`)
        .attr("preserveAspectRatio", "xMidYMid meet")

      const categoryLayouts = calculateCategoryWidths(
        currentObjectives,
        categories,
        w - MARGIN.left - MARGIN.right,
      )

      // Calculate tier positions to get globalDotSize
      const { globalDotSize } = calculateTierPositions(
        currentObjectives,
        categories,
        tiers,
        w,
        h,
        showComparison,
        yAxisMode,
      )

      drawTierGrid(
        svg,
        w,
        h,
        categoryLayouts,
        tiers,
        onTierCategoryClick,
        showMapView,
        yAxisMode,
      )
      drawMeanLines(
        svg,
        h,
        categoryLayouts,
        currentObjectives,
        globalDotSize,
        yAxisMode,
      )
      drawCategoryLabels(svg, h, categoryLayouts, onCategoryClick, showMapView)
    },
    [
      getSvgSelection,
      categories,
      tiers,
      onCategoryClick,
      onTierCategoryClick,
      showMapView,
      yAxisMode,
      showComparison,
    ],
  )

  const redrawShapes = useCallback(
    (w: number, h: number) => {
      const svg = getSvgSelection()
      if (!svg || objectives.length === 0) return
      const enterDuration = animateRef.current ? 1000 : 0
      const exitDuration = animateRef.current ? 300 : 0

      const { positions, globalDotSize } = calculateTierPositions(
        objectives,
        categories,
        tiers,
        w,
        h,
        showComparison,
        yAxisMode,
      )

      // Update mean lines when yAxisMode or objectives change
      const categoryLayouts = calculateCategoryWidths(
        objectives,
        categories,
        w - MARGIN.left - MARGIN.right,
      )
      drawMeanLines(
        svg,
        h,
        categoryLayouts,
        objectives,
        globalDotSize,
        yAxisMode,
      )

      // Helper function to create path for different shapes
      const getShapePath = (d: Position) => {
        const cx = d.x + d.width / 2
        const cy = d.y + d.height / 2
        const size = d.width

        if (d.shape === "triangle-up") {
          const h = size * 0.866 // height of equilateral triangle
          return `M ${cx},${cy - h / 2} L ${cx + size / 2},${cy + h / 2} L ${cx - size / 2},${cy + h / 2} Z`
        } else if (d.shape === "triangle-down") {
          const h = size * 0.866
          return `M ${cx},${cy + h / 2} L ${cx + size / 2},${cy - h / 2} L ${cx - size / 2},${cy - h / 2} Z`
        } else {
          // rect
          return `M ${d.x},${d.y} L ${d.x + d.width},${d.y} L ${d.x + d.width},${d.y + d.height} L ${d.x},${d.y + d.height} Z`
        }
      }

      // Create dots layer if it doesn't exist, otherwise move it to top
      let dotsLayer = svg.select<SVGGElement>(".dots-layer")
      if (dotsLayer.empty()) {
        dotsLayer = svg.append("g").attr("class", "dots-layer")
      } else {
        dotsLayer.raise()
      }

      const shapes = dotsLayer
        .selectAll<SVGPathElement, Position>(".tier-dot")
        .data(positions, (d) => String(d.id))

      // Enter
      const enterShapes = shapes
        .enter()
        .append("path")
        .attr("class", "tier-dot")
        .attr("d", getShapePath)
        .attr("fill", (d) =>
          getFillColor(
            d.obj,
            colorMode,
            tierColorMap,
            categoryColorScale,
            showComparison,
          ),
        )
        .attr("stroke", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? "#333" : "#fff",
        )
        .attr("stroke-width", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? 3 : 1,
        )
        .style("cursor", showMapView ? "pointer" : "default")
        .attr("opacity", 0)

      // Merge
      const allShapes = enterShapes.merge(shapes)

      // Transition
      allShapes
        .transition()
        .duration(enterDuration)
        .ease(easeCubicOut)
        .attr("d", getShapePath)
        .attr("fill", (d) =>
          getFillColor(
            d.obj,
            colorMode,
            tierColorMap,
            categoryColorScale,
            showComparison,
          ),
        )
        .attr("fill-opacity", (d) =>
          showComparison && d.obj.baselineTier == d.obj.tier ? 0.2 : 1,
        )
        .attr("opacity", 1)

      // Update stroke separately (no transition) so selection changes are immediate
      allShapes
        .attr("stroke", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? "#333" : "#fff",
        )
        .attr("stroke-width", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? 2 : 0,
        )

      // Skip listeners in capture mode so the snapshot SVG carries no
      // event handlers (also avoids tooltip mounts during off-screen render).
      if (interactiveRef.current) {
        allShapes
          .on("click", function (_event, d) {
            if (showMapView && onObjectiveClick) {
              onObjectiveClick(d.obj)
            }
          })
          .on("mouseover", function (this: SVGPathElement, event, d) {
            const sid = focusScenarioIdRef.current
            if (sid && onChartHoverRef.current) {
              const tierLevel = parseInt(d.obj.tier.replace(/^Tier\s+/, ""), 10)
              onChartHoverRef.current({
                scenarioId: sid,
                outcome: d.obj.category,
                tierValue: Number.isFinite(tierLevel) ? tierLevel : undefined,
              })
            }
            if (
              showMapView &&
              !selectedOutcomeLocationCodes.has(String(d.id))
            ) {
              select(this).attr("stroke", "#333").attr("stroke-width", 2)
            }

            // Show tooltip
            if (tooltipRef.current && containerRef.current) {
              const obj = d.obj

              const baselineTierRow = showComparison
                ? `<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: #718096;">Baseline Tier:</span>
                  <span style="font-weight: 600; color: #2d3748;">${obj.baselineTier}</span>
                </div>`
                : ""

              const continuousTierRow =
                obj.tierContinuous !== undefined
                  ? `<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: #718096;">Continuous Tier:</span>
                  <span style="font-weight: 600; color: #2d3748;">${Number(obj.tierContinuous).toFixed(2)}</span>
                </div>`
                  : ""

              const baselineContinuousTierRow =
                showComparison && obj.baselineTierContinuous !== undefined
                  ? `<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: #718096;">Baseline Continuous:</span>
                  <span style="font-weight: 600; color: #2d3748;">${Number(obj.baselineTierContinuous).toFixed(2)}</span>
                </div>`
                  : ""

              const deltaRow =
                showComparison &&
                obj.tierContinuous !== undefined &&
                obj.baselineTierContinuous !== undefined
                  ? (() => {
                      const delta =
                        Number(obj.tierContinuous) -
                        Number(obj.baselineTierContinuous)
                      const deltaColor =
                        delta < 0
                          ? "#1ca367"
                          : delta > 0
                            ? "#ee5d32"
                            : "#718096"
                      const deltaSign = delta > 0 ? "+" : ""
                      return `<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                        <span style="color: #718096;">Delta (Cont. Tier):</span>
                        <span style="font-weight: 600; color: ${deltaColor};">${deltaSign}${delta.toFixed(2)}</span>
                      </div>`
                    })()
                  : ""

              const tooltipHTML = `
              <div style="font-weight: 600; margin-bottom: 4px; color: #1a202c; font-size: 15.5px;">${obj.locationName}</div>
              <div style="color: #718096; font-size: 12px; margin-bottom: 6px;">${obj.category}</div>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 12px;">
                  <span style="color: #718096;">Tier:</span>
                  <span style="font-weight: 600; color: #2d3748;">${obj.tier}</span>
                </div>
                ${continuousTierRow}
                ${baselineTierRow}
                ${baselineContinuousTierRow}
                ${deltaRow}
                <div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: #718096;">Location ID:</span>
                  <span style="font-weight: 500; color: #4a5568; font-family: monospace;">${obj.locationId}</span>
                </div>
              </div>
            `
              tooltipRef.current.innerHTML = tooltipHTML
              tooltipRef.current.style.opacity = "1"

              // Position relative to container
              const containerRect = containerRef.current.getBoundingClientRect()
              const x = event.clientX - containerRect.left + 10
              const y = event.clientY - containerRect.top + 10
              tooltipRef.current.style.left = `${x}px`
              tooltipRef.current.style.top = `${y}px`
            }
          })
          .on("mousemove", function (event) {
            if (tooltipRef.current && containerRef.current) {
              // Update position relative to container
              const containerRect = containerRef.current.getBoundingClientRect()
              const x = event.clientX - containerRect.left + 10
              const y = event.clientY - containerRect.top + 10
              tooltipRef.current.style.left = `${x}px`
              tooltipRef.current.style.top = `${y}px`
            }
          })
          .on("mouseout", function (this: SVGPathElement, _event, d) {
            if (!selectedOutcomeLocationCodes.has(String(d.id))) {
              select(this).attr("stroke-width", 0)
            }

            // Hide tooltip
            if (tooltipRef.current) {
              tooltipRef.current.style.opacity = "0"
            }
          })
      }

      // Exit
      shapes
        .exit()
        .transition()
        .duration(exitDuration)
        .attr("opacity", 0)
        .remove()
    },
    [
      getSvgSelection,
      objectives,
      categories,
      tiers,
      colorMode,
      tierColorMap,
      categoryColorScale,
      selectedOutcomeLocationCodes,
      onObjectiveClick,
      showComparison,
      showMapView,
      yAxisMode,
    ],
  )

  // Initialize when dimensions or categories change
  useEffect(() => {
    if (currentWidth > 0 && currentHeight > 0 && objectives.length > 0) {
      initialize(currentWidth, currentHeight, objectives)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWidth, currentHeight, initialize, categories])

  // Animate when data changes
  useEffect(() => {
    if (currentWidth > 0 && currentHeight > 0 && objectives.length > 0) {
      redrawShapes(currentWidth, currentHeight)
    }
  }, [currentWidth, currentHeight, redrawShapes, objectives])

  // Fire onReady once the chart has paint-committed at least one frame
  // with non-zero data and dimensions. Capture hosts await this before
  // serializing the SVG.
  useEffect(() => {
    if (hasFiredOnReadyRef.current) return
    if (currentWidth <= 0 || currentHeight <= 0) return
    if (objectives.length === 0 || categories.length === 0) return
    const id = requestAnimationFrame(() => {
      if (hasFiredOnReadyRef.current) return
      hasFiredOnReadyRef.current = true
      onReadyRef.current?.()
    })
    return () => cancelAnimationFrame(id)
  }, [currentWidth, currentHeight, objectives.length, categories.length])

  return (
    <div
      ref={containerRef}
      style={{
        width: responsive ? "100%" : currentWidth,
        height: responsive ? "100%" : currentHeight,
        minHeight: 400,
        position: "relative",
      }}
      onMouseEnter={() => {
        const sid = focusScenarioIdRef.current
        if (sid) onChartHoverRef.current?.({ scenarioId: sid })
      }}
      onMouseLeave={() => {
        onChartHoverRef.current?.(null)
      }}
    >
      <svg
        ref={svgRef}
        width={currentWidth}
        height={currentHeight}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {yAxisMode === "continuous" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="24" height="16" viewBox="0 0 24 16">
              <line
                x1="2"
                y1="8"
                x2="22"
                y2="8"
                stroke="#1976d2"
                strokeWidth="2"
                strokeDasharray="4,2"
                opacity="0.7"
              />
            </svg>
            <span style={{ color: "#4a5568" }}>Mean Cont. Tier</span>
          </div>
        </div>
      )}

      {/* Color legend for comparison mode */}
      {showComparison && colorMode === "tier" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polygon
                points="8,1 1,15 15,15"
                fill="#bbbbbb"
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
            <span style={{ color: "#4a5568" }}>Improved from baseline</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect
                x="1"
                y="1"
                width="14"
                height="14"
                fill="#bbbbbb"
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
            <span style={{ color: "#4a5568" }}>No change</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <polygon
                points="8,15 1,1 15,1"
                fill="#bbbbbb"
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
            <span style={{ color: "#4a5568" }}>Worsened from baseline</span>
          </div>
        </div>
      )}

      {/* Color legend for comparison mode */}

      {/* Legend for mean line in continuous mode */}
      {/* {yAxisMode === "continuous" && (
        <div
          style={{
            position: "absolute",
            top: showComparison && colorMode === "tier" ? 50 : 0,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="24" height="16" viewBox="0 0 24 16">
            <line
              x1="2"
              y1="8"
              x2="22"
              y2="8"
              stroke="#1976d2"
              strokeWidth="2"
              strokeDasharray="4,2"
              opacity="0.7"
            />
          </svg>
          <span style={{ color: "#4a5568" }}>Mean continuous tier</span>
        </div>
      )} */}

      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.97)",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "11px",
          fontFamily:
            '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif',
          lineHeight: "1.5",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
          opacity: 0,
          transition: "opacity 200ms",
          zIndex: 1000,
          maxWidth: "280px",
        }}
      />
    </div>
  )
}
