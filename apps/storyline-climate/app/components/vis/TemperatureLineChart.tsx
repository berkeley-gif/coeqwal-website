import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import { FreshWaterColor } from "../helpers/colorPalette"

type Row = { Date: string; Value: string }
type Point = { year: number; value: number }

type Margin = { top: number; right: number; bottom: number; left: number }
type ContainerSize = { width: number; height: number }

const defaultMargin: Margin = { top: 24, right: 24, bottom: 54, left: 84 }
const goldenColor = "#F1B143"
const axisColor = "#f2f0ef" // axis stroke; you can switch to "white" if you prefer

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
                style={{ textAnchor: "middle", fill: "white" }}
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
        dy="2em"
        style={{ textAnchor: "middle", fill: "white" }}
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
  labelOffset = -60, // extra spacing for label
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
            style={{ textAnchor: "end", fill: "white" }}
          >
            {d3.format(".2~f")(t)}
          </text>
        </g>
      ))}

      {/* axis label */}
      <text
        transform={`translate(${labelOffset},${center}) rotate(-90)`}
        textAnchor="middle"
        style={{ fill: "white" }}
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

  // responsive width
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
      const data: Point[] = rows
        .map((r) => {
          const year = Math.floor(Number(r.Date) / 100) // e.g., 189512 -> 1895
          const value = Number(r.Value)
          return Number.isFinite(year) && Number.isFinite(value)
            ? { year, value }
            : null
        })
        .filter((d): d is Point => !!d)
        .sort((a, b) => a.year - b.year)

      setPoints(data)
    })()
  }, [])

  const height = 420
  const margin = defaultMargin
  const size: ContainerSize = { width: wrapWidth, height }
  const innerW = size.width - margin.left - margin.right
  const innerH = size.height - margin.top - margin.bottom

  const xScale = useMemo(() => {
    if (!points.length) return null
    return d3
      .scaleLinear()
      .domain(d3.extent(points, (d) => d.year) as [number, number])
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

  // ticks (as arrays) for your axis components
  const xTicks = useMemo(() => {
    if (!xScale) return []
    const [d0, d1] = xScale.domain() as [number, number]
    const count = Math.min(10, Math.max(3, Math.floor(innerW / 60)))
    return d3.ticks(d0, d1, count)
  }, [xScale, innerW])

  const yTicks = useMemo(() => {
    if (!yScale) return []
    const [y0, y1] = yScale.domain() as [number, number] // force tuple
    const count = Math.min(8, Math.max(3, Math.floor(innerH / 40)))
    return d3.ticks(y0, y1, count)
  }, [yScale, innerH])

  // line path
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
    <div ref={wrapRef} style={{ width: "100%" }}>
      <svg width={size.width} height={size.height}>
        {/* axes */}
        {xScale && yScale && (
          <>
            <XAxis size={size} xScale={xScale} margin={margin} ticks={xTicks} />
            <YAxis yScale={yScale} margin={margin} ticks={yTicks} />
          </>
        )}

        {/* main line */}
        {linePath && (
          <path d={linePath} fill="none" stroke={goldenColor} strokeWidth={3} />
        )}

        {/* dashed reference line at 57.8°F */}
        {yScale && (
          <>
            <line
              x1={margin.left}
              x2={size.width - margin.right}
              y1={yScale(57.8)}
              y2={yScale(57.8)}
              stroke="white"
              strokeWidth={2}
              strokeDasharray="6,6"
              opacity={0.6}
            />
            <text
              x={margin.left + 190}
              y={yScale(57.8)}
              dy={-8} // 8px above the dashed line
              textAnchor="end"
              style={{
                fill: "white",
                fontSize: 14,
                strokeWidth: 2,
              }}
            >
              Average temperature: 57.8 °F
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
