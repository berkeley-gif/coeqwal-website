"use client"

import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import "../rain.css"
import { FreshWaterColor } from "./helpers/colorPalette"
import RainAnimation from "./helpers/RainAnimation"

function SectionTransition() {
  return (
    <>
      <Balance />
      <Bullet />
    </>
  )
}

function Balance() {
  const drops = Array.from({ length: 100 })

  return (
    <Box
      id="balance"
      className="container-row"
      height="100vh"
      width="100%"
      tabIndex={-1}
      role="region"
      sx={{
        position: "relative",
        backgroundImage: "url('/drafts/adaptation-strategies.png')",
        backgroundSize: "100vw auto",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        zIndex: 1,
        "--rain-color": FreshWaterColor,
      }}
    >
      <RainAnimation />

      <Box
        width="100%"
        height="100%"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <motion.div
          className="text-container-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ marginTop: "10rem" }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "Because climate change depends on what happens around the world, it is hard to predict exactly how California will be affected."
              }
            </Typography>
            <Typography variant="body1">
              {
                "Each strategy we have discussed \u2014 from conserving water to building new infrastructure \u2014 has benefits and drawbacks that must be carefully weighed."
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "The key is finding the right combination of approaches that work for California's diverse communities, farms, and ecosystems."
              }
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}

// function to compute curve paths
function computeCurvePaths(width: number, height: number): string[] {
  if (width <= 0 || height <= 0) return []

  const X = d3.scaleLinear().domain([0, 1]).range([0, width])
  const N = 240
  const xs = d3.range(N).map((i) => i / (N - 1))

  // layout
  const mid = height * 0.5
  const band = height * 0.18
  const amp = band * 0.28 // overall magnitude (gentle)
  const cycles = 1 // one smooth wave across the width
  const k = 2 * Math.PI * cycles

  // Envelope that is 0 at x=0 and x=1, 1 at center (smooth, no sharp corners)
  const envelope = (x: number) => Math.pow(Math.sin(Math.PI * x), 1.1)

  // Four lanes, slightly spread, crossings near the center
  const pairs: ReadonlyArray<[number, number]> = [
    [-0.12, 0.0],
    [-0.06, Math.PI * 0.5],
    [0.09, Math.PI * 1.0],
    [0.03, Math.PI * 1.0],
    [0.12, Math.PI * 1.5],
  ]

  const lineGen = d3
    .line<[number, number]>()
    .curve(d3.curveCatmullRom.alpha(0.8))
    .x((d) => d[0])
    .y((d) => d[1])

  return pairs.map(([off, phase]) => {
    const pts = xs.map((x) => {
      const A = amp * envelope(x) // tapers at both ends
      const y = mid + off * band + A * Math.sin(k * x + phase)
      return [X(x), y] as [number, number]
    })
    return lineGen(pts)!
  })
}

function Bullet() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [paths, setPaths] = useState<string[]>([])
  const [strokeWidth, setStrokeWidth] = useState<number>(4)

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const render = () => {
      const { width, height } = svgEl.getBoundingClientRect()
      setPaths(computeCurvePaths(width, height))
      setStrokeWidth(Math.max(2, width * 0.0015))
    }

    render()
    const ro = new ResizeObserver(render)
    ro.observe(svgEl)
    return () => ro.disconnect()
  }, [])

  return (
    <Box
      id="bullet"
      className="container-center"
      height="100vh"
      width="100%"
      sx={{
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
      tabIndex={-1}
      role="region"
    >
      {/* Animated curves */}
      <motion.svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        {paths.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="#F1B143"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeOpacity={0.5}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.5 }}
            viewport={{ once: false, amount: 0.2 }} // retrigger
            transition={{
              duration: 1,
              ease: "easeInOut",
              delay: i * 0.25,
            }}
          />
        ))}
      </motion.svg>

      {/* text overlay */}
      <Box
        className="paragraph"
        component="article"
        sx={{ position: "relative" }}
      >
        <Typography variant="h2">
          What is clear is that there is no silver bullet
        </Typography>
        <Typography variant="h2">
          to solve California&apos;s water problems.
        </Typography>
      </Box>
    </Box>
  )
}

export default SectionTransition
