"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { useBreakpoint } from "@repo/ui/hooks"

const numWaves = 4
const colors: string[] = ["#1a3a5d", "#2568a3", "#3092d1", "#00e5ff"] // blues

//TODO: make the wave height also responsive
const portion = {
  xs: 0.35,
  sm: 0.35,
  md: 0.35,
  lg: 0.25,
  xl: 0.35,
}

const AnimatedWaves = ({
  width,
  height,
}: {
  width: number
  height: number
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const breakpoint = useBreakpoint()

  useEffect(() => {
    if (!width || !height) return // Avoid rendering if dimensions are invalid

    const svg = d3.select(svgRef.current)
    const heightPortion = portion[breakpoint] || 0.35

    // Clear previous SVG content to avoid overlapping waves
    svg.selectAll("*").remove()

    svg.attr("width", width).attr("height", height)

    type WaveDataPoint = [number, number]

    const area = d3
      .area<WaveDataPoint>()
      .x((d) => d[0])
      .y0((d) => d[1])
      .y1(height)
      .curve(d3.curveBasis)

    const waves: d3.Selection<
      SVGPathElement,
      WaveDataPoint[],
      null,
      undefined
    >[] = []

    for (let i = 0; i < numWaves; i++) {
      const waveData: WaveDataPoint[] = d3
        .range(width)
        .map((x) => [
          x,
          height * heightPortion + Math.sin(x * 0.004 + i * 2) * 80 + i * 70,
        ])

      const wave = svg
        .append("path")
        .datum(waveData)
        .attr("d", area)
        .attr("fill", colors[i] || "#00e5ff")
        .attr("opacity", 0.8 - i * 0.2)

      waves.push(wave)
    }

    const animateWaves = () => {
      const shiftTime = Date.now() * 0.00001
      const fallTime = Date.now() * 0.00075

      waves.forEach((wave, i) => {
        const updatedData: WaveDataPoint[] = d3
          .range(width)
          .map((x) => [
            x,
            height * heightPortion +
              Math.sin(x * 0.003 + i * 2 + shiftTime) *
                (80 + 30 * Math.sin(fallTime * 0.5 + i)) +
              i * 70,
          ])

        wave.datum(updatedData).attr("d", area)
      })

      requestAnimationFrame(animateWaves)
    }

    animateWaves()
  }, [width, height, breakpoint]) // Re-run the effect when width or height changes

  return (
    <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0 }}></svg>
  )
}

export default AnimatedWaves
