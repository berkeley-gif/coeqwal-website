"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import rough from "roughjs"
import { motion } from "@repo/motion"
import { FlubberInterpolate } from "@repo/motion"
import { debounce } from "lodash"

const startMonth = 9 // October
const months = Array.from({ length: 12 }, (_, i) =>
  d3.timeFormat("%b")(new Date(2024, (i + startMonth) % 12, 1)),
)

const margin = { top: 50, right: 30, bottom: 100, left: 100 }
const FIXED_HEIGHT = 400

export default function AnimatedCurve() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: FIXED_HEIGHT,
  })

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

  const snowPath = getGammaCurve()
  const meltPath = getGaussianCurve()
  const snowArea = areaGen(snowPath)!
  const meltArea = areaGen(meltPath)!

  useEffect(() => {
    if (!svgRef.current || !pathRef.current) return

    const rc = rough.svg(svgRef.current)
    const g = pathRef.current
    g.innerHTML = ""

    const style = {
      hachureAngle: 60,
      hachureGap: 10,
      fillWeight: 3,
      strokeWidth: 3,
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

    requestAnimationFrame(tick)
  }, [dimensions, areaGen, xScale, yScale, snowArea, meltArea])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "400px", padding: "2rem 0" }}
    >
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}>
        <motion.path
          d={lineGen(snowPath) as string}
          stroke="#f2f0ef"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 5, ease: "easeInOut" }}
        />

        <Annotation dimensions={dimensions} xScale={xScale} />
        <XAxis size={dimensions} xScale={xScale} />
        <YAxis size={dimensions} yScale={yScale} />

        <g ref={pathRef} />
      </svg>
      <div style={{ width: "100%", height: "60px", backgroundColor: "teal" }}>
        Timeline Slider
      </div>
    </div>
  )
}

function Annotation({
  dimensions,
  xScale,
}: {
  dimensions: { width: number; height: number }
  xScale: d3.ScaleLinear<number, number>
}) {
  return (
    <motion.g
      id="annotation"
      transform={`translate(${0}, ${0})`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <rect
        x={xScale(0)}
        y={0}
        width={xScale(5) - xScale(0)}
        height={dimensions.height - margin.bottom}
        fill="#f2f0ef"
        opacity={0.1}
      />
      <text
        x={xScale(2.5)}
        y={0}
        dy="1rem"
        fill="#f2f0ef"
        fontSize="1rem"
        fontWeight="bold"
        textAnchor="middle"
      >
        Wet season
      </text>
    </motion.g>
  )
}

function YAxis({
  size,
  yScale,
}: {
  size: { width: number; height: number }
  yScale: d3.ScaleLinear<number, number>
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
          <text
            fill="#f2f0ef"
            dx="-1em"
            dy="0.25em"
            fontSize="0.9rem"
            textAnchor="end"
          >
            {labels[i]}
          </text>
          <line x2={-6} stroke="#f2f0ef" />
        </g>
      ))}
      <line
        y1={margin.top}
        y2={size.height - margin.bottom}
        stroke="#f2f0ef"
        strokeWidth={1}
        className="domain"
      />
      <text
        x={0}
        y={size.height / 2}
        fill="#f2f0ef"
        dx={"-3rem"}
        fontSize="1rem"
        textAnchor="end"
      >
        Volume
      </text>
    </motion.g>
  )
}

function XAxis({
  size,
  xScale,
}: {
  size: { width: number; height: number }
  xScale: d3.ScaleLinear<number, number>
}) {
  return (
    <motion.g
      transform={`translate(0,${size.height - margin.bottom})`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {months.map((month, i) => (
        <g key={i} transform={`translate(${xScale(i)}, 0)`}>
          <text fill="#f2f0ef" dy="1.5em" textAnchor="middle" fontSize="1rem">
            {month}
          </text>
          <line y2="5" stroke="#f2f0ef" />
        </g>
      ))}
      <line
        x1={margin.left}
        x2={size.width}
        stroke="#f2f0ef"
        strokeWidth={1}
        className="domain"
      />
      <text
        x={(margin.left + size.width) / 2}
        y="3.3rem"
        fill="#f2f0ef"
        fontSize="1rem"
        textAnchor="middle"
      >
        Months
      </text>
    </motion.g>
  )
}

function getGammaCurve(shape = 3, scale = 1.2) {
  const xValues = d3.range(0, months.length, 0.1)
  const raw = xValues.map((x) => Math.pow(x, shape - 1) * Math.exp(-x / scale))
  const max = d3.max(raw) || 1
  return xValues.map((x, i) => ({ x, y: (raw[i] ?? 0) / max }))
}

function getGaussianCurve(peak = 7.5, stdDev = 1.8) {
  const xValues = d3.range(0, months.length, 0.1)
  return xValues.map((x) => ({
    x,
    y: Math.exp(-((x - peak) ** 2) / (2 * stdDev ** 2)),
  }))
}
