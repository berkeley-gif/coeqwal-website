"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { useStoryline } from "../store"
import { useRef, useState } from "react"
import Underline from "./helpers/Underline"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import { InfrastructureColor } from "./helpers/colorPalette"

const MotionTypography = motion.create(Typography)

export default function Transformation() {
  const storyline = useStoryline()
  const content = storyline?.transformation
  const sectionRef = useRef(null)
  const [startAnimation, setStartAnimation] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
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

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.5) setStartAnimation(true)
  })

  return (
    <Box ref={sectionRef} className="container">
      <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
        <Typography variant="h1" gutterBottom>
          {content?.subtitle1}
          <br />
          {content?.subtitle2}
        </Typography>
      </motion.div>

      <Stack spacing={4} direction="column" component="section" role="region">
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
          style={{ opacity: fifthParagraphOpacity, width: "80vw" }}
        >
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
