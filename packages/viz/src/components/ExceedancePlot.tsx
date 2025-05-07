import * as d3 from "d3"
import { useEffect, useRef } from "react"

type ExceedancePlotProps = {
  thresholds: { cutoff: number; value: number }[]
  width: number
  height: number
}

const ExceedancePlot = ({
  thresholds,
  width = 500,
  height = 300,
}: ExceedancePlotProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    if (!thresholds || thresholds.length <= 0) {
      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#999")
        .text("No data available")

      return
    }

    // Add the first point of the curve at 0% exceedance
    thresholds.sort((a, b) => a.cutoff - b.cutoff)
    if (thresholds[0]) {
      thresholds.unshift({ cutoff: 0, value: thresholds[0].value })
    }

    // Get dimensions from container (for responsive)
    let chartWidth = width
    const chartHeight = height

    const MAX = (d3.max(thresholds, (d) => d?.value) ?? 0) * 1.5

    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      chartWidth = width > containerWidth ? containerWidth : width
    }

    // const MARGIN = { top: 30, right: 50, bottom: 50, left: 60 }
    const MARGIN = { top: 10, right: 10, bottom: 50, left: 60 }
    const svg = d3
      .select(svgRef.current)
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
    console.log("SIZE", chartWidth, chartHeight)

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([MARGIN.left, chartWidth - MARGIN.right])

    const yScale = d3
      .scaleLinear()
      .domain([0, MAX])
      .range([chartHeight - MARGIN.bottom, MARGIN.top])
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", (chartWidth - MARGIN.left - MARGIN.right) / 2 + MARGIN.left)
      .attr("y", chartHeight - 10)
      .attr("font-size", "18px")
      .text("Probability of Exceedance (%)")

    // Add y-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", MARGIN.left - 40)
      .attr("x", -(chartHeight - MARGIN.top - MARGIN.bottom) / 2 - MARGIN.top)
      .attr("font-size", "18px")
      .text("TAF")

    svg
      .append("g")
      .attr("transform", `translate(0, ${chartHeight - MARGIN.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d) => (parseFloat(d.toString()) * 100).toString()),
      )
    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, 0)`)
      .call(d3.axisLeft(yScale))

    svg
      .selectAll("exceedance-path")
      .data([thresholds])
      .join("path")
      .attr("id", "exceedance-path")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("pointer-events", "none")
      .attr(
        "d",
        d3
          .line<{ cutoff: number; value: number }>()
          .x((d) => xScale(d.cutoff))
          .y((d) => yScale(d.value)),
      )
    svg
      .selectAll("circle")
      .data(thresholds)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.cutoff))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 4)
      .attr("fill", "#444444")

    svg
      .selectAll("vertical-lines")
      .data([
        0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65,
        0.7, 0.75, 0.8, 0.85, 0.9, 0.95,
      ])
      .join("line")
      .attr("x1", (d: number) => xScale(d))
      .attr("y1", yScale(0))
      .attr("x2", (d: number) => xScale(d))
      .attr("y2", yScale(MAX))
      .attr("stroke", "#878787")
      .style("stroke-dasharray", "5,10")
      .attr("stroke-width", 0.5)
  }, [thresholds, width, height])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "fit-content",
        position: "relative",
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          display: "block",
          overflow: "visible",
        }}
      />
    </div>
  )
}

export default ExceedancePlot
