import React, { useEffect, useId, useMemo, useRef, useState } from "react"
import { scaleLinear, line, area, type ScaleLinear } from "@repo/viz"
import {
  min,
  max,
  scaleTime,
  curveLinear,
  timeFormat,
  type ScaleTime,
} from "@repo/viz"
import { OffWhiteColor } from "../helpers/colorPalette"
import { motion, MotionValue, useTransform } from "@repo/motion"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useTheme } from "@repo/ui/mui"
import { useFetchData } from "../../hooks/useFetchData"

export type ContainerSize = { width: number; height: number }

export type GroundwaterRow = {
  msmt_date: string
  gse_gwe: number
  date?: Date // assumed parsed upstream
}

type GroundwaterJsonRow = {
  Year: number
  "GW Change": number
}

type Margin = { top: number; right: number; bottom: number; left: number }
const margin: Margin = { top: 64, right: 24, bottom: 50, left: 150 }
const axisColor = "#fcfbfa"

// --------------------------------------------
// Define drought bands (edit these dates)
// --------------------------------------------
const DROUGHT_BANDS: Array<{ start: Date; end: Date; opacity?: number }> = [
  { start: new Date("1971-01-01"), end: new Date("1977-01-01"), opacity: 0.22 },
  { start: new Date("1983-01-01"), end: new Date("1992-06-01"), opacity: 0.22 },
  { start: new Date("1999-01-01"), end: new Date("2007-06-01"), opacity: 0.22 },
]

type Props = {
  scrollProgress: MotionValue<number>
  debug?: boolean
}

