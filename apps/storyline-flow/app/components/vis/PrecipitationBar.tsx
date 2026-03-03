"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { motion, MotionValue, useTransform } from "@repo/motion"
import { debounce } from "lodash"
import "./precipitation-bar.css"
import { useFetchData } from "../../hooks/useFetchData"
import { useBreakpoint } from "@repo/ui/hooks"
import { FreshWaterColor, OffWhiteColor } from "../helpers/colorPalette"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { Box, Theme, useTheme } from "@repo/ui/mui"

interface PrecipitationDatum {
  year: number
  anomaly: number
  value: number
}

const responsiveHeight = {
  xs: 200,
  sm: 250,
  md: 300,
  lg: 400,
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
    <div ref={containerRef} style={{ height: selectedHeight, width: "100%", position: "relative" }}>
      {tooltip.visible && tooltip.data && (
        //TODO: Make this into a proper tooltip component, and add accessibility features (aria-live, role="tooltip", etc.)
        <Box
          className="tooltip"
          sx={{
            transform: `translate(${tooltip.x}px, ${tooltip.y}px)`,
            typography: 'caption',
            backgroundColor: "common.white",
            color: "text.primary",
            borderRadius: (theme: Theme) => theme.borderRadius.md,
            border: (theme: Theme) => theme.border.medium,
          }}
        >
          <strong>Year</strong>{" \u2013"} {tooltip.data.year} <br />
          <strong>Annual Precipitation</strong>{" \u2013"}  {tooltip.data.value}
          {tooltip.data.anomaly >= 0
            ? ` (+${tooltip.data.anomaly})`
            : ` (${tooltip.data.anomaly})`}{" "}
          inch
        </Box>
      )}
      <svg
        width={dimensions.width}
        height={selectedHeight}
        id="bar-svg"
        viewBox={`0 0 ${dimensions.width} ${selectedHeight}`}
      >
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
  const barWidth = xScale.bandwidth() * 0.6
  const [yearHovered, setYearHovered] = useState<number | null>(null)
  const [yearClicked, setYearClicked] = useState<number | null>(null)

  useEffect(() => {
    console.log("Year clicked:", yearClicked)
  }, [yearClicked])

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
                //if (idx === data.length - 1) setFinished(true)
              }}
              yearHovered={yearHovered}
              yearClicked={yearClicked}
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
                //TODO: this blocks the tooltip showing, because the setFinished is never triggered.
                //if (!finished) return
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
              onMouseOver={() => {
                setYearHovered(d.year)
              }}
              onClick={() => {
                if (yearLabels.includes(d.year)) {
                  getSelectedYear(d.year.toString())
                  setYearClicked(d.year)
                } else {
                  setYearClicked(null)
                }
              }}
              onMouseLeave={() => {
                setTooltip((prev) => ({ ...prev, visible: false }))
                setYearHovered(null)
              }}
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
  yearHovered,
  yearClicked,
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
  yearHovered: number | null
  yearClicked: number | null
}) {
  const [animationPlayed, setAnimationPlayed] = useState(false)
  const theme = useTheme()

  const range = useMemo(
    (): [number, number] => [0.5 + idx * 0.01, 0.7 + idx * 0.01],
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
        style={{
          fontSize: theme.typography.caption.fontSize,
        }}
      >
        <motion.text
          className="axis-label"
          dy={d.anomaly < 0 ? "0.9em" : "-0.7em"}
          style={{ opacity }}
        >
          {d.year}
        </motion.text>
        {hasPhoto && (
          <VisibleIcon
            isHovered={yearHovered === d.year}
            yearClicked={yearClicked}
            isClicked={yearClicked === d.year}
            opacity={opacity}
            transform={(d.anomaly < 0) ? "2em" : "-2em"}
            onAnimationComplete={onAnimationComplete}
          />
        )}
      </g>
    </>
  )
}

function VisibleIcon({
  opacity,
  isHovered,
  yearClicked,
  isClicked,
  transform,
  onAnimationComplete,
}: {
  opacity: MotionValue<number>
  transform: string
  isHovered: boolean
  isClicked: boolean
  yearClicked: number | null
  onAnimationComplete?: () => void
}) {
  const animatedScale = isHovered ? 1.1 : isClicked ? 1 : [0.8, 1, 0.8]

  return (
    <g style={{ transform: `translateY(${transform})` }}>
    <motion.g
      initial={{ scale: 0 }}
      animate={{
        scale: animatedScale, // Oscillate between 1 and 1.2
      }}
      transition={{
        duration: isHovered || isClicked ? 0.2 : 1.5, // Duration of one cycle
        repeat: isHovered || isClicked ? 0 : Infinity, // Infinite animation
        repeatType: "reverse", // Reverse direction after each cycle
      }}
    >
      {yearClicked === null || isClicked ? (
        <motion.path
          style={{
            opacity: opacity,
            fill: OffWhiteColor,
            transform: "translate(-12px, -12px)",
            transformOrigin: "12px 12px",
          }}
          onAnimationComplete={onAnimationComplete}
          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"
        ></motion.path>
      ) : (
        <motion.path
          style={{
            opacity: opacity,
            fill: OffWhiteColor,
            transform: "translate(-12px, -12px)",
            transformOrigin: "12px 12px",
          }}
          onAnimationComplete={onAnimationComplete}
          d="M12 17.5C8.2 17.5 4.8 15.4 3.2 12H1C2.7 16.4 7 19.5 12 19.5S21.3 16.4 23 12H20.8C19.2 15.4 15.8 17.5 12 17.5Z"
        ></motion.path>
        )}
      </motion.g>
    </g>
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
  const theme = useTheme()
  const textOpacity = usePlayAnimationOnce(scrollYProgress, [0.4, 0.7], [0, 1])
  const axisPathLength = usePlayAnimationOnce(
    scrollYProgress,
    [0.4, 0.7],
    [0, 1],
  )

  return (
    <g className="x-axis"
      transform={`translate(${margin.left}, ${yOffset})`}
      style={{ fontSize: theme.typography.caption.fontSize }}>
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
  const theme = useTheme()
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
      <g className="y-axis"
        transform={`translate(${margin.left}, 0)`}
        style={{ fontSize: theme.typography.caption.fontSize }}>
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
        style={{ fontSize: theme.typography.caption.fontSize }}
      >
        <motion.g style={{ opacity: labelOpacity }}>
          <text
            x={0}
            y={yScale(0)}
            dx="-0.5em"
            className="axis-label"
          >
            Historical average
          </text>
          <text
            x={0}
            y={yScale(0)}
            dx="-0.5em"
            dy="1.5em"
            className="axis-label"
            style={{ fontSize: theme.typography.compactSubtitle.fontSize }}
          >
            {average} inch
          </text>
        </motion.g>
        <motion.text
          x={0}
          y={aboveMidpoint}
          className="axis-label"
          style={{ opacity: labelOpacity }}
        >
          Above average
        </motion.text>
        <motion.text
          x={0}
          y={belowMidpoint}
          className="axis-label"
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
  const range: [number, number] = [0.5 + idx * 0.01, 0.7 + idx * 0.01]
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
