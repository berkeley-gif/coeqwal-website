import React, { useEffect, useMemo, useRef, useState } from "react"
import { useFetchData } from "../../hooks/useFetchData"
import FlowLine, { FlowEntry } from "./HydroClimateLine"
import * as d3 from "d3"
import { Typography } from "@repo/ui/mui"

export type ContainerSize = {
  width: number
  height: number
}

export default function HydroClimateContainer() {
  const [flowData, setFlowData] = useState<FlowEntry[]>([])
  const [flowYExtents, setFlowYExtents] = useState<[number, number]>([0, 0])
  const [selectedModel, setSelectedModel] = useState<string>("")

  useFetchData(
    "./data/hydroclimate_streamflow_change.json",
    (rawData: FlowEntry[]) => {
      const processedData = rawData.filter((d) => d.model !== "Historical")
      const allValues = processedData.flatMap((d) => [d.Qone, d.Qthree])
      const maxAbs = Math.ceil(Math.max(...allValues.map(Math.abs)))
      setFlowData(processedData)
      setFlowYExtents([-maxAbs, maxAbs])
    },
  )

  function onModelSelect(model: string) {
    setSelectedModel(model)
  }

  return (
    <>
      <div style={{ width: "40%", height: "100%" }}>
        <ClimateScatter onSelect={onModelSelect} />
      </div>
      <div style={{ width: "60%", height: "100%" }}>
        {selectedModel && (
          <FlowLine
            selected={selectedModel}
            data={flowData.filter((d) => d.model == selectedModel)}
            yExtents={flowYExtents}
          />
        )}
        {!selectedModel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body1">
              Click on a <span className="highlight-text">hydroclimate</span> on
              the left to see how the river flows change across months in a
              year!
            </Typography>
          </div>
        )}
      </div>
    </>
  )
}

const dummyData = [
  { model: "Warmer & Drier I", temperature: 1.5, precipitation: -3 },
  { model: "Warmer & Drier II", temperature: 1.8, precipitation: -9 },
  { model: "Warmer & Drier III", temperature: 1.9, precipitation: -7 },
  { model: "Warmer & Drier IV", temperature: 1.4, precipitation: -12 },
  { model: "Warmer & Wetter", temperature: 1.2, precipitation: 4 },
]
const yExtents = [-15, 15]
const yTicks = [-15, 0, 15]
const xExtents = [0, 2]
const xTicks = [1, 2]
const margin = { top: 40, right: 75, bottom: 40, left: 150 }

function ClimateScatter({ onSelect }: { onSelect: (model: string) => void }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })

  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect()
      setSize({ width, height })
    }
  }, [])

  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(xExtents)
      .range([margin.left, size.width - margin.right])
      .nice()
  }, [size.width])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([size.height - margin.bottom, margin.top])
      .nice()
  }, [size.height])

  return (
    <svg ref={svgRef} width="100%" height="100%">
      <XAxis size={size} yOffset={yScale(0)} xScale={xScale} />
      <Rules size={size} xScale={xScale} yScale={yScale} />
      <ClimatePoint
        data={dummyData}
        xScale={xScale}
        yScale={yScale}
        onSelect={onSelect}
      />
      <YAxis yScale={yScale} />
    </svg>
  )
}

function ClimatePoint({
  data,
  xScale,
  yScale,
  onSelect,
}: {
  data: { model: string; temperature: number; precipitation: number }[]
  xScale: d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  onSelect: (model: string) => void
}) {
  return (
    <>
      {data.map((entry, idx) => (
        <g
          key={idx}
          onClick={() => onSelect(entry.model)}
          style={{ cursor: "pointer" }}
        >
          <circle
            r="6"
            fill="#F1B143"
            cx={xScale(entry.temperature)}
            cy={yScale(entry.precipitation)}
          ></circle>
          <line
            stroke="#F1B143"
            strokeWidth={1}
            x1={xScale(0)}
            x2={xScale(entry.temperature)}
            y1={yScale(0)}
            y2={yScale(entry.precipitation)}
          ></line>
          <text
            className="climate-points"
            x={xScale(entry.temperature)}
            y={yScale(entry.precipitation)}
            dx="0.5em"
            dy={
              [
                "Warmer & Drier I",
                "Warmer & Drier III",
                "Warmer & Wetter",
              ].includes(entry.model)
                ? "-1em"
                : "1em"
            }
          >
            {entry.model}
          </text>
        </g>
      ))}
    </>
  )
}

function Rules({
  xScale,
  yScale,
  size,
}: {
  size: ContainerSize
  xScale: d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
}) {
  const xValues = [10, 5, -5, -10]
  const yValues = [1, 2]

  return (
    <>
      <g className="x-axis-rules" transform={`translate(${margin.left}, 0)`}>
        {xValues.map((val, idx) => (
          <path
            key={idx}
            d={`M0,${yScale(val)} L${size.width - margin.right - margin.left},${yScale(val)}`}
            stroke="#f2f0ef"
            strokeOpacity={0.3}
            strokeWidth={0.5}
          ></path>
        ))}
      </g>
      <g className="y-axis-rules" transform={`translate(0, 0})`}>
        {yValues.map((val, idx) => (
          <path
            key={idx}
            d={`M${xScale(val)},${yScale(-15.5)} L${xScale(val)},${yScale(15.5)}`}
            stroke="#f2f0ef"
            strokeOpacity={0.3}
            strokeWidth={0.5}
          ></path>
        ))}
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
      <g className="y-axis" transform={`translate(${margin.left * 0.6},0)`}>
        <text id="y-axis-label" x={0} y={yScale(0)}>
          <tspan x={0} dy="-0.6em" dx="-1em">
            Changes in
          </tspan>
          <tspan x={0} dy="1.2em" dx="-1em">
            precipitation
          </tspan>
          <tspan x={0} dy="1.2em" dx="-1em">
            &#8594;
          </tspan>
        </text>
      </g>
    </>
  )
}

function XAxis({
  size,
  yOffset,
  xScale,
}: {
  size: ContainerSize
  yOffset: number
  xScale: d3.ScaleLinear<number, number>
}) {
  return (
    <>
      <g className="x-axis" transform={`translate(${margin.left}, 0)`}>
        <path
          d={`M0,${yOffset} L${size.width - margin.right - margin.left},${yOffset}`}
          stroke="#f2f0ef"
          strokeWidth={1}
        ></path>
      </g>
      <g>
        {xTicks.map((tick, idx) => (
          <XTick
            key={idx}
            idx={idx}
            yPos={yOffset}
            value={tick.toString()}
            xPos={xScale(tick) ?? 0}
          />
        ))}
      </g>
      <g className="x-axis">
        <text
          id="x-axis-label"
          x={size.width / 2}
          y={size.height - margin.bottom}
          dy="2.5em"
        >
          Changes in temperature
          <tspan> &#8593;</tspan>
        </text>
      </g>
    </>
  )
}

function XTick({
  value,
  xPos,
  yPos = 0,
  idx,
}: {
  value: string
  xPos: number
  yPos?: number
  idx: number
}) {
  return (
    <g key={idx} className="x-axis-ticks">
      <text x={xPos} y={yPos} dy="1em">
        {value}
        <tspan dx="0.2em">&#176;C</tspan>
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
