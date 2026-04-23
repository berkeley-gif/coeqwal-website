"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  curveMonotoneX,
  format,
  line,
  max,
  scaleLinear,
  type ScaleLinear,
} from "@repo/viz"
import { motion, MotionValue } from "@repo/motion"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { Box, useTheme } from "@repo/ui/mui"
import { useFetchData } from "../../hooks/useFetchData"
import { OffWhiteColor } from "../helpers/colorPalette"

type SweRecord = {
  water_year: number
  month: string
  month_num: number
  value: number
}

type SweData = {
  metadata?: {
    units?: string
    month_order?: string[]
  }
  records: SweRecord[]
}

type Point = { x: number; y: number }
type Margin = { top: number; right: number; bottom: number; left: number }
type ContainerSize = { width: number; height: number }

type Props = {
  scrollYProgress: MotionValue<number>
  selectedMonth: number
}

const defaultMargin: Margin = { top: 50, right: 30, bottom: 70, left: 100 }
const monthLabels = [
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
]
const monthLabelsFull = [
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
]
const monthOrder = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const sweLineColor = "#ffb347"

function getSeriesLabel(year: number) {
  if (year === 2015) return "Dry year \u2013 2015"
  if (year === 2023) return "Wet year \u2013 2023"
  return `${year}`
}

function isDryYear(year: number) {
  return year === 2015
}

function monthIndexFromNum(monthNum: number) {
  return monthOrder.indexOf(monthNum)
}

