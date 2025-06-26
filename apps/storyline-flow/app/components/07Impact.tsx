"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { useCallback } from "react"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"
import { motion, useScroll, useTransform } from "@repo/motion"
import { SacramentoDelta, ShastaDam } from "./helpers/mapAnnotations"

function SectionImpact() {
  return (
    <>
      <Transition />
      <Salmon />
      <Delta />
      <Groundwater />
      <Drinking />
      <Climate />
    </>
  )
}

function Transition() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.benefits
  const { sectionRef } = useActiveSection("turning", { amount: 0.5 })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstSentenceOpacity = useTransform(scrollYProgress, [0.5, 0.8], [0, 1])

  const secondSentenceOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="80vh"
      sx={{ justifyContent: "center" }}
    >
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

function Salmon() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.salmon
  const { sectionRef, isSectionActive } = useActiveSection("impact-salmon", {
    amount: 0.5,
  })
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    setTextMarkers([ShastaDam], "text")
  }, [setTextMarkers])

  const unload = useCallback(() => {
    setTextMarkers([], "text")
  }, [setTextMarkers])

  useSectionLifecycle(isSectionActive, () => {}, load, unload)

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
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <motion.div
        className="paragraph"
        style={{ opacity: firstParagraphOpacity }}
      >
        <Typography>{content?.p1}</Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: secondParagraphOpacity }}
      >
        <Typography>{content?.p2}</Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: thirdParagraphOpacity }}
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

function Delta() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.delta
  const { sectionRef, isSectionActive } = useActiveSection("impact-delta", {
    amount: 0.5,
  })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)

  const load = useCallback(() => {
    setTextMarkers([SacramentoDelta], "text")
  }, [setTextMarkers])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

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
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
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

function Groundwater() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.groundwater
  const { sectionRef, isSectionActive } = useActiveSection(
    "impact-groundwater",
    { amount: 0.5 },
  )
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    setTextMarkers([], "text")
  }, [setTextMarkers])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

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
    [0.7, 0.9],
    [0, 1],
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "space-around" }}
    >
      <Stack direction="column" spacing={2}>
        <motion.div
          className="paragraph"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Typography>{content?.p1}</Typography>
        </motion.div>
        <motion.div
          className="paragraph"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Typography>
            {content?.p21}{" "}
            <span style={{ fontWeight: "bold" }}>{content?.p22}</span>
            {content?.p23}
          </Typography>
        </motion.div>
      </Stack>
      <motion.div
        className="paragraph"
        style={{ opacity: thirdParagraphOpacity }}
      >
        <Typography>{content?.p3}</Typography>
      </motion.div>
    </Box>
  )
}

function Drinking() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.drinking
  const { sectionRef } = useActiveSection("impact-water", {
    amount: 0.5,
  })

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
    [0.7, 0.9],
    [0, 1],
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="80vh"
      sx={{ justifyContent: "space-around" }}
    >
      <motion.div
        className="paragraph"
        style={{ opacity: firstParagraphOpacity }}
      >
        <Typography>{content?.p1}</Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: secondParagraphOpacity }}
      >
        <Typography>
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p22}</span>
          {content?.p23}
        </Typography>
      </motion.div>
    </Box>
  )
}

function Climate() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.climate
  const { sectionRef } = useActiveSection("impact-climate", {
    amount: 0.5,
  })

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
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Stack direction="column" spacing={12}>
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

export default SectionImpact
