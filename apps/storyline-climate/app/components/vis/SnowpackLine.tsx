import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import type { ContainerSize } from "./Snowpack"

export type SnowRow = {
  year: number
  "CanESM2 (Average)": number | null
  // Observed removed from usage (can be omitted in your data load too)
}

type Margin = { top: number; right: number; bottom: number; left: number }
const margin: Margin = { top: 24, right: 24, bottom: 54, left: 56 }
const axisColor = "#f2f0ef"
const canesmColor = "#F1B143" // yellow

type Props = {
  data: SnowRow[]
  yExtents: [number, number]
}

export default function SnowpackLine({ data, yExtents }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

  //before 2050
  const filteredData = useMemo(() => data.filter((d) => d.year <= 2050), [data])

  useEffect(() => {
    if (!svgRef.current) return
    const ro = new ResizeObserver(() => {
      const { width, height } = svgRef.current!.getBoundingClientRect()
      setSize({ width, height })
    })
    ro.observe(svgRef.current)
    const { width, height } = svgRef.current.getBoundingClientRect()
    setSize({ width, height })
    return () => ro.disconnect()
  }, [])

  const years = useMemo(() => filteredData.map((d) => d.year), [filteredData])

  const xScale = useMemo(() => {
    const minY = d3.min(years) ?? 0
    const maxY = 2050

    const pad = 3 // some padding before and after the line
    return d3
      .scaleLinear()
      .domain([minY - pad, maxY + pad]) // expand domain
      .range([margin.left, size.width - margin.right])
      .clamp(true)
  }, [years, size.width])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([size.height - margin.bottom, margin.top])
      .nice()
  }, [yExtents, size.height])

  const canesmPath = useMemo(() => {
    const line = d3
      .line<SnowRow>()
      .defined((d) => d["CanESM2 (Average)"] != null)
      .x((d) => xScale(d.year))
      .y((d) => yScale(d["CanESM2 (Average)"] as number))
    // .curve(d3.curveLinear)
    // .curve(d3.curveMonotoneX)
    return line(filteredData) ?? ""
  }, [filteredData, xScale, yScale])

  const canesmArea = useMemo(() => {
    const area = d3
      .area<SnowRow>()
      .defined((d) => d["CanESM2 (Average)"] != null)
      .x((d) => xScale(d.year))
      .y0(() => yScale(0)) // baseline at 0
      .y1((d) => yScale(d["CanESM2 (Average)"] as number))
    // .curve(d3.curveLinear)
    // .curve(d3.curveMonotoneX)
    return area(filteredData) ?? ""
  }, [filteredData, xScale, yScale])

  const xTicks = useMemo(() => {
    const tickCount = Math.min(8, Math.max(3, Math.floor(size.width / 120)))
    return xScale.ticks(tickCount)
  }, [xScale, size.width])

  const yTicks = useMemo(() => yScale.ticks(5), [yScale])

  return (
    <svg ref={svgRef} width="100%" height="100%">
      {/* Horizontal grid */}
      <g transform={`translate(0,0)`} opacity={0.25}>
        {yTicks.map((t, i) => (
          <path
            key={`yg-${i}`}
            d={`M${margin.left},${yScale(t)} L${size.width - margin.right},${yScale(t)}`}
            stroke={axisColor}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {/* Axes */}
      <XAxis size={size} xScale={xScale} margin={margin} ticks={xTicks} />
      <YAxis yScale={yScale} margin={margin} ticks={yTicks} />

      {/* Single yellow line */}
      <path d={canesmPath} fill="none" stroke={canesmColor} strokeWidth={4} />
      {/* White area under line */}
      <path d={canesmArea} fill="#ffffff" opacity={0.8} />

      {/* Legend (single item) */}
      {/* <Legend
        items={[{ label: "CanESM2 (Average)", color: canesmColor }]}
        x={size.width - margin.right - 180}
        y={margin.top}
      /> */}
    </svg>
  )
}

function XAxis({
  size,
  xScale,
  margin,
  ticks,
}: {
  size: ContainerSize
  xScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
}) {
  const y = size.height - margin.bottom
  return (
    <>
      <g className="x-axis-line">
        <path
          d={`M${margin.left},${y} L${size.width - margin.right},${y}`}
          stroke={axisColor}
          strokeWidth={1}
        />
      </g>
      <g className="x-axis-ticks">
        {ticks.map((t, i) => (
          <g key={i}>
            <text
              x={xScale(t)}
              y={y}
              dy="1.6em"
              style={{ textAnchor: "middle" }}
            >
              {d3.format("d")(t)}
            </text>
          </g>
        ))}
      </g>
      <text
        x={(margin.left + size.width - margin.right) / 2}
        y={y}
        dy="3.2em"
        style={{ textAnchor: "middle", fill: "white" }}
      >
        Year
      </text>

      {/* <text
        x={margin.left}
        y={y}
        dy="3.2em"
        dx="-2em"
        style={{ textAnchor: "end" }}
      >
        Ground surface
      </text> */}
    </>
  )
}

function YAxis({
  yScale,
  margin,
  ticks,
}: {
  yScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
}) {
  return (
    <g className="y-axis" transform={`translate(${margin.left},0)`}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={-6}
            x2={0}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke={axisColor}
            strokeWidth={1}
          />
          <text
            x={-8}
            y={yScale(t)}
            dx="-0.25em"
            dy="0.35em"
            style={{ textAnchor: "end" }}
          >
            {d3.format(".2~f")(t)}
          </text>
        </g>
      ))}
    </g>
  )
}

// function Legend({
//   items,
//   x,
//   y,
// }: {
//   items: { label: string; color: string }[]
//   x: number
//   y: number
// }) {
//   const rowHeight = 18
//   return (
//     <g transform={`translate(${x},${y})`}>
//       {items.map((it, i) => (
//         <g key={it.label} transform={`translate(0, ${i * rowHeight})`}>
//           <line x1={0} x2={18} y1={8} y2={8} stroke={it.color} strokeWidth={3} />
//           <text x={24} y={8} dy="0.35em">
//             {it.label}
//           </text>
//         </g>
//       ))}
//     </g>
//   )
// }
