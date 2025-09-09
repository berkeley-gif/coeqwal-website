import { useEffect, useMemo, useRef, useState } from "react"
import { ContainerSize } from "./HydroClimate"
import * as d3 from "d3"
import "./hydroclimate.css"

export type FlowEntry = {
  model: string
  month: string
  monthNum: number
  median: number
  mean: number
  Qone: number
  Qthree: number
}

const margin = { top: 20, right: 40, bottom: 40, left: 120 }
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
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })
  const months = new Array(12).fill(0).map((_, i) => i + 1)

  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect()
      setSize({ width, height })
    }
  }, [])

  const xScale = useMemo(() => {
    return d3
      .scalePoint()
      .domain(months.map((m) => m.toString()))
      .range([margin.left, size.width - margin.right])
      .padding(0.5)
  }, [months, size.width])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([size.height - margin.bottom, margin.top])
      .nice()
  }, [size.height, yExtents])

  return (
    <svg id="hydroclimate-line-svg" ref={svgRef} width="100%" height="100%">
      <text
        id="hydroclimate-line-title"
        x={0}
        y={margin.top}
        dx={"0.75em"}
        dy={"-0.5em"}
      >
        Selected - <tspan fontWeight="bold">{selected}</tspan>
      </text>
      <XAxis size={size} yOffset={yScale(0)} xScale={xScale} />
      <FlowLineWithBand data={data} xScale={xScale} yScale={yScale} />
      <YAxis yScale={yScale} />
    </svg>
  )
}

function FlowLineWithBand({
  data,
  xScale,
  yScale,
}: {
  data: FlowEntry[]
  xScale: d3.ScalePoint<string>
  yScale: d3.ScaleLinear<number, number>
}) {
  const lineGenerator = d3
    .line<FlowEntry>()
    .x((d) => xScale(d.monthNum.toString()) ?? 0)
    .y((d) => yScale(d.median))

  const areaGenerator = d3
    .area<FlowEntry>()
    .x((d) => xScale(d.monthNum.toString()) ?? 0)
    .y0((d) => yScale(d.Qone))
    .y1((d) => yScale(d.Qthree))

  return (
    <g>
      <path
        d={lineGenerator(data) ?? ""}
        fill="none"
        stroke="#F1B143"
        strokeWidth={2}
      ></path>
      <path
        d={areaGenerator(data) ?? ""}
        fill="#F1B143"
        fillOpacity={0.15}
        stroke="none"
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
  xScale: d3.ScalePoint<string>
}) {
  const xTicks = ["Oct", "Dec", "Mar", "Jul", "Sep"]
  const xTicksNum = [1, 3, 6, 9, 12]
  return (
    <>
      <g className="x-axis" transform={`translate(${margin.left}, 0)`}>
        <path
          d={`M0,${yOffset} L${size.width - margin.right - margin.left},${yOffset}`}
          stroke="#f2f0ef"
          strokeWidth={1}
        ></path>
        <path
          d={`M0, ${size.height - margin.bottom} L${size.width - margin.right - margin.left}, ${size.height - margin.bottom}`}
          stroke="#f2f0ef"
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
        <text id="x-axis-label" x={size.width / 2} y={0} dy="2.5em">
          Months in a water year
        </text>
      </g>
    </>
  )
}

function YAxis({ yScale }: { yScale: d3.ScaleLinear<number, number> }) {
  return (
    <>
      <g className="y-axis" transform={`translate(${margin.left},0)`}>
        {yTicks.map((tick, idx) => (
          <YTick key={idx} value={tick} yPos={yScale(tick)} idx={idx} />
        ))}
      </g>
      <g className="y-axis" transform={`translate(${margin.left / 2},0)`}>
        <text id="y-axis-label" x={0} y={yScale(0)}>
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
  return (
    <g key={idx} className="x-axis-ticks">
      <text x={xPos} y={0} dy="1em">
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
  return (
    <g key={idx} className="y-axis-ticks">
      <line
        x1={-6}
        x2={0}
        y1={yPos}
        y2={yPos}
        stroke="#f2f0ef"
        strokeWidth={1}
      ></line>
      <text x={0} dx="-0.75em" y={yPos}>
        {value <= 0 ? `${value}%` : `+${value}%`}
      </text>
    </g>
  )
}

export default FlowLine
