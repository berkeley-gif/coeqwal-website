"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { motion, MotionValue, useTransform } from "@repo/motion"
import { debounce } from "lodash"
import "./precipitation-bar.css"
import { useFetchData } from "../../hooks/useFetchData"
import { useBreakpoint } from "@repo/ui/hooks"
import {
  visibleIconTransform,
  visibleIconTransformConfig,
} from "../helpers/breakpoints"
import { FreshWaterColor, OffWhiteColor } from "../helpers/colorPalette"
import { usePlayAnimationOnce } from "@repo/motion/hooks"

interface PrecipitationDatum {
  year: number
  anomaly: number
  value: number
}

const responsiveHeight = {
  xs: 200,
  sm: 250,
  md: 300,
  lg: 450,
  xl: 500,
}

const margin = { top: 20, right: 80, bottom: 35, left: 180 }
const LABEL_HEIGHT = 50

function PrecipitationBar({
  yearLabels,
  scrollYProgress,
  getSelectedYear,
}: {
  yearLabels: number[]
  scrollYProgress: MotionValue<number>
  getSelectedYear: (year: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const breakpoint = useBreakpoint()
  const selectedHeight = responsiveHeight[breakpoint] || 400
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: selectedHeight,
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
          setDimensions({ width, height: selectedHeight })
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
  }, [selectedHeight])

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
    <div ref={containerRef} style={{ height: selectedHeight, width: "100%" }}>
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
      <svg width={dimensions.width} height={selectedHeight} id="bar-svg">
        <YAxis
          yTicks={yTicks}
          yExtents={yExtents as [number, number]}
          average={average}
          yScale={yScale}
          dimensions={dimensions}
          scrollYProgress={scrollYProgress}
        />
        <BarChart
          data={data}
          xScale={xScale}
          yScale={yScale}
          scrollYProgress={scrollYProgress}
          setTooltip={setTooltip}
          containerRef={containerRef}
          yearLabels={yearLabels}
          getSelectedYear={getSelectedYear}
        />
        <XAxis
          yOffset={yScale(0)}
          dimensions={dimensions}
          scrollYProgress={scrollYProgress}
        />
      </svg>
    </div>
  )
}

