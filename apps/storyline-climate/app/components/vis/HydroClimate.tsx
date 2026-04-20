import React, { useEffect, useMemo, useRef, useState } from "react"
import { useFetchData } from "../../hooks/useFetchData"
import FlowLine, { FlowEntry } from "./HydroClimateLine"
import { scaleLinear, type ScaleLinear } from "@repo/viz"
import { Box, Button, Stack, Typography } from "@repo/ui/mui"
import { useBreakpoint } from "@repo/ui/hooks"

export type ContainerSize = {
  width: number
  height: number
}

type Model = {
  model: string
  background: string
  hover: string
  text: string
}

const models: Model[] = [
  {
    model: "Warmer & Drier I",
    background: "#d08b2f",
    hover: "#b87222",
    text: "#fcfbfa",
  },
  {
    model: "Warmer & Drier II",
    background: "#b86a2f",
    hover: "#a55b28",
    text: "#fcfbfa",
  },
  {
    model: "Warmer & Drier III",
    background: "#b86a2f",
    hover: "#a55b28",
    text: "#fcfbfa",
  },
  {
    model: "Warmer & Drier IV",
    background: "#a23e2b",
    hover: "#913526",
    text: "#fcfbfa",
  },
  {
    model: "Warmer & Wetter",
    background: "#6c8ba0ff",
    hover: "#4e6d80ff",
    text: "#fcfbfa",
  },
]

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
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "20%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <Typography
            variant="body1"
            sx={{ mr: 2, whiteSpace: "nowrap", fontWeight: 700 }}
          >
            {"Choose a hydroclimate:"}
          </Typography>
          <ClimateModelSelector
            onSelect={onModelSelect}
            selectedModel={selectedModel}
          />
        </div>
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
              height: "80%",
            }}
          >
            <Typography variant="body1">
              Click a <span className="highlight-text">hydroclimate</span> above
              to see how the river flows change across months in a year!
            </Typography>
          </div>
        )}
      </div>
    </>
  )
}

function ClimateModelSelector({
  onSelect,
  selectedModel,
}: {
  onSelect: (model: string) => void
  selectedModel: string
}) {
  return (
    <Box
      width="100%"
      height="100%"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
        }}
      >
        {models.map((model: Model, idx) => (
          <Button
            key={idx}
            variant="contained"
            onClick={() => onSelect(model.model)}
            sx={{
              borderRadius: "999px",
              px: 2,
              py: 0.9,
              minHeight: "40px",
              textTransform: "none",
              fontWeight: 700,
              letterSpacing: "0.01em",
              backgroundColor:
                selectedModel === model.model ? model.hover : model.background,
              color: selectedModel === model.model ? "#ffffff" : model.text,
              border:
                selectedModel === model.model
                  ? "2px solid rgba(252, 251, 250, 0.92)"
                  : "1px solid rgba(252, 251, 250, 0.35)",
              boxShadow:
                selectedModel === model.model
                  ? "0 0 0 2px rgba(241, 177, 67, 0.26), 0 8px 20px rgba(0, 0, 0, 0.25)"
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                backgroundColor: model.hover,
                transform: "translateY(-1px)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
              },
            }}
          >
            {model.model}
          </Button>
        ))}
      </Stack>
    </Box>
  )
}

/* Below are archived */

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
const margin = { top: 20, right: 75, bottom: 40, left: 120 }

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
    return scaleLinear()
      .domain(xExtents)
      .range([margin.left, size.width - margin.right])
      .nice()
  }, [size.width])

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain(yExtents)
      .range([size.height - margin.bottom, margin.top])
      .nice()
  }, [size.height])

  return (
    <svg ref={svgRef} width="100%" height="100%">
      <text
        id="hydroclimate-scatter-title"
        x={size.width / 2}
        y={margin.top}
        dx={"0.75em"}
        dy={"2em"}
        style={{ textAnchor: "middle" }}
      >
        Below uses dummy data; right side uses real data
      </text>
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

const _archivedClimateScatter = ClimateScatter

function ClimatePoint({
  data,
  xScale,
  yScale,
  onSelect,
}: {
  data: { model: string; temperature: number; precipitation: number }[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  onSelect: (model: string) => void
}) {
  const breakpoint = useBreakpoint()

  return (
    <>
      {data.map((entry, idx) => (
        <g
          key={idx}
          onClick={() => onSelect(entry.model)}
          style={{ cursor: "pointer" }}
        >
          <circle
            r={
              breakpoint === "xs" || breakpoint === "sm" || breakpoint == "lg"
                ? 4
                : 6
            }
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
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
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
            stroke="#fcfbfa"
            strokeOpacity={0.3}
            strokeWidth={0.5}
          ></path>
        ))}
      </g>
      <g className="y-axis-rules" transform={`translate(0, 0)`}>
        {yValues.map((val, idx) => (
          <path
            key={idx}
            d={`M${xScale(val)},${yScale(-15.5)} L${xScale(val)},${yScale(15.5)}`}
            stroke="#fcfbfa"
            strokeOpacity={0.3}
            strokeWidth={0.5}
          ></path>
        ))}
      </g>
    </>
  )
}

function YAxis({ yScale }: { yScale: ScaleLinear<number, number> }) {
  return (
    <>
      <g className="y-axis" transform={`translate(${margin.left},0)`}>
        {yTicks.map((tick, idx) => (
          <YTick key={idx} value={tick} yPos={yScale(tick)} idx={idx} />
        ))}
      </g>
      <g className="y-axis" transform={`translate(${margin.left * 0.5},0)`}>
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
  xScale: ScaleLinear<number, number>
}) {
  return (
    <>
      <g className="x-axis" transform={`translate(${margin.left}, 0)`}>
        <path
          d={`M0,${yOffset} L${size.width - margin.right - margin.left},${yOffset}`}
          stroke="#fcfbfa"
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
        stroke="#fcfbfa"
        strokeWidth={1}
      ></line>
      <text x={0} dx="-0.75em" y={yPos}>
        {value <= 0 ? `${value}%` : `+${value}%`}
      </text>
    </g>
  )
}