export default function SWECurve({ scrollYProgress, selectedMonth }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [wrapWidth, setWrapWidth] = useState<number>(800)
  const [records, setRecords] = useState<SweRecord[]>([])
  const theme = useTheme()

  const handleData = useCallback((data: SweData) => {
    setRecords(Array.isArray(data.records) ? data.records : [])
  }, [])

  useFetchData("/data/swe_multiline.json", handleData)

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect?.width) {
          setWrapWidth(Math.max(320, entry.contentRect.width))
        }
      }
    })

    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const height = 350
  const margin = defaultMargin
  const size: ContainerSize = { width: wrapWidth, height }
  const innerW = size.width - margin.left - margin.right
  const innerH = size.height - margin.top - margin.bottom

  const years = useMemo(() => {
    return Array.from(new Set(records.map((d) => d.water_year))).sort(
      (a, b) => a - b,
    )
  }, [records])

  const groupedPoints = useMemo(() => {
    return years.map((year) => {
      const points: Point[] = records
        .filter((record) => record.water_year === year)
        .map((record) => ({
          x: monthIndexFromNum(record.month_num),
          y: Number(record.value),
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        .sort((a, b) => a.x - b.x)

      return { year, points }
    })
  }, [records, years])

  const yMax = useMemo(() => {
    const values = records
      .map((record) => Number(record.value))
      .filter((value) => Number.isFinite(value))
    return max(values) ?? 0
  }, [records])

  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([-0.5, monthLabels.length - 1 + 0.5])
      .range([margin.left, margin.left + innerW])
  }, [innerW, margin.left])

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, yMax > 0 ? yMax : 1])
      .nice()
      .range([margin.top + innerH, margin.top])
  }, [innerH, margin.top, yMax])

  const lineReveal = usePlayAnimationOnce(scrollYProgress, [0.55, 0.75], [0, 1])
  const selectedMonthReveal = usePlayAnimationOnce(
    scrollYProgress,
    [0.6, 0.78],
    [0, 1],
  )
  const selectedMonthOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.65, 0.78],
    [0, 1],
  )
  const labelOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.55, 0.7],
    [0, 1],
  )
  const selectedMonthX = xScale(selectedMonth)

  const selectedDryValue = useMemo(() => {
    const drySeries = groupedPoints.find((series) => series.year === 2015)
    return drySeries?.points[selectedMonth]?.y
  }, [groupedPoints, selectedMonth])

  const selectedWetValue = useMemo(() => {
    const wetSeries = groupedPoints.find((series) => series.year === 2023)
    return wetSeries?.points[selectedMonth]?.y
  }, [groupedPoints, selectedMonth])

  const selectedDifference =
    selectedWetValue !== undefined && selectedDryValue !== undefined
      ? selectedWetValue - selectedDryValue
      : undefined

  return (
    <Box
      ref={wrapRef}
      sx={{
        width: "100%",
        height: `${height}px`,
        paddingTop: "15px",
        typography: "caption",
      }}
    >
      <svg width={size.width} height={size.height}>
        <XAxis size={size} xScale={xScale} scrollYProgress={scrollYProgress} />
        <YAxis yScale={yScale} scrollYProgress={scrollYProgress} />
        <Legend
          years={years}
          width={size.width}
          scrollYProgress={scrollYProgress}
        />

        {selectedDryValue !== undefined && selectedWetValue !== undefined && (
          <motion.text
            x={(margin.left + size.width - margin.right) / 2}
            y={margin.top - 24}
            textAnchor="middle"
            style={{
              fill: OffWhiteColor,
              fontSize: theme.typography.caption.fontSize,
              opacity: labelOpacity,
            }}
          >
            <tspan>{`${monthLabelsFull[selectedMonth] ?? "Selected month"} \u2013 `}</tspan>
            <tspan style={{ fontWeight: 700 }}>2015</tspan>
            <tspan>{` = ${format(".1f")(selectedDryValue)} in, `}</tspan>
            <tspan style={{ fontWeight: 700 }}>2023</tspan>
            <tspan>{` = ${format(".1f")(selectedWetValue)} in, difference = `}</tspan>
            <tspan style={{ fill: sweLineColor, fontWeight: 700 }}>
              {`${format("+.1f")(selectedDifference ?? 0)} in`}
            </tspan>
          </motion.text>
        )}

        <g>
          {groupedPoints.map((series) => {
            const path = line<Point>()
              .x((d) => xScale(d.x))
              .y((d) => yScale(d.y))
              .curve(curveMonotoneX)(series.points)

            if (!path) return null

            const lastPoint = series.points[series.points.length - 1]
            const labelY = lastPoint ? yScale(lastPoint.y) : margin.top
            const dryYear = isDryYear(series.year)

            return (
              <g key={series.year}>
                <motion.path
                  d={path}
                  fill="none"
                  stroke={sweLineColor}
                  strokeWidth={dryYear ? 2 : 4}
                  pathLength={lineReveal}
                  style={{ opacity: dryYear ? 0.7 : lineReveal }}
                />
                {lastPoint && (
                  <motion.text
                    x={xScale(monthLabels.length - 0.1)}
                    y={labelY}
                    dx="0.5em"
                    dy="0.35em"
                    style={{
                      fill: sweLineColor,
                      fontSize: theme.typography.caption.fontSize,
                      opacity: labelOpacity,
                    }}
                  >
                    {getSeriesLabel(series.year)}
                  </motion.text>
                )}
              </g>
            )
          })}
        </g>

        <motion.line
          x1={selectedMonthX}
          x2={selectedMonthX}
          y1={margin.top}
          y2={size.height - margin.bottom}
          stroke={OffWhiteColor}
          strokeWidth={1}
          strokeDasharray="2 3"
          style={{ opacity: selectedMonthReveal }}
        />

        {selectedDryValue !== undefined && selectedWetValue !== undefined && (
          <motion.line
            x1={selectedMonthX}
            x2={selectedMonthX}
            y1={yScale(selectedDryValue)}
            y2={yScale(selectedWetValue)}
            stroke={sweLineColor}
            strokeWidth={2}
            style={{ opacity: selectedMonthOpacity }}
          />
        )}

        {Number.isInteger(selectedMonth) &&
          groupedPoints.map((series) => {
            const dryYear = isDryYear(series.year)
            const selectedValue = series.points[selectedMonth]?.y
            if (selectedValue === undefined) return null

            return (
              <motion.circle
                key={`marker-${series.year}`}
                cx={selectedMonthX}
                cy={yScale(selectedValue)}
                r={4}
                fill={dryYear ? "none" : sweLineColor}
                stroke={sweLineColor}
                strokeWidth={dryYear ? 2 : 1.5}
                style={{ opacity: selectedMonthOpacity }}
              />
            )
          })}
      </svg>
    </Box>
  )
}

