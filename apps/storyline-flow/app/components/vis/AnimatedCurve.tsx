"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import rough from "roughjs"
import { motion } from "@repo/motion"
import { FlubberInterpolate } from "@repo/motion"
import { debounce } from "lodash"
import { useBreakpoint } from "@repo/ui/hooks"
import {
  axisVariants,
  horizontalGrowRectVariants,
  opacityTextVariants,
  opacityVariants,
} from "@repo/motion/variants"

const startMonth = 9 // October
const months = Array.from({ length: 12 }, (_, i) =>
  d3.timeFormat("%b")(new Date(2024, (i + startMonth) % 12, 1)),
)

const margin = { top: 50, right: 30, bottom: 100, left: 100 }

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
  startAnimation = false,
  selectedMonth = 0,
}: {
  startAnimation: boolean
  selectedMonth: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const breakpoint = useBreakpoint()
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: responsiveHeight[breakpoint] || 350,
  })
  const [startMorph, setStartMorph] = useState(false)

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width } = entry.contentRect
          setDimensions({ width, height: responsiveHeight[breakpoint] || 350 })
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
  }, [breakpoint])

  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([-0.5, months.length - 1 + 0.5])
      .range([margin.left, dimensions.width - margin.right])
  }, [dimensions.width])

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, 1])
      .range([dimensions.height - margin.bottom, margin.top])
  }, [dimensions.height])

  const areaGen = useMemo(() => {
    return d3
      .area<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y0(dimensions.height - margin.bottom)
      .y1((d) => yScale(d.y))
      .curve(d3.curveBasis)
  }, [xScale, yScale, dimensions.height])

  const lineGen = d3
    .line<{ x: number; y: number }>()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y))
    .curve(d3.curveBasis)

  const snowArea = areaGen(snowData)!
  const meltArea = areaGen(meltData)!

  useEffect(() => {
    if (!svgRef.current || !pathRef.current) return

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

    // Draw initial white gamma curve
    const startShape = rc.path(snowArea, {
      ...style,
      fill: "#f2f0ef",
      stroke: "#f2f0ef",
      disableMultiStroke: true,
    })
    g.appendChild(startShape)

    // Animate the transition
    const interpolator = FlubberInterpolate(snowArea, meltArea)
    const duration = 1500
    const start = Date.now()

    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const d = interpolator(t)
      const color = d3.interpolateRgb("#f2f0ef", "steelblue")(t)

      g.innerHTML = ""
      const morphShape = rc.path(d, {
        ...style,
        fill: color,
        stroke: color,
      })
      g.appendChild(morphShape)

      if (t < 1) requestAnimationFrame(tick)
    }

    if (!startMorph) return

    requestAnimationFrame(tick)
  }, [dimensions, areaGen, xScale, yScale, snowArea, meltArea, startMorph])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `${responsiveHeight[breakpoint] || 350}px`,
        padding: "2rem 0",
      }}
    >
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}>
        <motion.path
          d={lineGen(snowData)!}
          stroke="#f2f0ef"
          strokeWidth={2}
          fill="none"
          variants={axisVariants}
          initial="hidden"
          animate={startMorph ? "visible" : "hidden"}
          custom={1}
        />

        <XAxis
          size={dimensions}
          xScale={xScale}
          startAnimation={startAnimation}
        />
        <YAxis
          size={dimensions}
          yScale={yScale}
          startAnimation={startAnimation}
        />

        <motion.g
          ref={pathRef}
          variants={opacityVariants}
          initial="hidden"
          animate={startAnimation ? "visible" : "hidden"}
          custom={7.5}
          onAnimationComplete={() => {
            setStartMorph(true)
          }}
        />
        <Annotation
          startAnimation={startAnimation}
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

function Annotation({
  startAnimation,
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
  startAnimation: boolean
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

  return (
    <g id="annotation" transform={`translate(${0}, ${0})`}>
      <path ref={pathRef} d={lineGen(snowData)!} fill="none" stroke="none" />
      <motion.rect
        variants={horizontalGrowRectVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={{ width, delay: 4 }}
        x={xScale(0)}
        y={0}
        width={width}
        height={dimensions.height - margin.bottom}
        fill="#f2f0ef"
        opacity={0.1}
      />
      <motion.text
        x={xScale(2.5)}
        y={0}
        dy="1rem"
        fill="#f2f0ef"
        fontSize="1rem"
        fontWeight="bold"
        textAnchor="middle"
        variants={opacityTextVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={4.5}
      >
        Wet season
      </motion.text>

      <motion.line
        x1={xScale(monthIdx)}
        x2={xScale(monthIdx)}
        y1={0}
        y2={dimensions.height - margin.bottom}
        stroke="#f2f0ef"
        strokeWidth={1}
        strokeDasharray="1 1"
        variants={opacityVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={7.5}
      />
      <motion.circle
        cx={position[0]}
        cy={position[1]}
        r={3}
        fill="#f2f0ef"
        variants={opacityVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={7.5}
      />
    </g>
  )
}

function YAxis({
  startAnimation,
  size,
  yScale,
}: {
  size: { width: number; height: number }
  yScale: d3.ScaleLinear<number, number>
  startAnimation: boolean
}) {
  const labels = ["Low", "High"]
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
            variants={opacityTextVariants}
            initial="hidden"
            animate={startAnimation ? "visible" : "hidden"}
            custom={1.8 + i * 1.5}
            fill="#f2f0ef"
            dx="-1em"
            dy="0.25em"
            fontSize="0.9rem"
            textAnchor="end"
          >
            {labels[i]}
          </motion.text>
          <motion.line
            x2={-6}
            stroke="#f2f0ef"
            variants={axisVariants}
            initial="hidden"
            animate={startAnimation ? "visible" : "hidden"}
            custom={1.8 + i * 1.5}
          />
        </g>
      ))}
      <motion.line
        variants={axisVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={1.8}
        y1={size.height - margin.bottom}
        y2={margin.top}
        stroke="#f2f0ef"
        strokeWidth={1}
        className="domain"
      />
      <motion.text
        x={0}
        y={size.height / 2}
        fill="#f2f0ef"
        dx={"-3rem"}
        fontSize="1rem"
        textAnchor="end"
        variants={opacityTextVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={3}
      >
        Volume
      </motion.text>
    </motion.g>
  )
}

function XAxis({
  startAnimation,
  size,
  xScale,
}: {
  size: { width: number; height: number }
  xScale: d3.ScaleLinear<number, number>
  startAnimation: boolean
}) {
  return (
    <g transform={`translate(0,${size.height - margin.bottom})`}>
      {months.map((month, i) => (
        <g key={i} transform={`translate(${xScale(i)}, 0)`}>
          <motion.text
            fill="#f2f0ef"
            dy="1.5em"
            textAnchor="middle"
            fontSize="1rem"
            variants={opacityTextVariants}
            initial="hidden"
            animate={startAnimation ? "visible" : "hidden"}
            custom={0.3 + i * 0.1}
          >
            {month}
          </motion.text>
          <motion.line
            y2="5"
            stroke="#f2f0ef"
            variants={axisVariants}
            initial="hidden"
            animate={startAnimation ? "visible" : "hidden"}
            custom={0.3 + i * 0.1}
          />
        </g>
      ))}
      <motion.line
        x1={margin.left}
        x2={size.width}
        stroke="#f2f0ef"
        strokeWidth={1}
        variants={axisVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={0.3}
        className="domain"
      />
    </g>
  )
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
