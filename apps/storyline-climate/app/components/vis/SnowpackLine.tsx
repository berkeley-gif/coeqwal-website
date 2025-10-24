import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import type { ContainerSize } from "./Snowpack"
import { SnowWaterColor,OffWhiteColor, OceanWaterColor } from "../helpers/colorPalette"
import { useLayoutEffect } from "react"

export type SnowRow = {
  year: number
  "CanESM2 (Average)": number | null
  // Observed removed from usage (can be omitted in your data load too)
}
type Margin = { top: number; right: number; bottom: number; left: number }
const margin: Margin = { top: 24, right: 0, bottom: 64, left: 0 }
const axisColor = OffWhiteColor
const goldenColor = "#F1B143" // yellow

const labelStyle: React.CSSProperties = {
  fontSize: "15px",
  fill: OffWhiteColor,
};

type Props = {
  data: SnowRow[]
  yExtents: [number, number]
}

export default function SnowpackLine({ data, yExtents }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

  //before 2050
  const filteredData = useMemo(() => data.filter((d) => d.year <= 2050), [data])

  const xAxisRef = useRef<SVGGElement | null>(null)
  const [extraBottom, setExtraBottom] = useState(0)
  const yAxisRef = useRef<SVGGElement | null>(null)
  const [extraLeft, setExtraLeft] = useState(0)
  const safeMargin = useMemo<Margin>(
    () => ({
      ...margin,
      left:  margin.left  + extraLeft,
      bottom: margin.bottom + extraBottom, // from your X-axis fix
    }),
    [extraLeft, extraBottom, margin.left, margin.bottom]
  )
  const years = useMemo(() => filteredData.map(d => d.year), [filteredData])
  const xScale = useMemo(() => {
    const minY = d3.min(years) ?? 0
    const maxY = 2050
    const pad = 3
    return d3.scaleLinear()
      .domain([minY - pad, maxY + pad])
      .range([safeMargin.left, size.width - safeMargin.right])
      .clamp(true)
  }, [years, size.width, safeMargin.left, safeMargin.right])

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain(yExtents)
      .range([size.height - safeMargin.bottom, safeMargin.top])
      .nice()
  }, [yExtents, size.height, safeMargin.bottom, safeMargin.top])

  const snowPath = useMemo(() => {
    const line = d3
      .line<SnowRow>()
      .defined((d) => d["CanESM2 (Average)"] != null)
      .x((d) => xScale(d.year))
      .y((d) => yScale(d["CanESM2 (Average)"] as number))
      // .curve(d3.curveLinear) // .curve(d3.curveMonotoneX)
    return line(filteredData) ?? ""
  }, [filteredData, xScale, yScale])

  const snowArea = useMemo(() => {
    const area = d3
      .area<SnowRow>()
      .defined((d) => d["CanESM2 (Average)"] != null)
      .x((d) => xScale(d.year))
      .y0(() => yScale(0)) // baseline at 0
      .y1((d) => yScale(d["CanESM2 (Average)"] as number))
      // .curve(d3.curveLinear) // .curve(d3.curveMonotoneX)
    return area(filteredData) ?? ""
  }, [filteredData, xScale, yScale])

  const xTicks = useMemo(() => {
    const tickCount = Math.min(8, Math.max(3, Math.floor(size.width / 120)))
    return xScale.ticks(tickCount)
  }, [xScale, size.width])

  const yTicks = useMemo(() => yScale.ticks(5), [yScale])

  useLayoutEffect(() => {
    if (!xAxisRef.current) return
    const id = requestAnimationFrame(() => {
      try {
        const bb = xAxisRef.current!.getBBox()
        const bboxBottom = bb.y + bb.height
        const overflow = Math.ceil(bboxBottom - size.height + 8) // +px padding
        setExtraBottom(Math.max(0, overflow))
      } catch {}
    })
    return () => cancelAnimationFrame(id)
  }, [size.width, size.height])

  useLayoutEffect(() => {
    if (!yAxisRef.current) return
    const id = requestAnimationFrame(() => {
      try {
        const bb = yAxisRef.current!.getBBox()
        const padding = 2 // breathing room in px
        const extra = Math.max(0, Math.ceil(padding - bb.x))
        setExtraLeft(extra)
      } catch {}
    })
    return () => cancelAnimationFrame(id)
  }, [size.width, size.height, yTicks]) 

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

  return (
    <svg ref={svgRef} width="100%" height="100%">

      <XAxis size={size} xScale={xScale} margin={safeMargin} ticks={xTicks} innerRef={xAxisRef} />
      <YAxis size={size} yScale={yScale} margin={safeMargin} ticks={yTicks} innerRef={yAxisRef} />
      <path d={snowPath} fill="none" stroke={goldenColor} strokeWidth={4} />
      <path d={snowArea} fill = {SnowWaterColor} />

      <g>
      <rect x={margin.left + 180 - 100} y={size.height - margin.bottom - 22}
            width={120} height={22} rx={4} ry={4}// round corners
            fill="rgba(0,0,0,0.6)"/>
      <text
        x={margin.left + 200}
        y={size.height - margin.bottom}
        dy="-0.5em"
        dx="-0.5em"
        style={{ ...labelStyle, textAnchor: "end"}}
      >
        Ground surface
      </text>
    </g>
    </svg>
  )
}

function XAxis({
  size,
  xScale,
  margin,
  ticks,
  innerRef,
}: {
  size: ContainerSize
  xScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  innerRef?: React.Ref<SVGGElement>
}) {
  const y = size.height - margin.bottom

  return (
    <g ref={innerRef}>
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
              dy="18" // pixel offset is more consistent than em
              style={{ ...labelStyle, textAnchor: "middle"}}
            >
              {d3.format("d")(t)}
            </text>
          </g>
        ))}
      </g>

      <text
        x={(margin.left + size.width - margin.right) / 2}
        y={y}
        dy="50" // keep axis label below tick labels
        style={{ ...labelStyle, textAnchor: "middle"}}
      >
        Year
      </text>
    </g>
  )
}

function YAxis({
  size,
  yScale,
  margin,
  ticks,
  innerRef
}: {
  size: ContainerSize
  yScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  innerRef?: React.Ref<SVGGElement>
}) {
  return (
    <g ref={innerRef} className="y-axis" transform={`translate(${margin.left},0)`}>
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
            {d3.format(".2~f")(t)}in
          </text>
        </g>
      ))}
    </g>
  )
}