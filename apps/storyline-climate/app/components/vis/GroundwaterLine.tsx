import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import type { ContainerSize } from "./Groundwater"
import { OffWhiteColor } from "../helpers/colorPalette"
import { motion, MotionValue } from "@repo/motion"
import { usePlayAnimationOnce } from "@repo/motion/hooks"

export type GroundwaterRow = {
  msmt_date: string
  gse_gwe: number
  date?: Date // assumed parsed upstream
}

type Margin = { top: number; right: number; bottom: number; left: number }
const margin: Margin = { top: 64, right: 24, bottom: 40, left: 80 }
const axisColor = "#f2f0ef"

const tickLabelStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fill: OffWhiteColor,
};

const axisLabelStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fill: OffWhiteColor,
  fontWeight: "bold",
}

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
  scrollProgress: MotionValue<number>
}

export default function GroundwaterLine({ data, yExtents, scrollProgress }: Props) {
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
    return d3
      .scaleTime()
      .domain([minDate, maxDate])
      .range([margin.left, Math.max(margin.left, size.width - margin.right)])
  }, [data, size.width])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([margin.top, Math.max(margin.top, size.height - margin.bottom)]) // reversed
      .nice()
  }, [yExtents, size.height])

  const linePath = useMemo(() => {
    const line = d3
      .line<GroundwaterRow>()
      .x((d) => xScale(d.date!))
      .y((d) => yScale(d.gse_gwe))
      .curve(d3.curveLinear)
    return line(data) ?? ""
  }, [data, xScale, yScale])

  const areaPath = useMemo(() => {
    const area = d3
      .area<GroundwaterRow>()
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
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
          />
        </clipPath>
      </defs>

      {/* Axes */}
      <XAxis size={size} xScale={xScale} margin={margin} ticks={xTicks} scrollProgress={scrollProgress} />
      <YAxis yScale={yScale} margin={margin} ticks={yTicks} scrollProgress={scrollProgress} />

      {/* Area under line (light blue) */}
      <g clipPath="url(#plot-clip)">
        <path d={areaPath} fill="#115EB6" />
        {/* Golden line on top */}
        <path d={linePath} fill="none" stroke="#0c498fff" strokeWidth={3} />
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
  scrollProgress,
}: {
  size: ContainerSize
  xScale: d3.ScaleTime<number, number>
  margin: Margin
    ticks: Date[]
  scrollProgress: MotionValue<number>
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

  const linePath = usePlayAnimationOnce(scrollProgress, [0.3, 0.5], [0, 1])

  return (
    <>
      {/* x-axis line (top of plot) */}
      <motion.path
        d={`M${margin.left},${yLine} L${size.width - margin.right},${yLine}`}
        stroke={axisColor}
        strokeWidth={1}
        pathLength={linePath}
      />

      {/* well icon: above & attached to the x-axis, left of y tick labels */}
      <motion.image
        href="/icons/well_icon.svg"
        x={iconX + 50}
        y={iconY}
        width={iconSize}
        height={iconSize}
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: "invert(1) brightness(100%)", opacity: linePath }} // white
      />

      {/* tick labels at bottom */}
      {ticks.map((t, i) => (
        <XTick
          key={i}
          tick={t}
          xPos={xScale(t)}
          yPos={yLabels}
          idx={i}
          scrollProgress={scrollProgress}
        />
      ))}

      {/* Axis label */}
      <motion.text
        x={(margin.left + size.width - margin.right) / 2}
        y={yLabels}
        dy="2em"   
        style={{ ...axisLabelStyle, textAnchor: "middle", opacity: 1 }}
      >
        Year
      </motion.text>
    </>
  )
}

function XTick({
  tick,
  xPos,
  yPos,
  idx,
  scrollProgress,
}: {
  tick: Date
  xPos: number
  yPos: number
  idx: number
  scrollProgress: MotionValue<number>
  }) {
  const range: [number, number] = [0.3 + idx * 0.02, 0.5 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollProgress, range, [0, 1])
  
  return (
    <motion.g key={idx} style={{opacity: tickOpacity}}>
      <line
        x1={xPos}
        x2={xPos}
        y1={yPos}
        y2={yPos + 6}
        stroke={axisColor}
        strokeWidth={1}
      />
      <text
        key={idx}
        x={xPos}
        y={yPos}
        dy="1.2em"
        style={{ ...tickLabelStyle, textAnchor: "middle"}}
      >
        {d3.timeFormat("%Y")(tick)}
      </text>
    </motion.g>
  )
}

function YAxis({
  yScale,
  margin,
  ticks,
  scrollProgress,
}: {
  yScale: d3.ScaleLinear<number, number>
  margin: Margin
    ticks: number[]
  scrollProgress: MotionValue<number>
}) {
  return (
    <g transform={`translate(${margin.left},0)`}>
      {ticks.map((t, i) => (
        <YTick
          key={i}
          tick={t}
          yPos={yScale(t)}
          idx={i}
          scrollProgress={scrollProgress}
        />
      ))}
    </g>
  )
}

function YTick({
  tick,
  yPos,
  idx,
  scrollProgress,
}: {
  tick: number
  yPos: number
  idx: number
  scrollProgress: MotionValue<number>
  }) {
  const range: [number, number] = [0.3 + idx * 0.02, 0.5 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollProgress, range, [0, 1])
  
  
  return (
    <motion.g key={idx} style={{opacity: tickOpacity}}>
      <line
        x1={-6}
        x2={0}
        y1={yPos}
        y2={yPos}
        stroke={axisColor}
        strokeWidth={1}
      />
      <text
        x={-8}
        y={yPos}
        dy="0.35em"
        dx="-0.25em"
        style={{ ...tickLabelStyle, textAnchor: "end"}}
      >
        {`${tick} ft`}
      </text>
    </motion.g>
  )
}
