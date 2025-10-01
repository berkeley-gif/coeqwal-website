import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import type { ContainerSize } from "./Groundwater"

export type GroundwaterRow = {
  msmt_date: string
  gse_gwe: number
  date?: Date // assumed parsed upstream
}

type Margin = { top: number; right: number; bottom: number; left: number }
const margin: Margin = { top: 64, right: 24, bottom: 44, left: 56 }
const axisColor = "#f2f0ef"
const lineColor = "#F1B143" // golden

// --------------------------------------------
// Define drought bands (edit these dates)
// --------------------------------------------
const DROUGHT_BANDS: Array<{ start: Date; end: Date; opacity?: number }> = [
  { start: new Date("2007-01-01"), end: new Date("2009-01-01"), opacity: 0.22 },
  { start: new Date("2012-01-01"), end: new Date("2013-06-01"), opacity: 0.22 },
  { start: new Date("2014-01-01"), end: new Date("2016-12-31"), opacity: 0.25 },
  { start: new Date("2019-10-01"), end: new Date("2020-06-01"), opacity: 0.25 },
]

type Props = {
  data: GroundwaterRow[]
  yExtents: [number, number]
}

export default function GroundwaterLine({ data, yExtents }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

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

  const xScale = useMemo(() => {
    const minDate = d3.min(data, (d) => d.date!) ?? new Date()
    const maxDate = d3.max(data, (d) => d.date!) ?? new Date()
    return d3.scaleTime()
      .domain([minDate, maxDate])
      .range([margin.left, Math.max(margin.left, size.width - margin.right)])
  }, [data, size.width])

  const yScale = useMemo(() => {
  return d3.scaleLinear()
    .domain(yExtents)
    .range([margin.top, Math.max(margin.top, size.height - margin.bottom)]) // reversed
    .nice()
}, [yExtents, size.height])

  const linePath = useMemo(() => {
    const line = d3.line<GroundwaterRow>()
      .x((d) => xScale(d.date!))
      .y((d) => yScale(d.gse_gwe))
      .curve(d3.curveLinear)
    return line(data) ?? ""
  }, [data, xScale, yScale])

  const areaPath = useMemo(() => {
    const area = d3.area<GroundwaterRow>()
      .x((d) => xScale(d.date!))
      .y0(yScale(yExtents[1])) // fill down to bottom of chart
      .y1((d) => yScale(d.gse_gwe))
      .curve(d3.curveLinear)
    return area(data) ?? ""
  }, [data, xScale, yScale, yExtents])

  const xTicks = useMemo(() => xScale.ticks(6), [xScale])
  const yTicks = useMemo(() => yScale.ticks(3), [yScale])

  const plotWidth = Math.max(0, size.width - margin.left - margin.right)
  const plotHeight = Math.max(0, size.height - margin.top - margin.bottom)

  return (
    <svg ref={svgRef} width="100%" height="100%">
      {/* clip to plotting area so bands/area/line don't spill out */}
      <defs>
        <clipPath id="plot-clip">
          <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} />
        </clipPath>
      </defs>

      

      {/* Axes */}
      <XAxis size={size} xScale={xScale} margin={margin} ticks={xTicks} />
      <YAxis yScale={yScale} margin={margin} ticks={yTicks} />

      {/* Area under line (light blue) */}
      <g clipPath="url(#plot-clip)">
        <path d={areaPath} fill="#115EB6" />
        {/* Golden line on top */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={3} />
      </g>

      {/* --- Gray shaded drought bands (behind) --- */}
      <g clipPath="url(#plot-clip)" pointerEvents="none">
        {DROUGHT_BANDS.map((b, i) => {
          const x0 = xScale(b.start)
          const x1 = xScale(b.end)
          return (
            <rect
              key={i}
              x={Math.min(x0, x1)}
              y={margin.top}
              width={Math.max(0, Math.abs(x1 - x0))}
              height={plotHeight}
              fill="#8b99b2" // gray-blue
              opacity={b.opacity ?? 0.22}
            />
          )
        })}
      </g>
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
  xScale: d3.ScaleTime<number, number>
  margin: Margin
  ticks: Date[]
}) {
  // x-axis line is drawn at the TOP of the plot area
  const yLine = margin.top
  const yLabels = Math.max(margin.top, size.height - margin.bottom)

  // --- icon setup ---
  const iconSize = 48        
  const iconPadLeft = 8      
  const iconPadAbove = 0     
  const iconX = margin.left - iconSize - iconPadLeft
  const iconY = yLine - iconSize - iconPadAbove

  return (
    <>
      {/* x-axis line (top of plot) */}
      <path
        d={`M${margin.left},${yLine} L${size.width - margin.right},${yLine}`}
        stroke={axisColor}
        strokeWidth={1}
      />

      {/* well icon: above & attached to the x-axis, left of y tick labels */}
      <image
        href="/icons/well_icon.svg"
        x={iconX+50}
        y={iconY}
        width={iconSize}
        height={iconSize}
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: "invert(1) brightness(100%)" }} // white
        pointerEvents="none"
      />

      {/* tick labels at bottom */}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={xScale(t)}
          y={yLabels}
          dy="1.2em"
          style={{ textAnchor: "middle", fill: "white" }}
        >
          {d3.timeFormat("%Y")(t)}
        </text>
      ))}
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
    <g transform={`translate(${margin.left},0)`}>
      {ticks.map((t, i) => (
        <text
          key={i}
          x={-8}
          y={yScale(t)}
          dy="0.35em"
          style={{ textAnchor: "end", fill: "white" }}
        >
          {t}ft
        </text>
      ))}
    </g>
  )
}