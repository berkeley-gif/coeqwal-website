"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { motion } from "@repo/motion"
//import rawData from "data/annual_precipitation.json" assert { type: "json" }
import { debounce } from "lodash"
import {
  axisVariants,
  barVariants,
  labelVariants,
  tickVariants,
} from "@repo/motion/variants"
import { VisibleIcon } from "../helpers/Icons"
import "./precipitation-bar.css"
import { MarkerType } from "../helpers/types"
import { useFetchData } from "../../hooks/useFetchData"

interface PrecipitationDatum {
  year: number
  anomaly: number
  value: number
}

const margin = { top: 20, right: 80, bottom: 30, left: 180 }
const FIXED_HEIGHT = 500
const LABEL_HEIGHT = 50

//TODO: possible make the height a fixed number
function PrecipitationBar({
  mapData,
  startAnimation,
  getSelectedYear,
}: {
  mapData: Record<string, MarkerType[]>
  startAnimation: boolean
  getSelectedYear: (year: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: FIXED_HEIGHT,
  })
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    data: PrecipitationDatum | null
  }>({ visible: false, x: 0, y: 0, data: null })
  //const isInView = useInView(containerRef, { once: true, amount: 0.5 });
  const [data, setData] = useState<PrecipitationDatum[]>([])

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width } = entry.contentRect
          setDimensions({ width, height: FIXED_HEIGHT })
        }
      }
    }, 300) // Debounce with a delay of 300ms

    const resizeObserver = new ResizeObserver((entries) =>
      handleResize(entries),
    )

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
      handleResize.cancel()
    }
  }, [])

  useFetchData(
    "/data/annual_precipitation.json",
    (rawData: { description: string; data: Record<string, object> }) => {
      const processedData = Object.entries(rawData.data)
        .filter(([key]) => {
          const year = parseInt(key.substring(0, 4))
          return year >= 2014 && year <= 2023
        })
        .map(([key, value]) => {
          const typedValue = value as { value: number; anomaly: number }
          return {
            year: parseInt(key.substring(0, 4)),
            anomaly: typedValue.anomaly,
            value: typedValue.value,
          }
        })
      setData(processedData)
    },
  )

  const yearLabels = useMemo(() => {
    if (!mapData) return []
    return Object.keys(mapData).map((key) => parseInt(key))
  }, [mapData])

  const average = useMemo(() => {
    return parseFloat(d3.mean(data, (d) => d.value)?.toFixed(2) || "0.00")
  }, [data])

  const yExtents = useMemo(() => {
    if (data.length === 0) return [0, 0]
    //return [-15, 15]
    return d3.extent(data, (d) => d.anomaly) as [number, number]
  }, [data])

  const yTicks = useMemo(() => {
    return d3
      .ticks(yExtents[0] as number, yExtents[1] as number, 5)
      .map((d) => ({
        value: d,
        label: d > 0 ? `+${d}` : `${d}`,
      }))
  }, [yExtents])

  const xScale = useMemo(() => {
    return d3
      .scaleBand<number>()
      .domain(data.map((d) => d.year))
      .range([margin.left, dimensions.width - margin.right])
      .paddingInner(0.1)
      .paddingOuter(0.5)
  }, [dimensions.width, data])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([dimensions.height - margin.bottom, margin.top])
      .nice()
  }, [dimensions.height, yExtents])

  return (
    <div
      ref={containerRef}
      style={{ height: FIXED_HEIGHT, width: "100%", padding: " 2rem 0 " }}
    >
      {tooltip.visible && tooltip.data && (
        <div
          className="tooltip"
          style={{ transform: `translate(${tooltip.x}px, ${tooltip.y}px)` }}
        >
          <strong>Year:</strong> {tooltip.data.year} <br />
          <strong>Annual Precipitation:</strong> {tooltip.data.value}
          {tooltip.data.anomaly >= 0
            ? ` (+${tooltip.data.anomaly})`
            : ` (${tooltip.data.anomaly})`}{" "}
          inch
        </div>
      )}
      <svg width={dimensions.width} height={dimensions.height}>
        <YAxis
          yTicks={yTicks}
          yExtents={yExtents as [number, number]}
          average={average}
          yScale={yScale}
          dimensions={dimensions}
          animate={startAnimation}
        />
        <Bars
          data={data}
          xScale={xScale}
          yScale={yScale}
          animate={startAnimation}
          setTooltip={setTooltip}
          containerRef={containerRef}
          yearLabels={yearLabels}
          getSelectedYear={getSelectedYear}
        />
        <XAxis
          yOffset={yScale(0)}
          dimensions={dimensions}
          animate={startAnimation}
        />
      </svg>
    </div>
  )
}

