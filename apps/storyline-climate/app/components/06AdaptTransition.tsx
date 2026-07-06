"use client"

import { motion, useScroll, useTransform } from "@repo/motion"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box } from "@repo/ui/mui"
import { useEffect, useRef, useState } from "react"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { scaleLinear, range, line, curveCatmullRom } from "@repo/viz"
import "../rain.css"
import { FreshWaterColor } from "./helpers/colorPalette"
import RainAnimation from "./helpers/RainAnimation"
import SVGLineContainer from "./helpers/SVGLineContainer"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"

const uncertaintyBlocks = [
  {
    text: "While many aspects of climate change are well understood, the rate and degree in which the climate will change is difficult to predict.",
  },
  {
    segments: [
      {
        text: "The impacts of climate change on our water system also depend on the actions we take now.",
        mark: "strong",
      },
    ],
  },
]

const actionBlocks = [
  {
    text: "We may choose to limit groundwater pumping, restore watersheds, modify reservoir operations, or build new water engineering projects.",
  },
  {
    text: "Each of these actions comes with different costs, benefits, and tradeoffs that must be carefully weighed.",
  },
  {
    text: "The key is finding the right combination of approaches that balance California's diverse water needs while also building flexibility to adapt our water system to a changing climate.",
  },
]

export default function Balance() {
  return (
    <StickyScrollSection
      id="balance"
      ariaLabel="Balancing climate adaptation actions"
      height="220vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <BalanceContent />
    </StickyScrollSection>
  )
}

function BalanceContent() {
  const progress = useScrollProgress()

  const firstLinePath = useScrollValue(progress, [0.3, 0.7], [0, 1])
  const secondaryLinePath = useScrollValue(progress, [0.45, 0.85], [0, 1])
  const thirdLinePath = useScrollValue(progress, [0.5, 1], [0, 1])
  const opacity = useScrollValue(progress, [0.5, 0.6], [0, 1])
  const paragraphOneOpacity = useScrollValue(
    progress,
    [0.22, 0.42],
    [0, 1],
  )
  const paragraphTwoOpacity = useScrollValue(
    progress,
    [0.38, 0.58],
    [0, 1],
  )

  return (
    <>
      <Box
        width="100%"
        height="100%"
        sx={{
          position: "absolute",
          "--rain-color": FreshWaterColor,
          overflow: "hidden",
        }}
      >
        <RainAnimation />
      </Box>

      <SVGLineContainer viewBox="0 0 1261 1145" preserveAspectRatio="xMaxYMax">
        <motion.path
          className="svg-line"
          pathLength={thirdLinePath}
          style={{ opacity }}
          d="M810.118 364C810.118 364 865.118 356.812 871.118 414C877.118 471.188 666.118 280 749.118 403C832.118 526 1032.12 199 1031.12 344C1030.12 489 663.118 365 782.118 403C901.118 441 898.118 188 782.118 274C666.118 360 1009.12 273 973.118 374C937.118 475 876.118 570 804.118 492C732.118 414 839.118 434 928.118 364C1017.12 294 931.118 555 1021.12 424C1111.12 293 817.118 433 816.118 522C815.118 611 643.118 720 543.118 726C443.118 732 245.118 894 303.118 941C361.118 988 118.118 1163 0.118164 1156"
        />
        <motion.path
          className="svg-line"
          pathLength={firstLinePath}
          d="M1225.12 -75C1225.12 -75 1146.12 7 1059.12 42C972.122 77 1003.12 250 1059.12 199C1115.12 148 935.122 171 978.122 215C1021.12 259 864.122 227 869.122 330C874.122 433 1025.12 217 853.122 276C681.122 335 1059.12 491 973.122 347C887.122 203 717.123 408 834.123 421C951.123 434 978.122 485 869.122 567C760.122 649 833.118 824 733.118 903C633.119 982 1037.12 1165 1037.12 1165"
        />
        <motion.path
          className="svg-line"
          pathLength={secondaryLinePath}
          style={{ opacity }}
          d="M938.118 344C938.118 344 764.118 443 828.118 361C892.118 279 702.063 320 773.063 424C844.063 528 955.118 498 842.118 483C729.118 468 922.118 423 925.118 361C928.118 299 816.118 368 763.118 436C710.118 504 1059.12 409 977.118 506C895.118 603 886.118 327 972.118 378C1058.12 429 896.118 418 856.118 522C816.118 626 995.118 624 1002.12 721C1009.12 818 1053.12 966 1186.12 1001C1319.12 1036 1366.12 1111 1366.12 1111"
        />
      </SVGLineContainer>

      <Box
        className="text-section"
        width="65%"
        height="100%"
        gap={10}
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <motion.div style={{ opacity: paragraphOneOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={uncertaintyBlocks} gutterBottom />
          </Box>
        </motion.div>
        <motion.div style={{ opacity: paragraphTwoOpacity }}>
          <Box className="paragraph" component="article">
            <Paragraph blocks={actionBlocks} />
          </Box>
        </motion.div>
      </Box>
    </>
  )
}

// function to compute curve paths
function computeCurvePaths(width: number, height: number): string[] {
  if (width <= 0 || height <= 0) return []

  const X = scaleLinear().domain([0, 1]).range([0, width])
  const N = 240
  const xs = range(N).map((i) => i / (N - 1))

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

  const lineGen = line<[number, number]>()
    .curve(curveCatmullRom.alpha(0.8))
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

export function Bullet() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [paths, setPaths] = useState<string[]>([])
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
    layoutEffect: false,
  })
  const bulletPathLength = useTransform(scrollYProgress, [0.2, 0.5], [0, 1])
  const bulletOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.1, 0.3],
    [0, 0.5],
  )
  const textOpacity = useTransform(scrollYProgress, [0.25, 0.45], [0, 1])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const render = () => {
      const { width, height } = svgEl.getBoundingClientRect()
      setPaths(computeCurvePaths(width, height))
    }

    render()
    const ro = new ResizeObserver(render)
    ro.observe(svgEl)
    return () => ro.disconnect()
  }, [])

  return (
    <Box
      component={motion.div}
      ref={sectionRef}
      id="bullet"
      className="container-center"
      height="110vh"
      width="100%"
      sx={{
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
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
            className="svg-line"
            pathLength={bulletPathLength}
            style={{ opacity: bulletOpacity }}
          />
        ))}
      </motion.svg>

      {/* text overlay */}
      <motion.div style={{ opacity: textOpacity }}>
        <Box
          className="paragraph"
          component="article"
          sx={{ position: "relative" }}
        >
          <SectionTitle
            variant="h2"
            text={[
              {
                text: "What is clear is that there is no simple solution to the challenge that climate change poses to California water.",
              },
            ]}
          />
        </Box>
      </motion.div>
    </Box>
  )
}
