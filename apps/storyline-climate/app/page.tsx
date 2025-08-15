"use client"

import { useRef } from "react"
import { HeaderStory } from "@repo/motion/components"
import { Box } from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import Snowmelt from "./components/02Snowmelt"
import Delta from "./components/03Delta"
import Whiplash from "./components/04Whiplash"
import SectionTransition from "./components/07AdaptTransition"
import SectionSupply from "./components/05Groundwater"
import SectionResolution from "./components/08Hydroclimate"
import Conclusion from "./components/09Conclusion"

export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <HeaderStory />
      <Box
        component="main"
        ref={containerRef}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          padding: 0,
          width: "100%",
          "& > *": {
            margin: 0,
          },
          pointerEvents: "none",
        }}
      >
        <Opener />
        <Snowmelt />
        <Delta />
        <Whiplash />
        <SectionSupply />
        <SectionTransition />
        <SectionResolution />
        <Conclusion />
      </Box>
    </>
  )
}