function Bars({
  data,
  xScale,
  yScale,
  setTooltip,
  containerRef,
  yearLabels,
  animate,
  getSelectedYear,
}: {
  data: PrecipitationDatum[]
  xScale: d3.ScaleBand<number>
  yScale: d3.ScaleLinear<number, number>
  setTooltip: React.Dispatch<
    React.SetStateAction<{
      visible: boolean
      x: number
      y: number
      data: PrecipitationDatum | null
    }>
  >
  containerRef: React.RefObject<HTMLDivElement | null>
  yearLabels: number[]
  animate: boolean
  getSelectedYear: (year: string) => void
}) {
  const barWidth = xScale.bandwidth() * 0.6
  return (
    <>
      {data.map((d, idx) => {
        const xPos = xScale(d.year) ?? 0
        const barHeight = Math.abs(yScale(d.anomaly) - yScale(0))
        const yPos = d.anomaly < 0 ? yScale(0) : yScale(d.anomaly)
        const cursorStyle = yearLabels.includes(d.year) ? "pointer" : "default"
        return (
          <g key={idx} className="bars">
            <motion.rect
              x={xPos}
              width={barWidth}
              fill={d.anomaly < 0 ? "transparent" : "steelblue"}
              stroke={d.anomaly < 0 ? "steelblue" : "none"}
              strokeWidth={d.anomaly < 0 ? 2 : 0}
              variants={barVariants}
              initial="initial"
              animate={animate ? "visible" : "initial"}
              custom={{ yPos, barHeight, order: idx, baseline: yScale(0) }}
            />
            <g
              transform={`translate(${xPos + barWidth / 2}, ${d.anomaly < 0 ? yPos + barHeight : yPos})`}
            >
              <motion.text
                className="axis-label"
                dy={d.anomaly < 0 ? "0.9em" : "-0.7em"}
                fontSize="1rem"
                variants={labelVariants}
                initial="hidden"
                animate={animate ? "visible" : "hidden"}
                custom={3.5 + idx * 0.1}
              >
                {d.year}
              </motion.text>
              {yearLabels.includes(d.year) && (
                <VisibleIcon
                  delay={4.5 + idx * 0.1}
                  animation={animate ? "visible" : "hidden"}
                  transform={`translate(-0.45em, ${d.anomaly < 0 ? "0.7em" : "-1.7em"})`}
                />
              )}
            </g>
            <rect
              x={xPos - 2} // consider stroke-width
              y={d.anomaly < 0 ? yPos : yPos - LABEL_HEIGHT} // Covers the entire height of the chart
              width={barWidth + 4}
              height={
                d.anomaly < 0
                  ? barHeight + LABEL_HEIGHT
                  : barHeight + LABEL_HEIGHT
              } // Up to the baseline
              fill="transparent"
              style={{ cursor: cursorStyle }}
              onMouseMove={(e) => {
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect()
                  setTooltip({
                    visible: true,
                    x: e.clientX - rect.left + 20,
                    y: e.clientY - rect.top + 20,
                    data: d,
                  })
                }
              }}
              onClick={() => {
                if (yearLabels.includes(d.year)) {
                  getSelectedYear(d.year.toString())
                }
              }}
              onMouseLeave={() =>
                setTooltip((prev) => ({ ...prev, visible: false }))
              }
            />
          </g>
        )
      })}
    </>
  )
}

function XAxis({
  yOffset,
  dimensions,
  animate,
}: {
  yOffset: number
  dimensions: { width: number; height: number }
  animate: boolean
}) {
  return (
    <g className="x-axis" transform={`translate(${margin.left}, ${yOffset})`}>
      <motion.path
        className="axis"
        d={`M0,0 L${dimensions.width - margin.right - margin.left},0`}
        variants={axisVariants}
        initial="hidden"
        animate={animate ? "visible" : "hidden"}
        custom={1.5}
      />
      <motion.text
        x={dimensions.width - margin.right - margin.left}
        y={0}
        dx="3em"
        className="x-axis-ticks"
        variants={labelVariants}
        initial="hidden"
        animate={animate ? "visible" : "hidden"}
        custom={2.5}
      >
        Years
      </motion.text>
    </g>
  )
}

function YAxis({
  yTicks,
  yExtents,
  yScale,
  average,
  dimensions,
  animate,
}: {
  yTicks: { value: number; label: string }[]
  yExtents: [number, number]
  yScale: d3.ScaleLinear<number, number>
  dimensions: { width: number; height: number }
  average: number
  animate: boolean
}) {
  const aboveMidpoint = (margin.top + yScale(0)) / 2
  const belowMidpoint = (dimensions.height - margin.bottom + yScale(0)) / 2

  return (
    <>
      <g className="y-axis" transform={`translate(${margin.left}, 0)`}>
        <motion.path
          className="axis"
          d={`M0,${dimensions.height - margin.bottom} L0,${margin.top}`}
          variants={axisVariants}
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          custom={0}
        />
        {yTicks.map((tick, idx) => (
          <motion.g
            key={idx}
            variants={tickVariants}
            initial="hidden"
            animate={animate ? "visible" : "hidden"}
            custom={
              0.6 +
              ((tick.value - yExtents[0]) / (yExtents[1] - yExtents[0])) * 0.5
            }
          >
            <line
              x1={-6}
              x2={0}
              y1={yScale(tick.value)}
              y2={yScale(tick.value)}
              className="axis"
            />
            <text
              x={0}
              y={yScale(tick.value)}
              dx="-0.75em"
              className="y-axis-ticks"
            >
              {tick.label}
            </text>
          </motion.g>
        ))}
      </g>
      <g
        className="y-axis-label"
        transform={`translate(${margin.left / 2}, 0)`}
      >
        <motion.g
          variants={labelVariants}
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          custom={1}
        >
          <text
            x={0}
            y={yScale(0)}
            dx="-0.5em"
            className="axis-label"
            fontSize="1rem"
          >
            Historical average
          </text>
          <text
            x={0}
            y={yScale(0)}
            dx="-0.5em"
            dy="1.5em"
            className="axis-label"
            fontSize="0.8rem"
          >
            {average} inch
          </text>
        </motion.g>
        <motion.text
          x={0}
          y={aboveMidpoint}
          className="axis-label"
          fontSize="1rem"
          variants={labelVariants}
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          custom={1.35}
        >
          Above average
        </motion.text>
        <motion.text
          x={0}
          y={belowMidpoint}
          className="axis-label"
          fontSize="1rem"
          variants={labelVariants}
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          custom={0.5}
        >
          Below average
        </motion.text>
      </g>
    </>
  )
}

export default PrecipitationBar