export default function GroundwaterLine({
  scrollProgress,
  debug = false,
}: Props) {
  const revealClipId = useId().replace(/:/g, "")
  const [data, setData] = useState<GroundwaterRow[]>([])
  const [yExtents, setYExtents] = useState<[number, number]>([0, 0])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

  useFetchData(
    "/data/combined_groundwater.json",
    (raw: GroundwaterJsonRow[]) => {
      const processed: GroundwaterRow[] = raw
        .map((d) => {
          const year = Number(d.Year)
          const gwRaw = Number(d["GW Change"])
          const gwDepth = Number.isFinite(gwRaw) && gwRaw < 0 ? -gwRaw : gwRaw

          return {
            msmt_date: `${year}-01-01`,
            date: new Date(year, 0, 1),
            gse_gwe: gwDepth,
          }
        })
        .filter(
          (d) =>
            Number.isFinite(d.gse_gwe) &&
            d.date instanceof Date &&
            !Number.isNaN(d.date.getTime()),
        )

      setData(processed)
      const values = processed.map((r) => r.gse_gwe)
      const minVal = 0
      const maxVal = max(values) ?? 0
      const pad = maxVal * 0.05 || 1
      setYExtents([minVal, maxVal + pad])
    },
  )

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
    const minDate = min(data, (d) => d.date!) ?? new Date()
    const maxDate = max(data, (d) => d.date!) ?? new Date()
    return scaleTime()
      .domain([minDate, maxDate])
      .range([margin.left, Math.max(margin.left, size.width - margin.right)])
  }, [data, size.width])

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain(yExtents)
      .range([margin.top, Math.max(margin.top, size.height - margin.bottom)]) // reversed
      .nice()
  }, [yExtents, size.height])

  const linePath = useMemo(() => {
    const lineGen = line<GroundwaterRow>()
      .x((d) => xScale(d.date!))
      .y((d) => yScale(d.gse_gwe))
      .curve(curveLinear)
    return lineGen(data) ?? ""
  }, [data, xScale, yScale])

  const areaPath = useMemo(() => {
    const areaGen = area<GroundwaterRow>()
      .x((d) => xScale(d.date!))
      .y0(yScale(yExtents[1])) // fill down to bottom of chart
      .y1((d) => yScale(d.gse_gwe))
      .curve(curveLinear)
    return areaGen(data) ?? ""
  }, [data, xScale, yScale, yExtents])

  const groundwaterTrendPath = useMemo(() => {
    const points = data
      .filter(
        (d): d is GroundwaterRow & { date: Date } =>
          d.date instanceof Date &&
          !Number.isNaN(d.date.getTime()) &&
          Number.isFinite(d.gse_gwe),
      )
      .map((d) => ({
        x: d.date.getTime(),
        date: d.date,
        value: d.gse_gwe,
      }))

    if (points.length < 2) return ""

    const n = points.length
    const sumX = points.reduce((acc, d) => acc + d.x, 0)
    const sumY = points.reduce((acc, d) => acc + d.value, 0)
    const sumXY = points.reduce((acc, d) => acc + d.x * d.value, 0)
    const sumXX = points.reduce((acc, d) => acc + d.x * d.x, 0)
    const denom = n * sumXX - sumX * sumX
    if (denom === 0) return ""

    const slope = (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n

    const minDate = points.reduce((minP, p) => (p.x < minP.x ? p : minP)).date
    const maxDate = points.reduce((maxP, p) => (p.x > maxP.x ? p : maxP)).date

    const trendLine = line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))

    return (
      trendLine([
        {
          date: minDate,
          value: slope * minDate.getTime() + intercept,
        },
        {
          date: maxDate,
          value: slope * maxDate.getTime() + intercept,
        },
      ]) ?? ""
    )
  }, [data, xScale, yScale])

  const xTicks = useMemo(() => xScale.ticks(6), [xScale])
  const yTicks = useMemo(() => yScale.ticks(3), [yScale])

  const plotWidth = Math.max(0, size.width - margin.left - margin.right)
  const plotHeight = Math.max(0, size.height - margin.top - margin.bottom)
  const chartRevealProgress = usePlayAnimationOnce(
    scrollProgress,
    [0.5, 0.7],
    [0, 1],
  )
  const chartRevealWidth = useTransform(
    chartRevealProgress,
    [0, 1],
    [0, plotWidth],
  )
  const trendPathLength = usePlayAnimationOnce(
    scrollProgress,
    [0.5, 0.7],
    [0, 1],
  )
  const trendOpacity = usePlayAnimationOnce(
    scrollProgress,
    [0.5, 0.7],
    [0, 0.9],
  )

  return (
    <svg ref={svgRef} width="100%" height="100%">
      <defs>
        <clipPath id={revealClipId}>
          <motion.rect
            x={margin.left}
            y={margin.top}
            width={chartRevealWidth}
            height={plotHeight}
          />
        </clipPath>
      </defs>

      {/* Axes */}
      <XAxis
        size={size}
        xScale={xScale}
        yPos={yScale(yExtents[1])}
        margin={margin}
        ticks={xTicks}
        scrollProgress={scrollProgress}
      />
      <YAxis
        yScale={yScale}
        margin={margin}
        ticks={yTicks}
        scrollProgress={scrollProgress}
      />

      {/* Area under line (light blue) */}
      <g clipPath={`url(#${revealClipId})`}>
        <path d={areaPath} fill="#115EB6" />
        {/* Golden line on top */}
        <path d={linePath} fill="none" stroke="#0c498fff" strokeWidth={3} />
        {debug && groundwaterTrendPath && (
          <motion.path
            d={groundwaterTrendPath}
            fill="none"
            stroke="#8EC5FF"
            strokeWidth={3}
            strokeDasharray="8 6"
            pathLength={trendPathLength}
            style={{ opacity: trendOpacity }}
          />
        )}
      </g>

      {/* --- Gray shaded drought bands (behind) --- */}
      <g clipPath={`url(#${revealClipId})`} pointerEvents="none">
        {DROUGHT_BANDS.map((b, i) => {
          const x0 = xScale(b.start)
          const x1 = xScale(b.end)
          return (
            <rect
              key={i}
              x={Math.min(x0, x1)}
              y={margin.top}
              width={Math.max(0, Math.abs(x1 - x0))}
              height={yScale(yExtents[1]) - margin.top}
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
  yPos,
  margin,
  ticks,
  scrollProgress,
}: {
  size: ContainerSize
  xScale: ScaleTime<number, number>
  yPos: number
  margin: Margin
  ticks: Date[]
  scrollProgress: MotionValue<number>
}) {
  const theme = useTheme()
  // x-axis line is drawn at the TOP of the plot area
  const yLine = margin.top
  const yLabels = yPos

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
        dy="50"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.subtitle2.fontSize,
          textAnchor: "middle",
          opacity: 1,
        }}
      >
        Year
      </motion.text>
      <motion.text
        x={(margin.left + size.width - margin.right) / 2}
        y={yLine}
        dy="-1em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
          opacity: 0.5,
        }}
      >
        Grayed area = drought period
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
  const theme = useTheme()
  const range: [number, number] = [0.3 + idx * 0.02, 0.5 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollProgress, range, [0, 1])

  return (
    <motion.g key={idx} style={{ opacity: tickOpacity }}>
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
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
        }}
      >
        {timeFormat("%Y")(tick)}
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
  yScale: ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  scrollProgress: MotionValue<number>
}) {
  const theme = useTheme()
  const annotationOpacity = usePlayAnimationOnce(
    scrollProgress,
    [0.4, 0.6],
    [0, 1],
  )

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

      <motion.text
        x={0}
        y={yScale(50)}
        dx="-5em"
        dy="0.3em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
          opacity: annotationOpacity,
        }}
      >
        Cumulative
      </motion.text>
      <motion.text
        x={0}
        y={yScale(50)}
        dx="-5em"
        dy="1.5em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
          opacity: annotationOpacity,
        }}
      >
        groundwater
      </motion.text>
      <motion.text
        x={0}
        y={yScale(50)}
        dx="-5em"
        dy="2.7em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
          opacity: annotationOpacity,
        }}
      >
        loss (km³)
      </motion.text>
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
  const theme = useTheme()
  const range: [number, number] = [0.3 + idx * 0.02, 0.5 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollProgress, range, [0, 1])

  return (
    <motion.g
      key={idx}
      style={{
        opacity: tickOpacity,
        fontSize: theme.typography.caption.fontSize,
        fill: OffWhiteColor,
      }}
    >
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
        style={{ fill: OffWhiteColor, textAnchor: "end" }}
      >
        {`${tick}`}
      </text>
    </motion.g>
  )
}
