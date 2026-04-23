import { useEffect, useMemo, useRef, useState } from "react"
import {
  scalePoint,
  scaleLinear,
  line,
  area,
  type ScalePoint,
  type ScaleLinear,
} from "@repo/viz"
import { ContainerSize } from "./HydroClimate"
import "./hydroclimate.css"
import { OffWhiteColor } from "../helpers/colorPalette"
import { motion } from "@repo/motion"
import { useTheme } from "@repo/ui/mui"

export type FlowEntry = {
  model: string
  month: string
  monthNum: number
  median: number
  mean: number
  Qone: number
  Qthree: number
}

const margin = { top: 20, right: 40, bottom: 60, left: 180 }
const yTicks = [65, 40, 20, 0, -20, -40, -65]

function FlowLine({
  selected = "",
  data = [],
  yExtents = [-100, 100],
}: {
  selected: string
  data: FlowEntry[]
  yExtents: [number, number]
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const theme = useTheme()
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })
  const months = new Array(12).fill(0).map((_, i) => i + 1)

  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect()
      setSize({ width, height })
    }
  }, [])

  const xScale = useMemo(() => {
    return scalePoint()
      .domain(months.map((m) => m.toString()))
      .range([margin.left, size.width - margin.right])
      .padding(0.5)
  }, [months, size.width])

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain(yExtents)
      .range([size.height - margin.bottom, margin.top])
      .nice()
  }, [size.height, yExtents])

  return (
    <motion.svg
      id="hydroclimate-line-svg"
      ref={svgRef}
      width="100%"
      height="100%"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <motion.text
        id="hydroclimate-line-title"
        x={0}
        y={margin.top}
        dx={"0.75em"}
        dy={"-0.5em"}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.subtitle2.fontSize,
          textAnchor: "start",
        }}
      >
        Selected -{" "}
        <motion.tspan
          key={selected}
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {selected}
        </motion.tspan>
      </motion.text>
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
      >
        <XAxis size={size} yOffset={yScale(0)} xScale={xScale} />
        <YAxis yScale={yScale} />
      </motion.g>
      <motion.g
        key={selected}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <FlowLineWithBand data={data} xScale={xScale} yScale={yScale} />
      </motion.g>
    </motion.svg>
  )
}

function FlowLineWithBand({
  data,
  xScale,
  yScale,
}: {
  data: FlowEntry[]
  xScale: ScalePoint<string>
  yScale: ScaleLinear<number, number>
}) {
  const lineGenerator = line<FlowEntry>()
    .x((d) => xScale(d.monthNum.toString()) ?? 0)
    .y((d) => yScale(d.median))

  const areaGenerator = area<FlowEntry>()
    .x((d) => xScale(d.monthNum.toString()) ?? 0)
    .y0((d) => yScale(d.Qone))
    .y1((d) => yScale(d.Qthree))

  return (
    <g>
      <motion.path
        d={lineGenerator(data) ?? ""}
        fill="none"
        stroke={"#F1b143"}
        strokeWidth={4}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
      ></motion.path>
      <motion.path
        d={areaGenerator(data) ?? ""}
        fill={"#F1b143"}
        className="glow-effect"
        fillOpacity={0.15}
        stroke="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
      />
    </g>
  )
}

function XAxis({
  size,
  yOffset,
  xScale,
}: {
  size: ContainerSize
  yOffset: number
  xScale: ScalePoint<string>
}) {
  const xTicks = ["Oct", "Dec", "Mar", "Jul", "Sep"]
  const xTicksNum = [1, 3, 6, 9, 12]
  const theme = useTheme()
  return (
    <>
      <g className="x-axis" transform={`translate(${margin.left}, 0)`}>
        <path
          d={`M0,${yOffset} L${size.width - margin.right - margin.left},${yOffset}`}
          stroke="#fcfbfa"
          strokeWidth={1}
        ></path>
        <path
          d={`M0, ${size.height - margin.bottom} L${size.width - margin.right - margin.left}, ${size.height - margin.bottom}`}
          stroke="#fcfbfa"
          strokeWidth={3}
        ></path>
      </g>
      <g
        className="x-axis"
        transform={`translate(0, ${size.height - margin.bottom})`}
      >
        {xTicks.map((tick, idx) => (
          <XTick
            key={idx}
            idx={idx}
            value={tick}
            xPos={xScale(xTicksNum[idx]!.toString()) ?? 0}
          />
        ))}
        <text
          id="x-axis-label"
          x={size.width / 2}
          y={0}
          dy="2.5em"
          style={{
            fill: OffWhiteColor,
            fontSize: theme.typography.subtitle2.fontSize,
            textAnchor: "middle",
          }}
        >
          Months in a water year
        </text>
      </g>
    </>
  )
}

function YAxis({ yScale }: { yScale: ScaleLinear<number, number> }) {
  const theme = useTheme()
  return (
    <>
      <g className="y-axis" transform={`translate(${margin.left},0)`}>
        {yTicks.map((tick, idx) => (
          <YTick key={idx} value={tick} yPos={yScale(tick)} idx={idx} />
        ))}
      </g>
      <g className="y-axis" transform={`translate(${margin.left / 2},0)`}>
        <text
          id="y-axis-label"
          x={0}
          y={yScale(0)}
          style={{
            fill: OffWhiteColor,
            fontSize: theme.typography.subtitle2.fontSize,
          }}
        >
          <tspan x={0} dy="-0.6em" dx="-1em">
            Changes in
          </tspan>
          <tspan x={0} dy="1.2em" dx="-1em">
            river flow
          </tspan>
          <tspan x={0} dy="1.2em" dx="-1em">
            &#8594;
          </tspan>
        </text>
      </g>
    </>
  )
}

function XTick({
  value,
  xPos,
  idx,
}: {
  value: string
  xPos: number
  idx: number
}) {
  const theme = useTheme()
  return (
    <g key={idx} className="x-axis-ticks">
      <text
        x={xPos}
        y={0}
        dy="1em"
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
          textAnchor: "middle",
        }}
      >
        {value}
      </text>
    </g>
  )
}

function YTick({
  value,
  yPos,
  idx,
}: {
  value: number
  yPos: number
  idx: number
}) {
  const theme = useTheme()
  return (
    <g key={idx} className="y-axis-ticks">
      <line
        x1={-6}
        x2={0}
        y1={yPos}
        y2={yPos}
        stroke="#fcfbfa"
        strokeWidth={1}
      ></line>
      <text
        x={0}
        dx="-0.75em"
        y={yPos}
        style={{
          fill: OffWhiteColor,
          fontSize: theme.typography.caption.fontSize,
        }}
      >
        {value <= 0 ? `${value}%` : `+${value}%`}
      </text>
    </g>
  )
}

export default FlowLine
