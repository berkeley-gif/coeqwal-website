"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useEffect, useState } from "react"
import { useMap } from "@repo/map"
import Underline from "./helpers/Underline"
import { DAMS } from "./helpers/data/dams"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import { InfrastructureColor } from "./helpers/colorPalette"

const MotionTypography = motion.create(Typography)

function SectionTransformation() {
  return (
    <>
      <Transformation />
    </>
  )
}

function Transformation() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.transformation
  const { sectionRef } = useActiveSection("transformation", {
    amount: 0.5,
  })
  const { setPaintProperty } = useMap()
  const [startAnimation, setStartAnimation] = useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.4 && latest < 0.9) {
      setPaintProperty("canal-layer", "line-opacity", 1)
      setPaintProperty("delta-canal-layer", "line-opacity", 1)
      setPaintProperty("nhd-rivers-layer", "line-opacity", 1)
      //setPaintProperty("river-sac-layer", "line-opacity", 1)
      //setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
      if (!hasSetMarkers) {
        setHasSetMarkers(true)
        setMarkers(DAMS, "dam")
      }
    } else if (latest < 0.35 || latest > 0.95) {
      setMarkers([], "dam")
      setHasSetMarkers(false)
      setPaintProperty("delta-canal-layer", "line-opacity", 0)
      setPaintProperty("nhd-rivers-layer", "line-opacity", 0)
      //setPaintProperty("river-sac-layer", "line-opacity", 0)
      //setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
      if (latest > 0.9) {
        setPaintProperty("canal-layer", "line-opacity", 0)
      }
    }
  })

  const titleOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1])
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.6],
    [0, 1],
  )
  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.55, 0.65],
    [0, 1],
  )
  const fourthParagraphOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.7],
    [0, 1],
  )
  const fifthParagraphOpacity = useTransform(
    scrollYProgress,
    [0.65, 0.85],
    [0, 1],
  )

  useEffect(() => {
    const unsubscribe = fifthParagraphOpacity.on("change", (value) => {
      if (value > 0.8) setStartAnimation(true)
    })
    return unsubscribe
  }, [fifthParagraphOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="130vh"
      sx={{ justifyContent: "space-around" }}
    >
      <Stack spacing={12} direction="column" component="section" role="region">
        <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
          <Typography variant="h2" gutterBottom>
            {content?.subtitle1}
            <br />
            {content?.subtitle2}
          </Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography>
            <span style={{ fontWeight: "bold" }}>
              <u>{content?.p11}</u>
            </span>{" "}
            <LibraryBooksIcon
              sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
            />{" "}
            {/* Link to how water is managed in California*/}
            stores and transports water over thousands of miles
          </Typography>
          <Typography>from wetter to drier parts of the state.</Typography>
        </motion.div>
        <Box className="paragraph">
          <Stack spacing={0} direction="column">
            <MotionTypography style={{ opacity: secondParagraphOpacity }}>
              {content?.p21}{" "}
              <span style={{ fontWeight: "bold", color: InfrastructureColor }}>
                {content?.p22}
              </span>{" "}
              {
                //content?.p23
                "water behind "
              }
              <span style={{ color: InfrastructureColor }}>
                {"dams \u25bc"}
              </span>{" "}
              {"in the wet season, so it can be released later in the year."}
            </MotionTypography>
            <MotionTypography style={{ opacity: thirdParagraphOpacity }}>
              {content?.p31}{" "}
              <span style={{ fontWeight: "bold", color: InfrastructureColor }}>
                {content?.p32}
              </span>{" "}
              {content?.p33}
            </MotionTypography>
            <MotionTypography style={{ opacity: fourthParagraphOpacity }}>
              {content?.p41}{" "}
              <span style={{ fontWeight: "bold", color: InfrastructureColor }}>
                {content?.p42}
              </span>{" "}
              {content?.p43}
            </MotionTypography>
          </Stack>
        </Box>
        <motion.div
          className="paragraph"
          // width is necessary for the auto line break
          style={{ opacity: fifthParagraphOpacity, width: "80vw" }}
        >
          {/*<Typography>
            Over the past 175 years, the timing and pathways of
            California&apos;s water flows
          </Typography>*/}
          <Typography className="overflow-text">
            {content?.transition.p11}{" "}
            <Underline startAnimation={startAnimation}>
              {content?.transition.p12}
            </Underline>
            {content?.transition.p13}
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export default SectionTransformation
