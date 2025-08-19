import React, { useRef, useEffect, useState, useCallback } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface VerticalParallelLineData {
  id: string
  name: string
  values: Record<string, number>
  highlighted?: boolean
}

export interface VerticalParallelLinePlotProps {
  data: VerticalParallelLineData[]
  axes: string[]
  title?: string
  responsive?: boolean
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  colors?: {
    default: string
    highlighted: string
    background: string
  }
  lineColors?: string[]
  showBaseline?: boolean
  baselineData?: VerticalParallelLineData
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
}

const VerticalParallelLinePlot: React.FC<VerticalParallelLinePlotProps> = ({
  data,
  axes,
  title = "",
  responsive = true,
  width = 400,
  height = 400,
  margin = { top: 40, right: 20, bottom: 50, left: 100 },
  colors = {
    default: "#1f77b4",
    highlighted: "#ff7f0e",
    background: "#f8f9fa",
  },
  lineColors = [],
  showBaseline = false,
  baselineData,
  onLineHover,
  onLineClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  // Handle responsive sizing
  useEffect(() => {
    if (responsive && dimensions) {
      setCurrentWidth(dimensions.width || width)
      setCurrentHeight(dimensions.height || height)
    } else {
      setCurrentWidth(width)
      setCurrentHeight(height)
    }
  }, [dimensions, responsive, width, height])

  // Handle explicit height changes (for expand/collapse)
  useEffect(() => {
    if (!responsive) {
      setCurrentHeight(height)
    }
  }, [height, responsive])

  // Observable pattern: Create update function for smooth resizing
  const updateChart = useCallback((newWidth: number, newHeight: number, animate = true) => {
    if (!data || data.length === 0 || !axes || axes.length === 0) return

    const svg = d3.select(svgRef.current)
    const innerWidth = newWidth - margin.left - margin.right
    const innerHeight = newHeight - margin.top - margin.bottom

    // Set up transition for smooth animations
    const t = animate ? d3.transition().duration(500).ease(d3.easeCubicOut) : null

    // Update SVG viewBox for responsive scaling (Observable pattern)
    svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`)
       .attr("preserveAspectRatio", "xMidYMid meet")

    // Create or update scales
    const scales: Record<string, d3.ScaleLinear<number, number>> = {}
    axes.forEach((axis) => {
      scales[axis] = d3
        .scaleLinear()
        .domain([-1, 1])
        .range([0, innerWidth])
    })

    const yScale = d3
      .scalePoint()
      .domain(axes)
      .range([0, innerHeight])
      .padding(0)

    // Update or create main group
    let g = svg.select<SVGGElement>(".chart-group")
    if (g.empty()) {
      g = svg.append("g")
        .attr("class", "chart-group")
        .attr("transform", `translate(${margin.left},${margin.top})`)
    } else {
      const selection = animate ? g.transition(t as any) : g
      selection.attr("transform", `translate(${margin.left},${margin.top})`)
    }

    // Update background
    let background = g.select<SVGRectElement>(".chart-background")
    if (background.empty()) {
      background = g.append("rect")
        .attr("class", "chart-background")
        .attr("fill", colors.background)
        .attr("opacity", 0.1)
        .attr("rx", 4)
    }
    
    const backgroundSelection = animate ? background.transition(t as any) : background
    backgroundSelection
      .attr("width", innerWidth)
      .attr("height", innerHeight)

    // Update axes with smooth transitions
    axes.forEach((axis) => {
      const yPos = yScale(axis)!
      let axisGroup = g.select<SVGGElement>(`.axis-${axis.replace(/\s+/g, '-')}`)
      
      if (axisGroup.empty()) {
        axisGroup = g.append("g")
          .attr("class", `axis-${axis.replace(/\s+/g, '-')}`)
      }

      const axisSelection = animate ? axisGroup.transition(t as any) : axisGroup
      axisSelection.attr("transform", `translate(0, ${yPos})`)

      // Update axis line (original styling)
      let axisLine = axisGroup.select<SVGLineElement>(".axis-line")
      if (axisLine.empty()) {
        axisLine = axisGroup.append("line")
          .attr("class", "axis-line")
          .attr("stroke", "#666")  // Original color
          .attr("stroke-width", 2) // Original width
      }
      
      const lineSelection = animate ? axisLine.transition(t as any) : axisLine
      lineSelection
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", 0)
        .attr("y2", 0)

      // Update axis label with text wrapping (original styling)
      axisGroup.selectAll(".axis-label").remove() // Remove old labels

      const words = axis.split(/\s+/)
      const lineHeight = 14 // pixels
      const maxWordsPerLine = 1 // One word per line for better wrapping

      // Group words into lines
      const lines = []
      for (let i = 0; i < words.length; i += maxWordsPerLine) {
        lines.push(words.slice(i, i + maxWordsPerLine).join(" "))
      }

      // Create text element for each line
      lines.forEach((line, index) => {
        axisGroup.append("text")
          .attr("class", "axis-label")
          .attr("x", -10)
          .attr("y", 4 + (index - (lines.length - 1) / 2) * lineHeight) // Center multi-line text vertically
          .attr("text-anchor", "end") // Right align text
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .attr("fill", "#333")
          .text(line)
      })

      // Add tick marks (original styling)
      axisGroup.selectAll(".tick-line").remove()
      axisGroup.selectAll(".tick-label").remove()

      const ticks = [-1, -0.5, 0, 0.5, 1] // Original fixed ticks
      ticks.forEach((tick) => {
        const xPos = scales[axis]!(tick)

        // Tick mark
        axisGroup.append("line")
          .attr("class", "tick-line")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", -5)  // Above the line (original)
          .attr("y2", 5)
          .attr("stroke", "#666")
          .attr("stroke-width", 1)

        // Tick label
        axisGroup.append("text")
          .attr("class", "tick-label")
          .attr("x", xPos)
          .attr("y", -10)  // Above the line (original)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#666")
          .text(tick.toString()) // Show exact values including -0.5 and 0.5
      })
    })

    // Handle baseline - thick orange line for current operations
    if (showBaseline && baselineData) {
      const baselineColor = "#ff7f0e" // Bright orange for visibility
      const baselineLineGenerator = d3.line<[string, number]>()
        .x(([axis, value]) => scales[axis]!(value))
        .y(([axis]) => yScale(axis)!)
        // No curve - straight lines

      const baselinePathData = axes.map(
        (axis) => [axis, baselineData.values[axis] || 0] as [string, number],
      )

      let baselinePath = g.select<SVGPathElement>(".baseline-path")
      if (baselinePath.empty()) {
        baselinePath = g.append("path")
          .attr("class", "baseline-path")
          .attr("fill", "none")
          .attr("stroke", baselineColor)
          .attr("stroke-width", 4) // Thick line for prominence
          .attr("opacity", 0.9) // High opacity for visibility
          // No dash array - solid line
      }

      const pathSelection = animate ? baselinePath.transition(t as any) : baselinePath
      pathSelection.attr("d", baselineLineGenerator(baselinePathData))

      // Update baseline circles - orange to match line
      axes.forEach((axis) => {
        const value = baselineData.values[axis] || 0
        let circle = g.select<SVGCircleElement>(`.baseline-circle-${axis.replace(/\s+/g, '-')}`)
        
        if (circle.empty()) {
          circle = g.append("circle")
            .attr("class", `baseline-circle-${axis.replace(/\s+/g, '-')}`)
            .attr("fill", baselineColor)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("r", 5) // Slightly larger for prominence
            .attr("opacity", 0.9)
        }

        const circleSelection = animate ? circle.transition(t as any) : circle
        circleSelection
          .attr("cx", scales[axis]!(value))
          .attr("cy", yScale(axis)!)
      })
    } else {
      // Remove baseline elements when showBaseline is false
      const baselineRemovalTransition = animate ? d3.transition().duration(300) : null
      
      // Remove baseline path
      const baselinePath = g.select(".baseline-path")
      if (!baselinePath.empty()) {
        if (animate) {
          baselinePath.transition(baselineRemovalTransition as any)
            .attr("opacity", 0)
            .remove()
        } else {
          baselinePath.remove()
        }
      }
      
      // Remove baseline circles
      axes.forEach((axis) => {
        const circle = g.select(`.baseline-circle-${axis.replace(/\s+/g, '-')}`)
        if (!circle.empty()) {
          if (animate) {
            circle.transition(baselineRemovalTransition as any)
              .attr("opacity", 0)
              .remove()
          } else {
            circle.remove()
          }
        }
      })
    }

    // Update data lines with original styling
    // Line generator (no curves - original styling)
    const lineGenerator = d3.line<[string, number]>()
      .x(([axis, value]) => scales[axis]!(value))
      .y(([axis]) => yScale(axis)!)
      // No curve - use straight angular lines (original)

    data.forEach((d, dataIndex) => {
      const lineColor = lineColors.length > dataIndex ? lineColors[dataIndex]! : 
                       (d.highlighted ? colors.highlighted : colors.default)
      
      const pathData = axes.map(axis => [axis, d.values[axis] || 0] as [string, number])

      let path = g.select<SVGPathElement>(`.line-${dataIndex}`)
      if (path.empty()) {
        path = g.append("path")
          .attr("class", `line-${dataIndex}`)
          .attr("fill", "none")
          .attr("stroke", lineColor)
          .attr("stroke-width", d.highlighted ? 2.5 : 1.5) // Original widths
          .attr("opacity", d.highlighted ? 0.9 : 0.2) // Original opacity (0.2 for non-highlighted)
          .style("cursor", "pointer")
          .on("mouseover", function () {
            onLineHover?.(d)
            d3.select(this).attr("stroke-width", 3).attr("opacity", 1)
            
            // Highlight all corresponding circles (original behavior)
            g.selectAll("circle")
              .filter((circleData: any) => circleData.id === d.id)
              .attr("r", d.highlighted ? 6 : 5)
              .attr("opacity", 1)
          })
          .on("mouseout", function () {
            onLineHover?.(null)
            d3.select(this)
              .attr("stroke-width", d.highlighted ? 2.5 : 1.5)
              .attr("opacity", d.highlighted ? 0.9 : 0.2)
              
            // Reset all corresponding circles (original behavior)
            g.selectAll("circle")
              .filter((circleData: any) => circleData.id === d.id)
              .attr("r", d.highlighted ? 5 : 4)
              .attr("opacity", d.highlighted ? 1 : 0.8)
          })
          .on("click", function () {
            onLineClick?.(d)
          })
      }

      const pathSelection = animate ? path.transition(t as any) : path
      pathSelection.attr("d", lineGenerator(pathData))

      // Update circles at intersection points (original styling)
      axes.forEach((axis) => {
        const value = d.values[axis] || 0
        let circle = g.select<SVGCircleElement>(`.circle-${dataIndex}-${axis.replace(/\s+/g, '-')}`)
        
        if (circle.empty()) {
          circle = g.append("circle")
            .attr("class", `circle-${dataIndex}-${axis.replace(/\s+/g, '-')}`)
            .datum(d) // Store data reference for filtering (original)
            .attr("fill", lineColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5) // Original width
            .attr("r", d.highlighted ? 5 : 4) // Original sizes
            .attr("opacity", d.highlighted ? 1 : 0.8) // Original opacity
            .style("cursor", "pointer")
            .on("mouseover", function () {
              onLineHover?.(d)
              d3.select(this).attr("r", d.highlighted ? 6 : 5).attr("opacity", 1)
              
              // Find and highlight the corresponding line (original behavior)
              g.selectAll("path")
                .filter((lineData: any) => lineData === undefined) // This will be handled by line hover
            })
            .on("mouseout", function () {
              onLineHover?.(null)
              d3.select(this)
                .attr("r", d.highlighted ? 5 : 4)
                .attr("opacity", d.highlighted ? 1 : 0.8)
            })
            .on("click", function () {
              onLineClick?.(d)
            })
        }

        const circleSelection = animate ? circle.transition(t as any) : circle
        circleSelection
          .attr("cx", scales[axis]!(value))
          .attr("cy", yScale(axis)!)
      })
    })

    // Add title if provided
    if (title) {
      let titleElement = svg.select<SVGTextElement>(".chart-title")
      if (titleElement.empty()) {
        titleElement = svg.append("text")
          .attr("class", "chart-title")
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .attr("font-weight", "600")
          .attr("fill", "#333")
          .text(title)
      }
      
      titleElement
        .attr("x", newWidth / 2)
        .attr("y", 20)
    }
  }, [data, axes, margin, colors, lineColors, showBaseline, baselineData, title, onLineHover, onLineClick])

  // Initial render (no animation)
  useEffect(() => {
    updateChart(currentWidth, currentHeight, false)
  }, [updateChart])

  // Smooth animation when dimensions change
  useEffect(() => {
    updateChart(currentWidth, currentHeight, true)
  }, [currentWidth, currentHeight, updateChart])

  return (
    <div
      ref={containerRef}
      style={{
        width: responsive ? "100%" : currentWidth,
        height: responsive ? "100%" : currentHeight,
        minHeight: responsive ? "100%" : 300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <svg
        ref={svgRef}
        width={currentWidth}
        height={currentHeight}
        style={{ 
          display: "block",
          width: "100%",
          height: "100%",
          transition: "all 0.3s ease-out",
        }}
      />
    </div>
  )
}

export default React.memo(VerticalParallelLinePlot)