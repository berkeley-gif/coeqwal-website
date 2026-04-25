import React, { useEffect, useMemo, useRef, useState } from "react"
import { scaleLinear, type ScaleLinear, ticks, extent, mean } from "@repo/viz"
import { format, line, curveMonotoneX } from "@repo/viz"
import { OffWhiteColor } from "../helpers/colorPalette"
import { motion, MotionValue, useTransform } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useFetchData } from "../../hooks/useFetchData"

type Row = { Date: number; Value: number; Anomaly?: number }
type Point = { year: number; value: number }

type Margin = { top: number; right: number; bottom: number; left: number }
type ContainerSize = { width: number; height: number }

type Props = {
  scrollProgress: MotionValue<number>
  debug?: boolean
}

const defaultMargin: Margin = { top: 24, right: 24, bottom: 80, left: 100 }

function XAxis({
  size,
  xScale,
  margin,
  scrollProgress,
  ticks,
}: {
  size: ContainerSize
  xScale: ScaleLinear<number, number>
  margin: Margin
  scrollProgress: MotionValue<number>
  ticks: number[]
}) {
  const theme = useTheme()
  const y = size.height - margin.bottom

  const linePathLength = usePlayAnimationOnce(
    scrollProgress,
    [0.2, 0.4],
    [0, 1],
  )
  return (
    <>
      <g>
        {ticks.map((t, i) => (
          <XTick
            idx={i}
            key={i}
            tick={t}
            xPos={xScale(t)}
            yPos={y}
            scrollProgress={scrollProgress}
          />
        ))}
      </g>
      {/* Axis label */}
      <motion.text
        x={(margin.left + size.width - margin.right) / 2}
        y={y}
        dy="3em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.subtitle2.fontSize,
          textAnchor: "middle",
          opacity: linePathLength,
        }}
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
  tick: number
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
        stroke={OffWhiteColor}
        strokeWidth={1}
      />
      <text
        x={xPos}
        y={yPos}
        dy="1.6em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
        }}
      >
        {format("d")(tick)}
      </text>
    </motion.g>
  )
}

function YAxis({
  yScale,
  margin,
  ticks,
  scrollProgress,
  labelOffset = -80, // extra spacing for label
}: {
  yScale: ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  scrollProgress: MotionValue<number>
  labelOffset?: number
}) {
  const theme = useTheme()
  const [r0, r1] = yScale.range() as [number, number]
  const center = (r0 + r1) / 2

  const linePathLength = usePlayAnimationOnce(
    scrollProgress,
    [0.1, 0.4],
    [0, 1],
  )
  return (
    <g className="y-axis" transform={`translate(${margin.left},0)`}>
      {/* main y-axis line */}
      <motion.line
        x1={0}
        x2={0}
        y1={r0}
        y2={r1}
        stroke={OffWhiteColor}
        strokeWidth={1}
        pathLength={linePathLength}
      />

      {/* ticks */}
      {ticks.map((t, i) => (
        <YTick
          idx={i}
          key={i}
          tick={t}
          yPos={yScale(t)}
          scrollProgress={scrollProgress}
        />
      ))}

      {/* axis label */}
      <motion.text
        transform={`translate(${labelOffset},${center}) rotate(-90)`}
        textAnchor="middle"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.subtitle2.fontSize,
          opacity: linePathLength,
        }}
      >
        Temperature (°F)
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
  const range: [number, number] = [0.1 + idx * 0.02, 0.3 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollProgress, range, [0, 1])
  const theme = useTheme()

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
        stroke={OffWhiteColor}
        strokeWidth={1}
      />
      <text
        x={-8}
        y={yPos}
        dx="-0.25em"
        dy="0.35em"
        style={{ fill: OffWhiteColor, textAnchor: "end" }}
      >
        {format(".2~f")(tick)}
      </text>
    </motion.g>
  )
}

