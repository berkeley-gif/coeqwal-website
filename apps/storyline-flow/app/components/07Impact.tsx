"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { useRef } from "react"
import { useStoryline } from "../store"
import { motion, useScroll, useTransform } from "@repo/motion"

export function TransitionToImpact() {
  const storyline = useStoryline()
  const content = storyline?.impact.benefits
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstSentenceOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1])

  const secondSentenceOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      <motion.div
        className="paragraph"
        style={{ opacity: firstSentenceOpacity }}
      >
        <Typography variant="body1" gutterBottom>
          {content?.p4}
        </Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: secondSentenceOpacity }}
      >
        <Typography variant="body1" gutterBottom sx={{ fontWeight: "bold" }}>
          {content?.transition}
        </Typography>
      </motion.div>
    </Box>
  )
}

export function Salmon() {
  const storyline = useStoryline()
  const content = storyline?.impact.salmon
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      <motion.div
        className="paragraph"
        style={{ opacity: firstParagraphOpacity }}
      >
        <Typography>{content?.p1}</Typography>
        <Typography>{content?.p2}</Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: secondParagraphOpacity }}
      >
        <Typography>
          {content?.p31}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p32}</span>{" "}
          {content?.p33}
        </Typography>
      </motion.div>
    </Box>
  )
}

export function Delta() {
  const storyline = useStoryline()
  const content = storyline?.impact.delta
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5],
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
        <Typography>
          <span style={{ fontWeight: "bold" }}>{content?.p11}</span>{" "}
          {content?.p12}
        </Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: secondParagraphOpacity }}
      >
        <Typography>
          {"At this meeting point of major rivers with the San Francisco Bay, "}
        </Typography>
        <Typography>
          {"we’re attempting to manage a complex, dynamic nexus of water."}
        </Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: thirdParagraphOpacity }}
      >
        <Typography>
          {content?.p3} {content?.p4}{" "}
        </Typography>
        <Typography>{content?.p5}</Typography>
      </motion.div>
    </Box>
  )
}

export function DrinkingWater() {
  const storyline = useStoryline()
  const content = storyline?.impact
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5],
    [0, 1],
  )
  const thirdParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )

  return (
    <Box ref={sectionRef} className="container">
      <Stack direction="column" spacing={6}>
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography>{content?.groundwater.p1}</Typography>
          <Typography>
            {content?.groundwater.p21}{" "}
            <span style={{ fontWeight: "bold" }}>
              {content?.groundwater.p22}
            </span>
            {content?.groundwater.p23}
          </Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography>{content?.groundwater.p3}</Typography>
        </motion.div>
      </Stack>
      <Stack direction="column" spacing={4}>
        <motion.div
          className="paragraph"
          style={{ opacity: thirdParagraphOpacity }}
        >
          <Typography>{content?.drinking.p1}</Typography>
          <Typography>
            {content?.drinking.p21}{" "}
            <span style={{ fontWeight: "bold" }}>{content?.drinking.p22}</span>
            {content?.drinking.p23}
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export function Climate() {
  const storyline = useStoryline()
  const content = storyline?.impact.climate
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

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
      <Stack direction="column" spacing={12}>
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography>
              <strong>
                <a
                  href="https://climate.coeqwal.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  {content?.p11}
                </a>
              </strong>{" "}
            <LibraryBooksIcon
              sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
            />{" "}
            {content?.p12}
          </Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography>
            {
              "We’re already seeing reduced winter snowpack, more extreme droughts, "
            }
          </Typography>
          <Typography>
            {"and sea level rise pushing saltwater farther into the Delta."}
          </Typography>
          <Typography>{content?.p3}</Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}
