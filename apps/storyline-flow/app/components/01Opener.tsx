"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { useCallback, useEffect, useRef, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import Underline from "./helpers/Underline"
import ScrollIndicator from "./helpers/ScrollIndicator"
import { useMap } from "@repo/map"
import { useBreakpoint } from "@repo/ui/hooks"
import { stateMapViewState } from "./helpers/mapViews"

function Opener() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.opener
  const { sectionRef, isSectionActive } = useActiveSection("opener", {
    amount: 0.5,
  })
  const [startAnimation, setStartAnimation] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const hasSeen = useRef(false)
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]
  const { flyTo } = useMap()

  const opacityFloatVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 2, type: "spring", delay: 1, once: true },
    },
  }

  //TODO: temporary fix because mapcontainer is loading the wrong view state by default
  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 0,
      pitch: mapViewState?.pitch ?? 0,
      bearing: mapViewState?.bearing ?? 0,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load])

  return (
    <Box
      ref={sectionRef}
      id="opener"
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="header" role="banner">
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {content?.title}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {content?.subtitle}
        </Typography>
      </Box>
      <Stack spacing={12} direction="column" component="section" role="region">
        <Box className="paragraph" component="article">
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1">{content?.p2}</Typography>
        </Box>
        <motion.div
          className="paragraph"
          aria-labelledby="opener-throughline"
          variants={opacityFloatVariants}
          initial="hidden"
          animate="visible"
          onAnimationComplete={() => {
            setStartAnimation(true)
            setAnimationComplete(true)
          }}
        >
          <Typography id="throughline-heading" variant="body1">
            {content?.throughline.p11}
            <Underline startAnimation={startAnimation}>
              {content?.throughline.p12}
            </Underline>
            {content?.throughline.p13}
          </Typography>
        </motion.div>
      </Stack>
      <ScrollIndicator animationComplete={animationComplete} delay={1} />
    </Box>
  )
}

export default Opener
