"use client"

import { motion} from "@repo/motion"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useEffect, useRef, useMemo, useState } from "react"
import * as d3 from "d3"

function SectionTransition() {
  return (
    <>
      <Balance />
      <Bullet />
    </>
  )
}

function Balance() {
  return (
    <Box
      id="balance"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Stack spacing={12} direction="column" style={{ margin: "1rem 3rem" }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
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
        </motion.div>
        <Box
          className="paragraph"
          sx={{
            width: "100%",
            height: "40vh",
            justifyContent: "center",
            display: "flex",
            backgroundColor: "#757575",
          }}
        >
          Placeholder
        </Box>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "The key is finding the right combination of approaches that work for California's diverse communities, farms, and ecosystems."
              }
            </Typography>
          </Box>
        </motion.div>
      </Stack>
    </Box>
  )
}

// function Bullet() {
//   return (
//     <Box
//       id="bullet"
//       className="container-center"
//       height="100vh"
//       sx={{
//         justifyContent: "center",
//         backgroundImage: "url('/drafts/trajectory.png')",
//         backgroundSize: "contain",
//         backgroundPosition: "center",
//         backgroundRepeat: "no-repeat",
//         position: "relative",
//       }}
//       tabIndex={-1}
//       role="region"
//     >
//       <motion.div
//         initial={{ scaleX: 1 }}
//         whileInView={{ scaleX: 0 }}
//         transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
//         style={{
//           width: "100%",
//           height: "100%",
//           position: "absolute",
//           transformOrigin: "right",
//           backgroundColor: "#1a4472",
//         }}
//       ></motion.div>
//       <motion.div
//         initial={{ opacity: 0 }}
//         whileInView={{ opacity: 1 }}
//         transition={{ duration: 1, delay: 0.5 }}
//       >
//         <Box className="paragraph" component="article">
//           <Typography variant="h2">
//             {"What is clear is that there is no silver bullet"}
//           </Typography>
//           <Typography variant="h2">
//             {"to solve California's water problems."}
//           </Typography>
//         </Box>
//       </motion.div>
//     </Box>
//   )
// }


// function to compute curve paths
function computeCurvePaths(width: number, height: number): string[] {
  if (width <= 0 || height <= 0) return []

  const X = d3.scaleLinear().domain([0, 1]).range([0, width])
  const N = 240
  const xs = d3.range(N).map(i => i / (N - 1))

  // layout
  const mid = height * 0.5
  const band = height * 0.18
  const amp = band * 0.28         // overall magnitude (gentle)
  const cycles = 1                // one smooth wave across the width
  const k = 2 * Math.PI * cycles

  // Envelope that is 0 at x=0 and x=1, 1 at center (smooth, no sharp corners)
  const envelope = (x: number) => Math.pow(Math.sin(Math.PI * x), 1.1)

  // Four lanes, slightly spread, crossings near the center
  const pairs: ReadonlyArray<[number, number]> = [
    [-0.36, 0.0],
    [-0.18, Math.PI * 0.5],
    [ 0.18, Math.PI * 1.0],
    [ 0.36, Math.PI * 1.5],
  ]

  const lineGen = d3.line<[number, number]>()
    .curve(d3.curveCatmullRom.alpha(0.8))
    .x(d => d[0])
    .y(d => d[1])

  return pairs.map(([off, phase]) => {
    const pts = xs.map(x => {
      const A = amp * envelope(x)               // tapers at both ends
      const y = mid + off * band + A * Math.sin(k * x + phase)
      return [X(x), y] as [number, number]
    })
    return lineGen(pts)!
  })
}

function Bullet() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [paths, setPaths] = useState<string[]>([])
  const [strokeWidth, setStrokeWidth] = useState<number>(2)

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
            stroke="#e2b267"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.5 }}
            viewport={{ once: false, amount: 0.2 }} // retrigger
            transition={{
              duration: 3,
              ease: "easeInOut",
              delay: i * 0.25,
            }}
          />
        ))}
      </motion.svg>

      {/* text overlay */}
      <Box className="paragraph" component="article" sx={{ position: "relative" }}>
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