function Legend({
  years,
  width,
  scrollYProgress,
}: {
  years: number[]
  width: number
  scrollYProgress: MotionValue<number>
}) {
  const legendX = Math.max(
    defaultMargin.left + 12,
    width - defaultMargin.right - 170,
  )
  const legendY = defaultMargin.top - 12

  return (
    <g transform={`translate(${legendX},${legendY})`}>
      {years.map((year, index) => (
        <LegendItem
          key={year}
          year={year}
          index={index}
          scrollYProgress={scrollYProgress}
        />
      ))}
    </g>
  )
}

function LegendItem({
  year,
  index,
  scrollYProgress,
}: {
  year: number
  index: number
  scrollYProgress: MotionValue<number>
}) {
  const theme = useTheme()
  const range: [number, number] = [0.45 + index * 0.04, 0.65 + index * 0.04]
  const legendOpacity = usePlayAnimationOnce(scrollYProgress, range, [0, 1])

  return (
    <motion.g
      transform={`translate(0,${index * 22})`}
      style={{ opacity: legendOpacity }}
    >
      <line
        x1={0}
        x2={18}
        y1={0}
        y2={0}
        stroke={sweLineColor}
        strokeWidth={isDryYear(year) ? 2 : 4}
        strokeOpacity={isDryYear(year) ? 0.7 : 1}
      />
      <text
        x={26}
        y={0}
        dy="0.35em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
        }}
      >
        {getSeriesLabel(year)}
      </text>
    </motion.g>
  )
}

function XAxis({
  size,
  xScale,
  scrollYProgress,
}: {
  size: ContainerSize
  xScale: ScaleLinear<number, number>
  scrollYProgress: MotionValue<number>
}) {
  const y = size.height - defaultMargin.bottom

  return (
    <>
      <g>
        {monthLabels.map((tick, i) => (
          <XTick
            idx={i}
            key={tick}
            tick={tick}
            xPos={xScale(i)}
            yPos={y}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </g>
    </>
  )
}

function XTick({
  tick,
  xPos,
  yPos,
  idx,
  scrollYProgress,
}: {
  tick: string
  xPos: number
  yPos: number
  idx: number
  scrollYProgress: MotionValue<number>
}) {
  const theme = useTheme()
  const range: [number, number] = [0.3 + idx * 0.02, 0.5 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollYProgress, range, [0, 1])

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
        {tick}
      </text>
    </motion.g>
  )
}

function YAxis({
  yScale,
  scrollYProgress,
}: {
  yScale: ScaleLinear<number, number>
  scrollYProgress: MotionValue<number>
}) {
  const theme = useTheme()
  const [_, r1] = yScale.range() as [number, number]
  const linePathLength = usePlayAnimationOnce(
    scrollYProgress,
    [0.1, 0.4],
    [0, 1],
  )

  return (
    <g className="y-axis" transform={`translate(${defaultMargin.left},0)`}>
      {yScale.ticks(4).map((tick, index) => (
        <YTick
          key={index}
          tick={tick}
          yPos={yScale(tick)}
          idx={index}
          scrollYProgress={scrollYProgress}
        />
      ))}

      <motion.text
        transform={`translate(${0},${r1})`}
        textAnchor="middle"
        dy="-1.5em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.subtitle2.fontSize,
          opacity: linePathLength,
        }}
      >
        Snow Water Equivalent (in.)
      </motion.text>
    </g>
  )
}

function YTick({
  tick,
  yPos,
  idx,
  scrollYProgress,
}: {
  tick: number
  yPos: number
  idx: number
  scrollYProgress: MotionValue<number>
}) {
  const range: [number, number] = [0.1 + idx * 0.02, 0.3 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollYProgress, range, [0, 1])
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
        {`${format(".1f")(tick)} in.`}
      </text>
    </motion.g>
  )
}
