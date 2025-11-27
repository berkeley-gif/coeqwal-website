"use client"

import { Box, Typography } from "@repo/ui/mui"
import { VerticalImageSlider } from "./helpers/ImageSlider"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { useRef, useState } from "react"
import ScrollIndicator from "./helpers/ScrollIndicator"

function Opener() {
  return (
    <Box
      id="opener"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center", position: "relative" }}
      tabIndex={-1}
      role="region"
    >
      <SourceAnnouncer />
      <VerticalImageSlider
        topSrc="/images/oroville_2021_aligned.png"
        bottomSrc="/images/oroville_2023_aligned.png"
      />
      <Box
        className="paragraph text-center-holder text-shadow"
        component="header"
        role="banner"
        sx={{ top: "50%", pointerEvents: "none" }}
      >
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {"How Climate Change Affects California's Water"}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {"Adapting to a Hotter, More Uncertain Climate Future"}
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: "70%", margin: "0 auto" }}>
          {
            "Whether you’re a farmer worried about drought, a homeowner concerned about your water bill, or someone who cares about California’s wildlife, the impacts of climate change on California’s water are important to understand."
          }
        </Typography>
        <ScrollIndicator animationComplete={true} />
      </Box>
    </Box>
  )
}

function SourceAnnouncer() {
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
      className="panel"
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        zIndex: 3,
      }}
    >
      <Box>
        <p>Enterprise Bridge at Oroville Dam</p>
        <p>{"Dry year \u2014 2021 (top)"}</p>
        <p>{"Wet year \u2014 2023 (bottom)"}</p>
        <p>Photo by Justin Sullivan</p>
      </Box>
    </motion.div>
  )
}

export default Opener
