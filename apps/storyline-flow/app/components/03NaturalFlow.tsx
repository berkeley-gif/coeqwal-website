"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import Bird from "./vis/Bird"
import Grass from "./vis/Grass"
import { useRef, useState } from "react"
import { useStoryline } from "../store"
import { Sentence } from "@repo/motion/components"
import Underline from "./helpers/Underline"
import { FreshWaterColor } from "./helpers/colorPalette"

const MotionBox = motion.create(Box)
const MotionTypography = motion.create(Typography)

export function MajorRiver() {
  const storyline = useStoryline()
  const content = storyline?.flow
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const titleOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1])
  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      {/* Title */}
      <motion.div className="paragraph" style={{ opacity: titleOpacity }}>
        <Typography variant="h3" gutterBottom>
          {content?.title}
        </Typography>
      </motion.div>
      {/* Paragraph */}
      <Stack spacing={6} direction="column">
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1">{content?.p2}</Typography>
          <Typography variant="body1">{content?.p3}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1">{content?.p41}</Typography>
          <Typography variant="body1">
            <span style={{ fontWeight: "bold", color: FreshWaterColor }}>
              {content?.p42}
            </span>
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export function CentralValley() {
  const storyline = useStoryline()
  const content = storyline?.flow
  const sectionRef = useRef(null)
  const [startAnimation, setStartAnimation] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.5) {
      setStartAnimation(true)
    }
  })

  return (
    <Box ref={sectionRef} className="container">
      <Box className="paragraph">
        <Sentence custom={0} options={{ amount: 1 }}>
          {content?.valley.p11}
          <Underline startAnimation={startAnimation} delay={0}>
            {content?.valley.p12}
          </Underline>
          {content?.valley.p13}
        </Sentence>
      </Box>
    </Box>
  )
}

export function DeltaWetland() {
  const storyline = useStoryline()
  const content = storyline?.flow
  const sectionRef = useRef(null)
  const [startDeltaAnimation, setStartDeltaAnimation] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.4) setStartDeltaAnimation(true)
  })

  const firstParagraphOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [0, 1],
  )
  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )
  const captionOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 0.7])

  return (
    <Box ref={sectionRef} className="container">
      <Stack
        spacing={6}
        direction="column"
        component="section"
        role="region"
        sx={{ width: "100%" }}
      >
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography variant="body1">{content?.valley.p2}</Typography>
          <Typography variant="body1">{content?.valley.p3}</Typography>
          <Typography variant="body1">{content?.valley.p4}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography variant="body1">
            {content?.transition.p11}
            <Underline startAnimation={startDeltaAnimation}>
              {content?.transition.p12}
            </Underline>
            {content?.transition.p13}
          </Typography>
          <Typography variant="body1">{content?.transition.p14}</Typography>
        </motion.div>
        <div className="paragraph">
          <motion.div style={{ opacity: thirdParagraphOpacity }}>
            <Typography variant="body1">{content?.transition.p2}</Typography>
          </motion.div>
          <motion.div style={{ opacity: captionOpacity }}>
            <Typography variant="caption">
              GIS data source:{" "}
              <a
                href="https://www.sfei.org/projects/sacramento-san-joaquin-delta-historical-ecology-study#toc-associated-data"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                San Francisco Estuary Institute
              </a>
            </Typography>
          </motion.div>
        </div>
      </Stack>
    </Box>
  )
}

export function HistoricalDelta() {
  const storyline = useStoryline()
  const content = storyline?.delta
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const sectionOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.7, 0.9],
    [0, 1, 1, 0],
  )

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.7, 0.95],
    [0, 1, 1, 0],
  )
  const captionOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.7, 0.95],
    [0, 0.7, 0.7, 0],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.25, 0.5, 0.7, 0.95],
    [0, 1, 1, 0],
  )
  const firstSentenceOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6, 0.7, 0.95],
    [0, 1, 1, 0],
  )
  const secondSentenceOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.65, 0.7, 0.95],
    [0, 1, 1, 0],
  )
  const thirdSentenceOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7, 0.7, 0.95],
    [0, 1, 1, 0],
  )

  return (
    <Box
      height="auto"
      sx={{
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="100vh" // Control this to determine how long the section is visible
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box
        className="sticky-container"
        sx={{
          position: "sticky",
        }}
      >
        <motion.div
          id="sticky-delta"
          className="filled-container"
          style={{
            height: "50vh",
            width: "100%",
          }}
        >
          <Bird opacity={sectionOpacity} />
          <Grass opacity={sectionOpacity} />
          <motion.div
            className="paragraph"
            style={{ opacity: firstParagraphOpacity }}
          >
            <Typography variant="body1">
              {content?.p11}{" "}
              <span style={{ fontWeight: "bold" }}>{content?.p12}</span>
              {""}
              {content?.p13}
            </Typography>
          </motion.div>
          <motion.div
            className="paragraph"
            style={{ opacity: secondParagraphOpacity }}
          >
            <Typography variant="body1">{content?.p2}</Typography>
          </motion.div>
          <Box
            className="paragraph"
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MotionTypography
              variant="body1"
              style={{ opacity: firstSentenceOpacity }}
            >
              {content?.p3}
            </MotionTypography>
            <MotionTypography
              variant="body1"
              style={{ opacity: secondSentenceOpacity }}
            >
              {content?.p4}
            </MotionTypography>
            <MotionTypography
              variant="body1"
              style={{ opacity: thirdSentenceOpacity }}
              gutterBottom
            >
              {content?.p5}
            </MotionTypography>
            <MotionTypography
              variant="caption"
              style={{ opacity: captionOpacity }}
            >
              GIS data source:{" "}
              <a
                href="https://gis.data.cnra.ca.gov/maps/3efc635b27344a3da989ca1e7108f5e0/explore?location=38.104861%2C-121.568577%2C9.99"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                California Natural Resources Agency
              </a>
            </MotionTypography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}

//TODO: sometimes see a 1px gap between this and Delta (found out the delta section is not high enough??)
export function TransitionFromDeltaToGoldRush() {
  const storyline = useStoryline()
  const content = storyline?.delta
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0.6, 1], [1, 0])

  return (
    <MotionBox
      style={{
        width: "100%",
        height: "100%",
        zIndex: 1,
        opacity: opacity,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "150vh",
          zIndex: 2,
          overflowY: "hidden",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.3"
            initial={{ r: 0 }}
            animate={{ r: [0, 45], opacity: [1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.3"
            initial={{ r: 0 }}
            animate={{ r: [0, 30], opacity: [1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
              repeatDelay: 1.5,
              ease: "easeOut",
            }}
          />
        </svg>
      </Box>
      <Box
        ref={sectionRef}
        className="container-center filled-container"
        height="100%"
        width="100%"
      >
        <Box className="paragraph" sx={{ p: 1 }}>
          <Typography variant="h2">{content?.transition}</Typography>
        </Box>
      </Box>
    </MotionBox>
  )
}

export default MajorRiver
