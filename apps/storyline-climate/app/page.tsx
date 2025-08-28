"use client"

import { useRef, useState } from "react"
import { HeaderStory } from "@repo/motion/components"
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@repo/ui/mui"
import "./main.css"

import Opener from "./components/01Opener"
import Snowmelt from "./components/02Snowmelt"
import Delta from "./components/03Delta"
import Whiplash from "./components/04Whiplash"
import SectionTransition from "./components/07AdaptTransition"
import SectionSupply from "./components/05Groundwater"
import SectionResolution from "./components/08Resolution"
import Conveyance from "./components/06Conveyance"
import { motion, useScroll, useMotionValueEvent } from "@repo/motion"

export default function StoryContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [useNewPlot, setUseNewPlot] = useState(true)

  return (
    <>
      <HeaderStory />
      <SelectionPanel
        updateOnPlot={(value) => {
          setUseNewPlot(value === "new")
        }}
      />
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
        {useNewPlot ? (
          <>
            <Opener />
            <Snowmelt />
            <SectionSupply />
            <Delta />
            <Conveyance />
            <Whiplash />
            <SectionTransition />
            <SectionResolution />
          </>
        ) : (
          <>
            <Opener />
            <Snowmelt />
            <Delta />
            <Whiplash />
            <SectionSupply />
            <Conveyance />
            <SectionTransition />
            <SectionResolution />
          </>
        )}
      </Box>
    </>
  )
}

function SelectionPanel({
  updateOnPlot,
}: {
  updateOnPlot: (value: string) => void
}) {
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)
  const [isHidden, setIsHidden] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  return (
    <motion.div
      animate={isHidden ? "hidden" : "visible"}
      variants={{
        hidden: {
          top: "10px",
        },
        visible: {
          top: "74.5px",
        },
      }}
      transition={{ duration: 0.3 }}
      className="selection-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        zIndex: 3,
      }}
    >
      <Box>
        <FormControl>
          Opener (not implemented yet)
          <RadioGroup
            row
            name="row-radio-buttons-group"
            defaultValue={"oroville"}
          >
            <FormControlLabel
              value="oroville"
              control={<Radio />}
              label="Oroville"
            />
            <FormControlLabel
              value="temperature"
              control={<Radio />}
              label="Temperature"
            />
            <FormControlLabel
              value="sealevel"
              control={<Radio />}
              label="Sea Level"
            />
          </RadioGroup>
        </FormControl>
      </Box>
      <Box>
        <FormControl>
          Plot
          <RadioGroup
            row
            name="row-radio-buttons-group"
            defaultValue={"new"}
            onChange={(event) => {
              updateOnPlot(event.target.value)
            }}
          >
            <FormControlLabel
              value="original"
              control={<Radio />}
              label="Original"
            />
            <FormControlLabel value="new" control={<Radio />} label="New" />
          </RadioGroup>
        </FormControl>
      </Box>
    </motion.div>
  )
}
