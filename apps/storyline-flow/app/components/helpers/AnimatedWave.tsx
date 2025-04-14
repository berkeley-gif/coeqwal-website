"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"

const AnimatedWaves = () => {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const width = window.innerWidth
    const height = window.innerHeight

    svg.attr("width", width).attr("height", height)

    // Set the darkest blue as the background color
    d3.select("body").style("background-color", "#14263e")

    const numWaves = 4
    const colors: string[] = ["#1a3a5d", "#2568a3", "#3092d1", "#00e5ff"] // blues
    //
    //const colors = ['#1a3f6b', "#356d8f", "#629caf", "#9acbcf"]

    // Define the type for our wave data points
    type WaveDataPoint = [number, number]

    const area = d3
      .area<WaveDataPoint>()
      .x((d) => d[0])
      .y0((d) => d[1])
      .y1(height)
      .curve(d3.curveBasis)

    // Define the correct type for the waves array
    const waves: d3.Selection<
      SVGPathElement,
      WaveDataPoint[],
      null,
      undefined
    >[] = []

    for (let i = 0; i < numWaves; i++) {
      // Explicitly type the wave data as an array of tuples
      const waveData: WaveDataPoint[] = d3
        .range(width)
        .map((x) => [
          x,
          height * 0.4 + Math.sin(x * 0.004 + i * 2) * 80 + i * 70,
        ])

      const wave = svg
        .append("path")
        .datum(waveData)
        .attr("d", area)
        .attr("fill", colors[i] as string)
        .attr("opacity", 0.8 - i * 0.2)

      waves.push(wave)
    }

    const animateWaves = () => {
      const shiftTime = Date.now() * 0.00001
      const fallTime = Date.now() * 0.00075

      waves.forEach((wave, i) => {
        // Make sure the updated data is also properly typed
        const updatedData: WaveDataPoint[] = d3
          .range(width)
          .map((x) => [
            x,
            height * 0.4 +
              Math.sin(x * 0.003 + i * 2 + shiftTime) *
                (80 + 30 * Math.sin(fallTime * 0.5 + i)) +
              i * 70,
          ])

        wave.datum(updatedData).attr("d", area)
      })

      requestAnimationFrame(animateWaves)
    }

    animateWaves()
  }, [])

  return (
    <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0 }}></svg>
  )
}

export default AnimatedWaves
