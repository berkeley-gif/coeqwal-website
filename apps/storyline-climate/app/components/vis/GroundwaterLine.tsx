import React, { useEffect, useMemo, useRef, useState } from "react"
import { scaleLinear, line, area, type ScaleLinear } from "@repo/viz"
import {
  min,
  max,
  scaleTime,
  curveLinear,
  bisector,
  timeFormat,
  type ScaleTime,
} from "@repo/viz"
import { csv, autoType } from "@repo/viz"
import { OffWhiteColor } from "../helpers/colorPalette"
import { motion, MotionValue } from "@repo/motion"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useTheme } from "@repo/ui/mui"

export type ContainerSize = { width: number; height: number }

export type GroundwaterRow = {
  msmt_date: string
  gse_gwe: number
  date?: Date // assumed parsed upstream
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

type Props = { scrollProgress: MotionValue<number> }

export default function GroundwaterLine({ scrollProgress }: Props) {
  const theme = useTheme()
  const [data, setData] = useState<GroundwaterRow[]>([])
  const [yExtents, setYExtents] = useState<[number, number]>([0, 0])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

  useEffect(() => {
    let cancelled = false

    csv("./data/combined_groundwater.csv", autoType).then((raw) => {
      if (cancelled) return

      const processed: GroundwaterRow[] = raw
        .map((d: any) => {
          const year = Number(d["Year"])
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
    })

    return () => {
      cancelled = true
    }
  }, [])

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

  const xTicks = useMemo(() => xScale.ticks(6), [xScale])
  const yTicks = useMemo(() => yScale.ticks(3), [yScale])

  const plotWidth = Math.max(0, size.width - margin.left - margin.right)
  const plotHeight = Math.max(0, size.height - margin.top - margin.bottom)

  // setting the charge labels below the water curve
  const RECHARGE_LABELS = ["1st recharge", "2nd recharge"]
  const rechargeGaps = useMemo(() => {
    if (DROUGHT_BANDS.length < 2 || data.length === 0) return []

    const bisectDate = bisector<GroundwaterRow, Date>((d) => d.date!).center

    return DROUGHT_BANDS.slice(0, -1)
      .map((b, i) => {
        const next = DROUGHT_BANDS[i + 1]
        if (!next) return null

        // 1) midpoint time between drought bands
        const midTime = new Date((b.end.getTime() + next.start.getTime()) / 2)
        // 2) x position
        const x = xScale(midTime)
        // 3) find closest index (may be out of bounds)
        let idx = bisectDate(data, midTime)
        // clamp index safely
        idx = Math.max(0, Math.min(data.length - 1, idx))
        const closestDatum = data[idx]
        if (!closestDatum) return null // extra safety
        // 4) y position below the curve
        const yOnCurve = yScale(closestDatum.gse_gwe)
        const y = Math.min(
          margin.top + plotHeight - 10, // keep inside plot
          yOnCurve + 28, // below curve
        )
        const [line1, line2] = (
          RECHARGE_LABELS[i] ?? `Recharge ${i + 1}`
        ).split(" ")
        return {
          x,
          y,
          line1,
          line2,
        }
      })
      .filter(Boolean) as Array<{
      x: number
      y: number
      line1: string
      line2: string
    }>
  }, [xScale, yScale, data, plotHeight])

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
      <XAxis
        size={size}
        xScale={xScale}
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
      {/* Recharge labels placed below curve */}
      <g clipPath="url(#plot-clip)" pointerEvents="none">
        {rechargeGaps.map((g, i) => (
          <text
            key={i}
            x={g.x}
            y={g.y}
            textAnchor="middle"
            style={{
              fill: OffWhiteColor,
              fontSize: theme.typography.caption.fontSize,
              opacity: 0.9,
            }}
          >
            <tspan x={g.x} dy="0em">
              {g.line1}
            </tspan>
            <tspan x={g.x} dy="1.2em">
              {g.line2}
            </tspan>
          </text>
        ))}
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
  xScale: ScaleTime<number, number>
  margin: Margin
  ticks: Date[]
  scrollProgress: MotionValue<number>
}) {
  const theme = useTheme()
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
