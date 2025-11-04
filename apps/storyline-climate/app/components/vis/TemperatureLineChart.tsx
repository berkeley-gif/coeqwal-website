import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import { OffWhiteColor } from "../helpers/colorPalette"
import { motion } from "framer-motion"

type Row = { Date: string; Value: string }
type Point = { year: number; value: number }

type Margin = { top: number; right: number; bottom: number; left: number }
type ContainerSize = { width: number; height: number }

const defaultMargin: Margin = { top: 24, right: 24, bottom: 74, left: 100 }
const axisColor = OffWhiteColor
// consistent font styling for all axis and label text
const labelStyle: React.CSSProperties = {
  fontSize: "15px",
  fill: OffWhiteColor,
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
        {ticks.map((t, i) => {
          const x = xScale(t)
          return (
            <g key={i}>
              {/* tick mark */}
              <line
                x1={x}
                x2={x}
                y1={y}
                y2={y + 6}
                stroke={axisColor}
                strokeWidth={1}
              />
              {/* tick label */}
              <text
                x={x}
                y={y}
                dy="1.6em"
                style={{ ...labelStyle, textAnchor: "middle" }}
              >
                {d3.format("d")(t)}
              </text>
            </g>
          )
        })}
      </g>
      {/* Axis label */}
      <text
        x={(margin.left + size.width - margin.right) / 2}
        y={y}
        dy="4em"
        style={{ ...labelStyle, textAnchor: "middle" }}
      >
        Year
      </text>
    </>
  )
}

function YAxis({
  yScale,
  margin,
  ticks,
  labelOffset = -80, // extra spacing for label
}: {
  yScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  labelOffset?: number
}) {
  const [r0, r1] = yScale.range() as [number, number]
  const center = (r0 + r1) / 2

  return (
    <g className="y-axis" transform={`translate(${margin.left},0)`}>
      {/* main y-axis line */}
      <line x1={0} x2={0} y1={r0} y2={r1} stroke={axisColor} strokeWidth={1} />

      {/* ticks */}
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
            style={{ ...labelStyle, textAnchor: "end" }}
          >
            {d3.format(".2~f")(t)}
          </text>
        </g>
      ))}

      {/* axis label */}
      <text
        transform={`translate(${labelOffset},${center}) rotate(-90)`}
        textAnchor="middle"
        style={labelStyle}
      >
        Temperature (°F)
      </text>
    </g>
  )
}

export default function TemperatureLineChart() {
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

  useEffect(() => {
    ;(async () => {
      const txt = await (
        await fetch("/data/CA_historical_state_temperature.csv")
      ).text()
      const cleaned = txt
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.startsWith("#"))
        .join("\n")
      const rows = d3.csvParse(cleaned) as Row[]

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

      // keep only 1960–2025
      const filtered = all.filter(
        (d) => d.year >= START_YEAR && d.year <= END_YEAR,
      )
      setPoints(filtered)
    })()
  }, [])

  const avg = useMemo(() => {
    const filtered = points.filter((d) => d.year >= 1960 && d.year <= 2025)
    return filtered.length ? d3.mean(filtered, (d) => d.value)! : undefined
  }, [points])

  const height = 480
  const margin = defaultMargin
  const size: ContainerSize = { width: wrapWidth, height }
  const innerW = size.width - margin.left - margin.right
  const innerH = size.height - margin.top - margin.bottom

  const xScale = useMemo(() => {
    if (!points.length) return null
    return d3
      .scaleLinear()
      .domain([START_YEAR, END_YEAR])
      .range([margin.left, margin.left + innerW])
  }, [points, innerW, margin.left])

  const yScale = useMemo(() => {
    if (!points.length) return null
    return d3
      .scaleLinear()
      .domain(d3.extent(points, (d) => d.value) as [number, number])
      .nice()
      .range([margin.top + innerH, margin.top])
  }, [points, innerH, margin.top])

  const xTicks = useMemo(() => {
    if (!xScale) return []
    const count = Math.min(10, Math.max(3, Math.floor(innerW / 60)))
    return d3.ticks(START_YEAR, END_YEAR, count)
  }, [xScale, innerW])

  const yTicks = useMemo(() => {
    if (!yScale) return []
    const [y0, y1] = yScale.domain() as [number, number] // force tuple
    const count = Math.min(8, Math.max(3, Math.floor(innerH / 40)))
    return d3.ticks(y0, y1, count)
  }, [yScale, innerH])

  const linePath = useMemo(() => {
    if (!xScale || !yScale) return ""
    return (
      d3
        .line<Point>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX)(points) ?? ""
    )
  }, [points, xScale, yScale])

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
        <div ref={wrapRef} style={{ flex: "0 0 85%", minWidth: 0 }}>
          <svg
            width={size.width}
            height={size.height}
            style={{ display: "block" }}
          >
            {xScale && yScale && (
              <>
                <XAxis
                  size={size}
                  xScale={xScale}
                  margin={margin}
                  ticks={xTicks}
                />
                <YAxis yScale={yScale} margin={margin} ticks={yTicks} />
              </>
            )}

            {/* {linePath && (<path d={linePath} fill="none" stroke={goldenColor} strokeWidth={3} />)} */}
            {linePath && (
              <motion.path
                d={linePath}
                fill="none"
                stroke={OffWhiteColor}
                strokeWidth={3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 8, ease: "easeInOut" }}
              />
            )}

            {/* dashed line*/}
            {yScale && avg !== undefined && (
              <line
                x1={margin.left}
                x2={size.width - margin.right}
                y1={yScale(avg)}
                y2={yScale(avg)}
                stroke={OffWhiteColor}
                strokeWidth={2}
                strokeDasharray="6,6"
                opacity={0.6}
              />
            )}
          </svg>
        </div>
      </div>

      {yScale && avg !== undefined && (
        <div
          style={{
            position: "absolute",
            left: "85%",
            top: `${yScale(avg)}px`, // align text with the dashed line
            transform: "translateY(-50%)",
            color: OffWhiteColor,
            fontSize: 13,
          }}
        >
          <div>
            Average temperature {START_YEAR}–{END_YEAR}:
          </div>
          <div>{d3.format(".1f")(avg)} °F</div>
        </div>
      )}
    </div>
  )
}
