import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import type { ContainerSize } from "./Snowpack"
import { SnowWaterColor, OffWhiteColor } from "../helpers/colorPalette"
import { useLayoutEffect } from "react"
import { motion, MotionValue } from "@repo/motion"
import { usePlayAnimationOnce } from "@repo/motion/hooks"

//TODO: clean up this code
export type SnowRow = {
  year: number
  "CanESM2 (Average)": number | null
  // Observed removed from usage (can be omitted in your data load too)
}
type Margin = { top: number; right: number; bottom: number; left: number }
const margin: Margin = { top: 24, right: 0, bottom: 64, left: 0 }
const axisColor = OffWhiteColor

const tickLabelStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fill: OffWhiteColor,
}

const axisLabelStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fill: OffWhiteColor,
  fontWeight: "bold",
}

type Props = {
  data: SnowRow[]
  yExtents: [number, number]
  scrollProgress: MotionValue<number>
}

export default function SnowpackLine({
  data,
  yExtents,
  scrollProgress,
}: Props) {
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
      left: margin.left + extraLeft,
      bottom: margin.bottom + extraBottom, // from your X-axis fix
    }),
    [extraLeft, extraBottom],
  )
  const years = useMemo(() => filteredData.map((d) => d.year), [filteredData])
  const xScale = useMemo(() => {
    const minY = d3.min(years) ?? 0
    const maxY = 2050
    const pad = 3
    return d3
      .scaleLinear()
      .domain([minY - pad, maxY + pad])
      .range([safeMargin.left, size.width - safeMargin.right])
      .clamp(true)
  }, [years, size.width, safeMargin.left, safeMargin.right])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([size.height - safeMargin.bottom, safeMargin.top])
      .nice()
  }, [yExtents, size.height, safeMargin.bottom, safeMargin.top])

  /*
  const snowPath = useMemo(() => {
    const line = d3
      .line<SnowRow>()
      .defined((d) => d["CanESM2 (Average)"] != null)
      .x((d) => xScale(d.year))
      .y((d) => yScale(d["CanESM2 (Average)"] as number))
    // .curve(d3.curveLinear) // .curve(d3.curveMonotoneX)
    return line(filteredData) ?? ""
  }, [filteredData, xScale, yScale])
  */

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
      } catch (err) {
        void err // noop to satisfy linter
      }
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
      } catch (err) {
        void err // noop to satisfy linter
      }
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

  const areaOpacity = usePlayAnimationOnce(scrollProgress, [0.5, 0.7], [0, 0.8])

  return (
    <svg ref={svgRef} width="100%" height="100%">
      <defs>
        <clipPath id="snowpack-clip">
          <motion.rect x={0} width={size.width} />
        </clipPath>
      </defs>
      <XAxis
        size={size}
        xScale={xScale}
        margin={safeMargin}
        ticks={xTicks}
        innerRef={xAxisRef}
        scrollProgress={scrollProgress}
      />
      <YAxis
        yScale={yScale}
        margin={safeMargin}
        ticks={yTicks}
        innerRef={yAxisRef}
        scrollProgress={scrollProgress}
      />
      <motion.path
        d={snowArea}
        fill={SnowWaterColor}
        fillOpacity={areaOpacity}
      />
    </svg>
  )
}

function XAxis({
  size,
  xScale,
  margin,
  ticks,
  innerRef,
  scrollProgress,
}: {
  size: ContainerSize
  xScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  innerRef?: React.Ref<SVGGElement>
  scrollProgress: MotionValue<number>
}) {
  const y = size.height - margin.bottom
  const pathLength = usePlayAnimationOnce(scrollProgress, [0.3, 0.5], [0, 1])

  return (
    <g ref={innerRef}>
      <g className="x-axis-line">
        <motion.path
          d={`M${margin.left},${y} L${size.width - margin.right},${y}`}
          stroke={axisColor}
          strokeWidth={1}
          pathLength={pathLength}
        />
      </g>

      <g className="x-axis-ticks">
        {ticks.map((t, i) => (
          <XTick
            key={i}
            tick={t}
            xPos={xScale(t)}
            yPos={y}
            idx={i}
            scrollProgress={scrollProgress}
          />
        ))}
      </g>

      <motion.text
        x={(margin.left + size.width - margin.right) / 2}
        y={y}
        dy="50" // keep axis label below tick labels
        style={{ ...axisLabelStyle, textAnchor: "middle", opacity: pathLength }}
      >
        Year
      </motion.text>
    </g>
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
        x={xPos}
        y={yPos}
        dy="1.6em" // pixel offset is more consistent than em
        style={{ ...tickLabelStyle, textAnchor: "middle" }}
      >
        {d3.format("d")(tick)}
      </text>
    </motion.g>
  )
}

function YAxis({
  yScale,
  margin,
  ticks,
  innerRef,
  scrollProgress,
}: {
  yScale: d3.ScaleLinear<number, number>
  margin: Margin
  ticks: number[]
  innerRef?: React.Ref<SVGGElement>
  scrollProgress: MotionValue<number>
}) {
  const annotationOpacity = usePlayAnimationOnce(
    scrollProgress,
    [0.4, 0.6],
    [0, 1],
  )

  return (
    <g
      ref={innerRef}
      className="y-axis"
      transform={`translate(${margin.left},0)`}
    >
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
        y={yScale(1)}
        dx="-4.5em"
        dy="0.5em"
        style={{
          ...tickLabelStyle,
          textAnchor: "middle",
          opacity: annotationOpacity,
        }}
      >
        Ground
      </motion.text>
      <motion.text
        x={0}
        y={yScale(0)}
        dx="-4.5em"
        dy="1em"
        style={{
          ...tickLabelStyle,
          textAnchor: "middle",
          opacity: annotationOpacity,
        }}
      >
        surface
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
  const range: [number, number] = [0.3 + idx * 0.02, 0.5 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollProgress, range, [0, 1])

  return (
    <motion.g key={idx} style={{ opacity: tickOpacity }}>
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
        dx="-0.25em"
        dy="0.35em"
        style={{ ...tickLabelStyle, textAnchor: "end" }}
      >
        {`${d3.format(".2~f")(tick)} in.`}
      </text>
    </motion.g>
  )
}
