"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import rough from "roughjs"
import { motion, MotionValue, useTransform } from "@repo/motion"
import { FlubberInterpolate } from "@repo/motion"
import { debounce } from "lodash"
import { useBreakpoint } from "@repo/ui/hooks"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import {
  FreshWaterColor,
  OffWhiteColor,
  SnowWaterColor,
} from "../helpers/colorPalette"

const startMonth = 9 // October
const months = Array.from({ length: 12 }, (_, i) =>
  d3.timeFormat("%b")(new Date(2024, (i + startMonth) % 12, 1)),
)

const margin = { top: 50, right: 30, bottom: 70, left: 100 }

const responsiveHeight = {
  xs: 200,
  sm: 250,
  md: 300,
  lg: 300,
  xl: 400,
}

const snowData = getSnowCurve()
const meltData = getMeltCurve()

export default function AnimatedCurve({
  selectedMonth = 0,
  scrollYProgress,
}: {
  selectedMonth: number
  scrollYProgress: MotionValue<number>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const breakpoint = useBreakpoint()
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: responsiveHeight[breakpoint] || 350,
  })

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width } = entry.contentRect
          setDimensions({ width, height: responsiveHeight[breakpoint] || 350 })
        }
      }
    }, 300)

    const resizeObserver = new ResizeObserver((entries) =>
      handleResize(entries),
    )
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => {
      resizeObserver.disconnect()
      handleResize.cancel()
    }
  }, [breakpoint])

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([-0.5, months.length - 1 + 0.5])
        .range([margin.left, dimensions.width - margin.right]),
    [dimensions.width],
  )

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, 1])
        .range([dimensions.height - margin.bottom, margin.top]),
    [dimensions.height],
  )

  const areaGen = useMemo(
    () =>
      d3
        .area<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y0(dimensions.height - margin.bottom)
        .y1((d) => yScale(d.y))
        .curve(d3.curveBasis),
    [xScale, yScale, dimensions.height],
  )

  const lineGen = d3
    .line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(d3.curveBasis)

  useEffect(() => {
    if (!svgRef.current || !pathRef.current) return

    // Prepare rough.js group
    const rc = rough.svg(svgRef.current)
    const g = pathRef.current
    g.innerHTML = ""

    const style = {
      hachureAngle: 60,
      hachureGap: 6,
      fillWeight: 2.5,
      strokeWidth: 2,
      roughness: 0.5,
    }

    const snowToFlatInterpolators = PathInterpolate(snowData, areaGen, true)
    const flatToMeltInterpolators = PathInterpolate(meltData, areaGen, false)

    const scrollRange: [number, number] = [0.65, 0.75]
    function updateMorphBasedOnScroll(scrollProgress: number) {
      const clampedScroll = Math.max(
        scrollRange[0],
        Math.min(scrollRange[1], scrollProgress),
      )
      const tAll =
        (clampedScroll - scrollRange[0]) / (scrollRange[1] - scrollRange[0]) // Normalize to 0-1

      let pathD
      let fillColor

      // First phase: snow to flat (0 to 0.5)
      if (tAll < 0.5) {
        const phaseProgress = tAll * 2 // Scale to 0-1 for this phase
        const segmentDuration = 1 / snowToFlatInterpolators.length
        const segmentIndex = Math.min(
          Math.floor(phaseProgress / segmentDuration),
          snowToFlatInterpolators.length - 1,
        )
        const segmentT =
          (phaseProgress - segmentIndex * segmentDuration) / segmentDuration

        pathD = snowToFlatInterpolators[segmentIndex]?.(segmentT)
        // Gradual color change from snow white to medium color
        fillColor = d3.interpolateRgb(SnowWaterColor, "#a7bfd0")(phaseProgress)
      } else {
        const phaseProgress = (tAll - 0.5) * 2 // Scale to 0-1 for this phase
        const segmentDuration = 1 / flatToMeltInterpolators.length
        const segmentIndex = Math.min(
          Math.floor(phaseProgress / segmentDuration),
          flatToMeltInterpolators.length - 1,
        )
        const segmentT =
          (phaseProgress - segmentIndex * segmentDuration) / segmentDuration

        pathD = flatToMeltInterpolators[segmentIndex]?.(segmentT)
        // Continue color change from medium to steelblue
        fillColor = d3.interpolateRgb("#a7bfd0", "#50B1E7")(phaseProgress)
      }

      g.innerHTML = ""
      const shape = rc.path(pathD ?? "", {
        ...style,
        fill: fillColor,
        stroke: fillColor,
      })
      g.appendChild(shape)
    }

    // Initial render at current scroll position
    updateMorphBasedOnScroll(scrollYProgress.get())

    // Subscribe to scroll progress changes
    const unsubscribe = scrollYProgress.on("change", updateMorphBasedOnScroll)

    // Cleanup
    return () => {
      unsubscribe()
    }
  }, [dimensions, areaGen, scrollYProgress])

  const snowPathControl = usePlayAnimationOnce(
    scrollYProgress,
    [0.55, 0.6],
    [0, 1],
  )

  const freshWaterControl = useTransform(scrollYProgress, [0.7, 0.75], [0, 1])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `${responsiveHeight[breakpoint] || 350}px`,
        paddingTop: "15px",
      }}
    >
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}>
        <motion.path
          d={lineGen(snowData)!}
          stroke={SnowWaterColor}
          strokeWidth={2}
          fill="none"
          style={{ opacity: snowPathControl }}
        />

        <motion.text
          x={xScale(5)}
          y={yScale(0.8)}
          fill={SnowWaterColor}
          style={{ opacity: snowPathControl }}
          fontSize="1rem"
          textAnchor="middle"
        >
          Snow-forming precipitation
        </motion.text>

        <motion.text
          x={xScale(9.5)}
          y={yScale(0.8)}
          fill={FreshWaterColor}
          style={{ opacity: freshWaterControl }}
          fontSize="1rem"
          textAnchor="middle"
        >
          Snowmelt
        </motion.text>

        {/* Axes and area-morph group */}
        <XAxis
          size={dimensions}
          xScale={xScale}
          scrollYProgress={scrollYProgress}
        />
        <YAxis
          size={dimensions}
          yScale={yScale}
          scrollYProgress={scrollYProgress}
        />

        <motion.g ref={pathRef} style={{ opacity: snowPathControl }} />

        <Annotation
          scrollYProgress={scrollYProgress}
          dimensions={dimensions}
          xScale={xScale}
          yScale={yScale}
          monthIdx={selectedMonth}
          snowData={snowData}
        />
      </svg>
    </div>
  )
}