function BarChart({
  data,
  xScale,
  yScale,
  setTooltip,
  containerRef,
  yearLabels,
  scrollYProgress,
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
  scrollYProgress: MotionValue<number>
  getSelectedYear: (year: string) => void
}) {
  const [finished, setFinished] = useState(false)
  const barWidth = xScale.bandwidth() * 0.6
  const breakpoint = useBreakpoint()
  const transform = visibleIconTransform[
    breakpoint
  ] as visibleIconTransformConfig

  return (
    <>
      {data.map((d, idx) => {
        const xPos = xScale(d.year) ?? 0
        const barHeight = Math.abs(yScale(d.anomaly) - yScale(0))
        const yPos = d.anomaly < 0 ? yScale(0) : yScale(d.anomaly)
        const cursorStyle = yearLabels.includes(d.year) ? "pointer" : "default"

        return (
          <g key={idx} className="bars">
            <Bar
              xPos={xPos}
              yPosStart={yScale(0)}
              yPosEnd={yPos}
              barHeight={barHeight}
              barWidth={barWidth}
              d={d}
              scrollYProgress={scrollYProgress}
              idx={idx}
              hasPhoto={yearLabels.includes(d.year)}
              onAnimationComplete={() => {
                if (idx === data.length - 1) setFinished(true)
              }}
              transform={transform}
            />
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
                if (!finished) return
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

function Bar({
  d,
  xPos,
  yPosStart,
  yPosEnd,
  barWidth,
  scrollYProgress,
  barHeight,
  idx,
  hasPhoto = false,
  onAnimationComplete,
  transform,
}: {
  d: PrecipitationDatum
  xPos: number
  yPosStart: number
  yPosEnd: number
  barWidth: number
  scrollYProgress: MotionValue<number>
  barHeight: number
  idx: number
  hasPhoto?: boolean
  onAnimationComplete?: () => void
  transform: visibleIconTransformConfig
}) {
  const [animationPlayed, setAnimationPlayed] = useState(false)

  const range = useMemo(
    (): [number, number] => [0.5 + idx * 0.02, 0.75 + idx * 0.02],
    [idx],
  )
  const opacity = useTransform(
    scrollYProgress,
    range,
    animationPlayed ? [1, 1] : [0, 1],
  )
  const height = useTransform(
    scrollYProgress,
    range,
    animationPlayed ? [barHeight, barHeight] : [0, barHeight],
  )
  const y = useTransform(
    scrollYProgress,
    range,
    animationPlayed ? [yPosEnd, yPosEnd] : [yPosStart, yPosEnd],
  )

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest >= range[1]) {
        setAnimationPlayed(true) // Mark animation as completed
      }
    })

    return () => unsubscribe()
  }, [scrollYProgress, range])

  return (
    <>
      <motion.rect
        x={xPos}
        width={barWidth}
        fill={d.anomaly < 0 ? "transparent" : FreshWaterColor}
        stroke={d.anomaly < 0 ? FreshWaterColor : "none"}
        strokeWidth={d.anomaly < 0 ? 2 : 0}
        style={{
          opacity,
          y,
          height,
        }}
      />
      <g
        transform={`translate(${xPos + barWidth / 2}, ${d.anomaly < 0 ? yPosEnd + barHeight : yPosEnd})`}
      >
        <motion.text
          className="axis-label"
          dy={d.anomaly < 0 ? "0.9em" : "-0.7em"}
          fontSize="1rem"
          style={{ opacity }}
        >
          {d.year}
        </motion.text>
        {hasPhoto && (
          <VisibleIcon
            opacity={opacity}
            transform={`translate(${transform.x}, ${d.anomaly < 0 ? transform.belowY : transform.aboveY})`}
            onAnimationComplete={onAnimationComplete}
          />
        )}
      </g>
    </>
  )
}

function VisibleIcon({
  opacity,
  transform,
  onAnimationComplete,
}: {
  opacity: MotionValue<number>
  transform: string
  onAnimationComplete?: () => void
}) {
  return (
    <motion.g
      initial={{ scale: 0 }}
      animate={{
        scale: [0.85, 1, 0.85], // Oscillate between 1 and 1.2
      }}
      transition={{
        duration: 2, // Duration of one cycle
        repeat: Infinity, // Infinite animation
        repeatType: "reverse", // Reverse direction after each cycle
      }}
    >
      <motion.path
        style={{
          opacity: opacity,
          fill: OffWhiteColor,
          transform: transform,
        }}
        onAnimationComplete={onAnimationComplete}
        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"
      ></motion.path>
    </motion.g>
  )
}

function XAxis({
  yOffset,
  dimensions,
  scrollYProgress,
}: {
  yOffset: number
  dimensions: { width: number; height: number }
  scrollYProgress: MotionValue<number>
}) {
  const textOpacity = usePlayAnimationOnce(scrollYProgress, [0.4, 0.7], [0, 1])
  const axisPathLength = usePlayAnimationOnce(
    scrollYProgress,
    [0.4, 0.7],
    [0, 1],
  )

  return (
    <g className="x-axis" transform={`translate(${margin.left}, ${yOffset})`}>
      <motion.path
        className="axis"
        d={`M0,0 L${dimensions.width - margin.right - margin.left},0`}
        pathLength={axisPathLength}
      />
      <motion.text
        x={dimensions.width - margin.right - margin.left}
        y={0}
        dx="3em"
        className="x-axis-ticks"
        style={{ opacity: textOpacity }}
      >
        Years
      </motion.text>
    </g>
  )
}

function YAxis({
  yTicks,
  yScale,
  average,
  dimensions,
  scrollYProgress,
}: {
  yTicks: { value: number; label: string }[]
  yExtents: [number, number]
  yScale: d3.ScaleLinear<number, number>
  dimensions: { width: number; height: number }
  average: number
  scrollYProgress: MotionValue<number>
}) {
  const aboveMidpoint = (margin.top + yScale(0)) / 2
  const belowMidpoint = (dimensions.height - margin.bottom + yScale(0)) / 2

  const axisPathLength = usePlayAnimationOnce(
    scrollYProgress,
    [0.4, 0.7],
    [0, 1],
  )
  const labelOpacity = usePlayAnimationOnce(scrollYProgress, [0.6, 0.7], [0, 1])

  return (
    <>
      <g className="y-axis" transform={`translate(${margin.left}, 0)`}>
        <motion.path
          className="axis"
          d={`M0,${dimensions.height - margin.bottom} L0,${margin.top}`}
          pathLength={axisPathLength}
        />
        {yTicks.map((tick, idx) => (
          <Tick
            key={idx}
            tick={tick}
            yPos={yScale(tick.value)}
            idx={idx}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </g>
      <g
        className="y-axis-label"
        transform={`translate(${margin.left / 2}, 0)`}
      >
        <motion.g style={{ opacity: labelOpacity }}>
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
          style={{ opacity: labelOpacity }}
        >
          Above average
        </motion.text>
        <motion.text
          x={0}
          y={belowMidpoint}
          className="axis-label"
          fontSize="1rem"
          style={{ opacity: labelOpacity }}
        >
          Below average
        </motion.text>
      </g>
    </>
  )
}

function Tick({
  tick,
  yPos,
  idx,
  scrollYProgress,
}: {
  tick: { value: number; label: string }
  yPos: number
  idx: number
  scrollYProgress: MotionValue<number>
}) {
  const range: [number, number] = [0.5 + idx * 0.02, 0.7 + idx * 0.02]
  const tickOpacity = usePlayAnimationOnce(scrollYProgress, range, [0, 1])

  return (
    <motion.g key={idx} style={{ opacity: tickOpacity }}>
      <line x1={-6} x2={0} y1={yPos} y2={yPos} className="axis" />
      <text x={0} y={yPos} dx="-0.75em" className="y-axis-ticks">
        {tick.label}
      </text>
    </motion.g>
  )
}

export default PrecipitationBar
