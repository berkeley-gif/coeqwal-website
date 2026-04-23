"use client"

import { Box, Typography } from "@repo/ui/mui"
import { VerticalImageSlider } from "./helpers/ImageSlider"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { useEffect, useRef, useState } from "react"
import ScrollIndicator from "./helpers/ScrollIndicator"
import SVGLineContainer from "./helpers/SVGLineContainer"
import theme from "@repo/ui/themes/theme"

//TODO: see if I can fix this SVG Line issue
function Opener() {
  const [hideHint, setHideHint] = useState(false)
  const [knobReady, setKnobReady] = useState(false)
  const [lineShouldGrow, setLineShouldGrow] = useState(false)

  useEffect(() => {
    if (!lineShouldGrow && knobReady && !hideHint) {
      setLineShouldGrow(true)
    }
  }, [knobReady, hideHint, lineShouldGrow])

  return (
    <Box
      height="100vh"
      className="container-center"
      sx={{ justifyContent: "center", position: "relative" }}
    >
      <SourceAnnouncer />
      <VerticalImageSlider
        topSrc="/images/oroville_2023_aligned.png"
        bottomSrc="/images/oroville_2021_aligned.png"
        onFirstUserDrag={() => setHideHint(true)}
        onKnobVisible={() => setKnobReady(true)}
      />

      <SVGLineContainer viewBox="0 0 1728 1095" preserveAspectRatio="none">
        <motion.path
          d="M0 537 L1728 807"
          className="svg-line glow-effect"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: lineShouldGrow ? 1 : 0,
            opacity: lineShouldGrow ? 1 : 0,
          }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{
            filter: "drop-shadow(0 0 6px rgba(199, 171, 112, 0.35))",
          }}
        />
      </SVGLineContainer>

      {knobReady && !hideHint && (
        <Box
          sx={{
            position: "absolute",
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Typography
            variant="body2"
            className="text-shadow"
            sx={{ opacity: 0.85 }}
          >
            Drag this to see how California water can change in two years!
          </Typography>
        </Box>
      )}
      {/* Title */}
      <Box
        className="paragraph text-center-holder"
        component="header"
        role="banner"
        sx={{
          top: "50%",
          zIndex: 2,
          pointerEvents: "none",
          textShadow: theme.textShadow.display,
        }}
      >
        <Typography
          variant="h1"
          sx={{ textShadow: "0 2px 18px rgba(0, 0, 0, 1)" }}
        >
          {"How Climate Change Affects California's Water"}
        </Typography>
        <Typography
          variant="h3"
          gutterBottom
          sx={{ textShadow: "0 5px 14px rgba(0, 0, 0, 1)" }}
        >
          {"Adapting to a Hotter, More Uncertain Climate Future"}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            maxWidth: "70%",
            margin: "0 auto",
            textShadow: "0 1px 10px rgba(0, 0, 0, 1)",
          }}
        >
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
          top: "45px",
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
        color: "common.white",
        backgroundColor: "overlay.waterDark",
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <Box>
        <p>Enterprise Bridge at Oroville Dam</p>
        <p>{"Wet year \u2014 2023 (top)"}</p>
        <p>{"Dry year \u2014 2021 (bottom)"}</p>
        <p>Photo by Justin Sullivan</p>
      </Box>
    </motion.div>
  )
}

export default Opener