// Easing function for smoother animation
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function Annotation({
  scrollYProgress,
  dimensions,
  xScale,
  yScale,
  monthIdx,
  snowData,
}: {
  dimensions: { width: number; height: number }
  xScale: d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  monthIdx: number
  scrollYProgress: MotionValue<number>
  snowData: { x: number; y: number }[]
}) {
  const width = xScale(5) - xScale(0) < 0 ? 0 : xScale(5) - xScale(0)
  const pathRef = useRef<SVGPathElement | null>(null)

  const lineGen = d3
    .line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(d3.curveBasis)

  const snowPoint = snowData.find((d) => d.x === monthIdx)
  const pathString = lineGen([snowPoint!])!
  const match = pathString.match(/-?\d+(\.\d+)?/g)
  const numbers: [string, string] = [match?.[0] || "0", match?.[1] || "0"]
  const position = numbers
    ? [parseFloat(numbers[0]), parseFloat(numbers[1])]
    : [0, 0]

  const rectGrowth = usePlayAnimationOnce(
    scrollYProgress,
    [0.5, 0.65],
    [0, width],
  )
  const textOpacity = usePlayAnimationOnce(scrollYProgress, [0.5, 0.6], [0, 1])

  return (
    <g id="annotation" transform={`translate(${0}, ${0})`}>
      <path ref={pathRef} d={lineGen(snowData)!} fill="none" stroke="none" />
      <motion.rect
        x={xScale(0)}
        y={0}
        width={rectGrowth}
        height={dimensions.height - margin.bottom}
        fill={OffWhiteColor}
        opacity={0.1}
      />
      <motion.text
        x={xScale(2.5)}
        y={0}
        dy="1rem"
        fill={OffWhiteColor}
        fontSize="1rem"
        fontWeight="bold"
        textAnchor="middle"
        style={{ opacity: textOpacity }}
      >
        Wet season
      </motion.text>

      <motion.line
        x1={xScale(monthIdx)}
        x2={xScale(monthIdx)}
        y1={0}
        y2={dimensions.height - margin.bottom}
        stroke={OffWhiteColor}
        strokeWidth={1}
        strokeDasharray="1 1"
        style={{ opacity: textOpacity }}
      />
      <motion.circle
        cx={position[0]}
        cy={position[1]}
        r={5}
        fill={OffWhiteColor}
        style={{ opacity: textOpacity }}
      />
    </g>
  )
}

