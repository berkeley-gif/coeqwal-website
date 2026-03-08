"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import { useStoryline } from "../store"
import { useRef } from "react"
import { motion, useScroll, useTransform } from "@repo/motion"
import { InfrastructureColor } from "./helpers/colorPalette"

const MotionTypography = motion.create(Typography)

export function GoldRush() {
  const storyline = useStoryline()
  const content = storyline?.economy
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.5],
    [0, 1],
  )

  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )

  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      <motion.div
        className="paragraph"
        style={{ opacity: firstParagraphOpacity }}
      >
        <Typography variant="h3" gutterBottom>
          {" "}
          {content?.title}{" "}
        </Typography>
      </motion.div>

      <Stack spacing={6} direction="column">
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1"> {content?.p2}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: thirdParagraphOpacity, marginTop: "5%" }}
        >
          <Typography>{content?.irrigation.p1}</Typography>
          <Typography>{content?.irrigation.p2}</Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export function Drinking() {
  const storyline = useStoryline()
  const content = storyline?.economy.drinking
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.35, 0.55],
    [0, 1],
  )
  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      <Box className="paragraph">
        <MotionTypography style={{ opacity: firstParagraphOpacity }}>
          {content?.p1}
        </MotionTypography>
        <MotionTypography style={{ opacity: secondParagraphOpacity }}>
          {content?.p2}
        </MotionTypography>
        <MotionTypography style={{ opacity: thirdParagraphOpacity }}>
          It required water rights and major investments as{" "}
          <span style={{ color: InfrastructureColor }}>
            water infrastructure
          </span>{" "}
          began to crisscross the state
        </MotionTypography>
      </Box>
    </Box>
  )
}
