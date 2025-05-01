import * as d3 from "d3"
import { useEffect, useRef } from "react"
import { Setting, WaterNeedSetting } from "./types"

type ExceedancePlotProps = {
  currentWaterNeed: WaterNeedSetting
  // thresholds: Array<{ cutoff: number; value: number }>
  width: number
  height: number
}

const ExceedancePlot = ({
  currentWaterNeed,
  // thresholds,
  width = 500,
  height = 300,
}: ExceedancePlotProps) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    const thresholds = currentWaterNeed.setting.rule.map(
      (deliverySetting: Setting) => {
        const yearsValue =
          parseFloat(deliverySetting["Years"]?.["value"] as string) ?? 0
        const amountValue =
          parseFloat(deliverySetting["Amount"]?.["value"] as string) ?? 0
        console.log("Exceedance Plot deliverySetting:", yearsValue, amountValue)
        return {
          value: amountValue,
          cutoff: 1 - yearsValue / 20, // Convert years to a fraction of 20
        }
      },
    )

    if (thresholds.length <= 0) {
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

    // # Add the first point of the curve at 0% exceedance
    thresholds.sort((a, b) => a.cutoff - b.cutoff)
    if (thresholds[0]) {
      thresholds.unshift({ cutoff: 0, value: thresholds[0].value })
    }

    const MAX = d3.max(thresholds, (d) => d.value) * 1.5 || 0

    const MARGIN = { top: 30, right: 50, bottom: 50, left: 60 }
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([MARGIN.left, width - MARGIN.right])

    const yScale = d3
      .scaleLinear()
      .domain([0, MAX])
      .range([height - MARGIN.bottom, MARGIN.top])
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", (width - MARGIN.left - MARGIN.right) / 2 + MARGIN.left)
      .attr("y", height - 10)
      .attr("font-size", "18px")
      .text("Probability of Exceedance (%)")

    // Add y-axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", MARGIN.left - 40)
      .attr("x", -(height - MARGIN.top - MARGIN.bottom) / 2 - MARGIN.top)
      .attr("font-size", "18px")
      .text("TAF")

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => d * 100))
    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left}, 0)`)
      .call(d3.axisLeft(yScale))

    // data.unshift({ cutoff: 0, value: data[0].value });
    // console.log(data);
    // let data = JSON.parse(JSON.stringify(constraints.value));

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
    // .call(
    //   d3.drag().on("drag", function (event, d) {
    //     data[0].value = data[1].value;
    //     d.value = Math.round(yScale.invert(event.y) / 20) * 20;
    //     sanitizeConstraints();
    //     updateCircles();
    //   })
    // );

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

    // const updateCircles = () => {
    //   // data[0].value = data[1].value;
    //   svg
    //     .selectAll("circle")
    //     .attr("cx", (d) => xScale(d.cutoff))
    //     .attr("cy", (d) => yScale(d.value))
    //   svg.select("#exceedance-path").attr(
    //     "d",
    //     d3
    //       .line<{ cutoff: number; value: number }>()
    //       .x((d) => xScale(d.cutoff))
    //       .y((d) => yScale(d.value)),
    //   )
    // }
  }, [currentWaterNeed, width, height])

  return (
    <svg
      ref={svgRef}
      style={{
        width: width,
        height: height,
        aspectRatio: "auto",
        display: "block",
        overflow: "visible",
      }}
    />
  )
}

export default ExceedancePlot