function YAxis({
  scrollYProgress,
  size,
  yScale,
}: {
  size: { width: number; height: number }
  yScale: d3.ScaleLinear<number, number>
  scrollYProgress: MotionValue<number>
}) {
  const labels = ["Low", "High"]
  const axisPathLength = usePlayAnimationOnce(
    scrollYProgress,
    [0.55, 0.6],
    [0, 1],
  )
  const lowLabelControl = usePlayAnimationOnce(
    scrollYProgress,
    [0.5, 0.6],
    [0, 1],
  )
  const highLabelControl = usePlayAnimationOnce(
    scrollYProgress,
    [0.55, 0.65],
    [0, 1],
  )

  return (
    <motion.g
      transform={`translate(${margin.left},0)`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {[0, 1].map((tick, i) => (
        <g key={i} transform={`translate(0,${yScale(tick)})`}>
          <motion.text
            style={{ opacity: i === 0 ? lowLabelControl : highLabelControl }}
            fill={OffWhiteColor}
            dx="-1em"
            dy="0.25em"
            fontSize="0.9rem"
            textAnchor="end"
          >
            {labels[i]}
          </motion.text>
          <motion.line
            x2={-6}
            stroke={OffWhiteColor}
            pathLength={i === 0 ? lowLabelControl : highLabelControl}
          />
        </g>
      ))}
      <motion.line
        pathLength={axisPathLength}
        y1={size.height - margin.bottom}
        y2={margin.top}
        stroke={OffWhiteColor}
        strokeWidth={1}
        className="domain"
      />
      <motion.text
        x={0}
        y={size.height / 2}
        fill={OffWhiteColor}
        dx={"-3rem"}
        fontSize="1rem"
        textAnchor="end"
        style={{ opacity: axisPathLength }}
      >
        Volume
      </motion.text>
    </motion.g>
  )
}

function XAxis({
  scrollYProgress,
  size,
  xScale,
}: {
  size: { width: number; height: number }
  xScale: d3.ScaleLinear<number, number>
  scrollYProgress: MotionValue<number>
}) {
  const axisPathLength = usePlayAnimationOnce(
    scrollYProgress,
    [0.5, 0.6],
    [0, 1],
  )

  return (
    <g transform={`translate(0,${size.height - margin.bottom})`}>
      {months.map((month, i) => (
        <g key={i} transform={`translate(${xScale(i)}, 0)`}>
          <XTick scrollYProgress={scrollYProgress} idx={i} month={month} />
        </g>
      ))}
      <motion.line
        x1={margin.left}
        x2={size.width}
        stroke={OffWhiteColor}
        strokeWidth={1}
        pathLength={axisPathLength}
        className="domain"
      />
    </g>
  )
}

function XTick({
  scrollYProgress,
  idx,
  month,
}: {
  scrollYProgress: MotionValue<number>
  idx: number
  month: string
}) {
  const range: [number, number] = [0.45 + 0.01 * idx, 0.53 + 0.01 * idx]
  const tickControl = usePlayAnimationOnce(scrollYProgress, range, [0, 1])

  return (
    <>
      <motion.text
        fill={OffWhiteColor}
        dy="1.5em"
        textAnchor="middle"
        fontSize="1rem"
        style={{ opacity: tickControl }}
      >
        {month}
      </motion.text>
      <motion.line y2="5" stroke={OffWhiteColor} pathLength={tickControl} />
    </>
  )
}

function PathInterpolate(
  data: { x: number; y: number }[],
  areaGenerate: d3.Area<{ x: number; y: number }>,
  toFlat = true,
  steps = 8,
) {
  const dataToCurve: string[] = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const easedT = easeInOutCubic(t)

    const intermediateData = data.map((d) => ({
      x: d.x,
      y: toFlat ? d.y * (1 - easedT) : d.y * easedT,
    }))

    return areaGenerate(intermediateData) as string
  })
  const interpolator = dataToCurve.slice(0, -1).map((from, i) => {
    return FlubberInterpolate(from, dataToCurve[i + 1]!)
  })
  return interpolator
}

function getSnowCurve(shape = 5, scale = 0.6) {
  const xValues = d3.range(0, months.length, 0.1)
  const raw = xValues.map((x) => {
    const y = Math.pow(x, shape - 1) * Math.exp(-x / scale)
    return y
  })

  // Normalize the curve so the peak is 1
  const max = d3.max(raw) || 1
  return xValues.map((x, i) => ({ x, y: (raw[i] ?? 0) / max }))
}

function getMeltCurve(peak = 8, stdDev = 1.2) {
  const xValues = d3.range(0, months.length, 0.1)
  return xValues.map((x) => ({
    x,
    y: Math.exp(-((x - peak) ** 2) / (2 * stdDev ** 2)),
  }))
}
