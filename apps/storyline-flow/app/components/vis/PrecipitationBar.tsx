"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { motion } from "@repo/motion"
import rawData from "../../../public/data/annual_precipitation.json" assert { type: "json" }
import mapData from "../../../public/data/variability_marker.json" assert { type: "json" }
import { debounce } from "lodash"
import {
  axisVariants,
  barVariants,
  labelVariants,
  tickVariants,
} from "@repo/motion/variants"
import { VisibleIcon } from "../helpers/Icons"
import "./precipitation-bar.css"

interface PrecipitationDatum {
  year: number
  anomaly: number
  value: number
}

const data: PrecipitationDatum[] = Object.entries(rawData.data)
  .filter(([key]) => {
    const year = parseInt(key.substring(0, 4))
    return year >= 2014 && year <= 2023
  })
  .map(([key, value]) => ({
    year: parseInt(key.substring(0, 4)),
    anomaly: value.anomaly,
    value: value.value,
  }))

const average = parseFloat(d3.mean(data, (d) => d.value)?.toFixed(2) || "0.00")
const yearLabels = Object.keys(mapData).map((key) => parseInt(key))

const yExtents = d3.extent(data, (d) => d.anomaly) as [number, number]
const yTicks = d3.ticks(yExtents[0], yExtents[1], 7).map((d) => ({
  value: d,
  label: d > 0 ? `+${d}` : d,
}))
const margin = { top: 20, right: 80, bottom: 30, left: 180 }

function PrecipitationBar({
  startAnimation,
  getSelectedYear,
}: {
  startAnimation: boolean
  getSelectedYear: (year: keyof typeof mapData) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    data: PrecipitationDatum | null
  }>({ visible: false, x: 0, y: 0, data: null })
  //const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect
          setDimensions({ width, height })
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

  const xScale = useMemo(() => {
    return d3
      .scaleBand<number>()
      .domain(data.map((d) => d.year))
      .range([margin.left, dimensions.width - margin.right])
      .paddingInner(0.1)
      .paddingOuter(0.5)
  }, [dimensions.width])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yExtents)
      .range([dimensions.height - margin.bottom, margin.top])
      .nice()
  }, [dimensions.height])

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
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
          yScale={yScale}
          dimensions={dimensions}
          animate={startAnimation}
        />
        <Bars
          xScale={xScale}
          yScale={yScale}
          animate={startAnimation}
          setTooltip={setTooltip}
          containerRef={containerRef}
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
  xScale,
  yScale,
  setTooltip,
  containerRef,
  animate,
  getSelectedYear,
}: {
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
  animate: boolean
  getSelectedYear: (year: keyof typeof mapData) => void
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
          <g
            key={idx}
            className="bars"
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
                getSelectedYear(d.year.toString() as keyof typeof mapData)
              }
            }}
            onMouseLeave={() =>
              setTooltip((prev) => ({ ...prev, visible: false }))
            }
          >
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
  yScale,
  dimensions,
  animate,
}: {
  yScale: d3.ScaleLinear<number, number>
  dimensions: { width: number; height: number }
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