export default function TemperatureLineChart({
  scrollProgress,
  debug = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [wrapWidth, setWrapWidth] = useState<number>(800)
  const [points, setPoints] = useState<Point[]>([])

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.contentRect?.width)
          setWrapWidth(Math.max(320, e.contentRect.width))
      }
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const START_YEAR = 1960
  const END_YEAR = 2025

  useFetchData("/data/CA_historical_state_temperature.json", (rows: Row[]) => {
    const all: Point[] = rows
      .map((r) => {
        const year = Math.floor(Number(r.Date) / 100)
        const value = Number(r.Value)
        return Number.isFinite(year) && Number.isFinite(value)
          ? { year, value }
          : null
      })
      .filter((d): d is Point => !!d)
      .sort((a, b) => a.year - b.year)

    // keep only 1960-2025
    const filtered = all.filter(
      (d) => d.year >= START_YEAR && d.year <= END_YEAR,
    )
    setPoints(filtered)
  })

  const avg = useMemo(() => {
    const filtered = points.filter((d) => d.year >= 1960 && d.year <= 2025)
    return filtered.length ? mean(filtered, (d) => d.value)! : undefined
  }, [points])

  const height = 480
  const margin = defaultMargin
  const size: ContainerSize = { width: wrapWidth, height }
  const innerW = size.width - margin.left - margin.right
  const innerH = size.height - margin.top - margin.bottom

  const xScale = useMemo(() => {
    if (!points.length) return null
    return scaleLinear()
      .domain([START_YEAR, END_YEAR])
      .range([margin.left, margin.left + innerW])
  }, [points, innerW, margin.left])

  const yScale = useMemo(() => {
    if (!points.length) return null
    return scaleLinear()
      .domain(extent(points, (d) => d.value) as [number, number])
      .nice()
      .range([margin.top + innerH, margin.top])
  }, [points, innerH, margin.top])

  const xTicks = useMemo(() => {
    if (!xScale) return []
    const count = Math.min(10, Math.max(3, Math.floor(innerW / 60)))
    return ticks(START_YEAR, END_YEAR, count)
  }, [xScale, innerW])

  const yTicks = useMemo(() => {
    if (!yScale) return []
    const [y0, y1] = yScale.domain() as [number, number] // force tuple
    //const count = Math.min(8, Math.max(3, Math.floor(innerH / 40)))
    return ticks(y0, y1, 6)
  }, [yScale])

  const linePath = useMemo(() => {
    if (!xScale || !yScale) return ""
    return (
      line<Point>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))
        .curve(curveMonotoneX)(points) ?? ""
    )
  }, [points, xScale, yScale])

  const trendLinePath = useMemo(() => {
    if (!xScale || !yScale || points.length < 2) return ""

    const n = points.length
    const sumX = points.reduce((acc, d) => acc + d.year, 0)
    const sumY = points.reduce((acc, d) => acc + d.value, 0)
    const sumXY = points.reduce((acc, d) => acc + d.year * d.value, 0)
    const sumXX = points.reduce((acc, d) => acc + d.year * d.year, 0)
    const denom = n * sumXX - sumX * sumX
    if (denom === 0) return ""

    const slope = (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n

    const minYear = Math.min(...points.map((d) => d.year))
    const maxYear = Math.max(...points.map((d) => d.year))

    const trendLine = line<Point>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))

    return (
      trendLine([
        { year: minYear, value: slope * minYear + intercept },
        { year: maxYear, value: slope * maxYear + intercept },
      ]) ?? ""
    )
  }, [points, xScale, yScale])

  const pathLength = useTransform(scrollProgress, [0.3, 0.7], [0, 1])
  const historicalAvgOpacity = usePlayAnimationOnce(
    scrollProgress,
    [0.3, 0.5],
    [0, 0.6],
  )
  const historicalAvgLabelOpacity = usePlayAnimationOnce(
    scrollProgress,
    [0.3, 0.5],
    [0, 1],
  )

  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", width: "100%" }}>
        <div ref={wrapRef} style={{ flex: "0 0 90%", minWidth: 0 }}>
          <svg width={size.width} height={size.height}>
            {xScale && yScale && (
              <>
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
              </>
            )}

            {/* {linePath && (<path d={linePath} fill="none" stroke={goldenColor} strokeWidth={3} />)} */}
            {linePath && (
              <motion.path
                d={linePath}
                fill="none"
                stroke={OffWhiteColor}
                strokeWidth={3}
                pathLength={pathLength}
                transition={{ ease: "spring" }}
              />
            )}

            {debug && trendLinePath && (
              <motion.path
                d={trendLinePath}
                fill="none"
                stroke="#8EC5FF"
                strokeWidth={3}
                strokeDasharray="8,6"
                pathLength={pathLength}
                transition={{ ease: "spring" }}
              />
            )}

            {/* dashed line*/}
            {yScale && avg !== undefined && (
              <motion.line
                x1={margin.left}
                x2={size.width - margin.right}
                y1={yScale(avg)}
                y2={yScale(avg)}
                stroke={OffWhiteColor}
                strokeWidth={2}
                strokeDasharray="3,3"
                opacity={historicalAvgOpacity}
              />
            )}
          </svg>
        </div>
      </div>

      {yScale && avg !== undefined && (
        <motion.div
          style={{
            position: "absolute",
            left: "90%",
            top: `${yScale(avg)}px`, // align text with the dashed line
            transform: "translateY(-50%)",
            color: OffWhiteColor,
            opacity: historicalAvgLabelOpacity,
          }}
        >
          <Typography variant="subtitle2">
            {START_YEAR}
            {"\u2014"}
            {END_YEAR}
          </Typography>
          <Typography variant="subtitle2">Historical average</Typography>
          <Typography variant="subtitle2">{format(".1f")(avg)} °F</Typography>
        </motion.div>
      )}
    </Box>
  )
}
