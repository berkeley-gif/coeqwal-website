"use client"

import { ImageCaption, Paragraph, StorylineOpener } from "@repo/ui"
import { Box, Typography } from "@repo/ui/mui"
import { VerticalImageSlider } from "./helpers/ImageSlider"
import { motion } from "@repo/motion"
import { useEffect, useState } from "react"
import ScrollIndicator from "./helpers/ScrollIndicator"
import SVGLineContainer from "./helpers/SVGLineContainer"

const openerBody = [
  {
    text: "Whether you're a farmer worried about drought, a resident concerned about the water security of your community, or someone who cares about California's wildlife, the impacts of climate change on California's water are important to understand.",
  },
]

//TODO: decide on maxWidth should be 70ch or what
//TODO: make sure the line matches the images across the devices
//TODO: style ImageCaption style
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
      sx={{ position: "relative" }}
    >
      <ImageCaption
        hideOnScroll
        placement="top-left"
        offset={30}
        hiddenTop="45px"
        visibleTop="74.5px"
        lines={[
          "Enterprise Bridge at Oroville Dam",
          "Wet year \u2014 2023 (top)",
          "Dry year \u2014 2021 (bottom)",
          "Photo by Justin Sullivan",
        ]}
        sx={{ backgroundColor: "rgba(33, 33, 33, 0.58)" }}
      />
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
      <StorylineOpener
        title="How climate change affects California's water"
        subtitle="Adapting to a hotter, more uncertain climate future"
        alignment="center"
        textShadow
        scrollIndicator={<ScrollIndicator animationComplete={true} />}
        sx={{
          top: "50%",
          px: { xs: 3, md: 6, lg: 10 },
          "@media (min-width: 750px) and (max-width: 1199.95px) and (max-height: 800px)":
            {
              top: "52%",
            },
          "@media (min-width: 900px) and (max-width: 1535.95px)": {
            "& > .MuiTypography-h1": {
              fontSize: "clamp(3.25rem, 5.4vw, 4.75rem)",
              lineHeight: 0.98,
            },
            "& > .MuiTypography-h3": {
              fontSize: "clamp(2rem, 3.3vw, 3rem)",
              lineHeight: 1.05,
            },
          },
        }}
      >
        <Paragraph
          variant="body1"
          blocks={openerBody}
          alignment="center"
          sx={{
            maxWidth: { xs: "88%", md: "78%", lg: "70%" },
            textShadow: "0 1px 10px rgba(0, 0, 0, 1)",
          }}
        />
      </StorylineOpener>
    </Box>
  )
}

export default Opener
