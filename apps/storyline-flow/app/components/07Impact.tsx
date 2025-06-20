"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { useCallback } from "react"
import {
  impactClimateMapViewState,
  impactDeltaMapViewState,
  impactDrinkingMapViewState,
  impactGroundMapViewState,
  impactSalmonMapViewState,
} from "./helpers/mapViews"
import { useMap } from "@repo/map"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"
import { useBreakpoint } from "@repo/ui/hooks"
import { motion, useScroll, useTransform } from "@repo/motion"

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
      height="120vh"
      sx={{ justifyContent: "end" }}
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
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactSalmonMapViewState[breakpoint]
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    const marker = {
      id: "1",
      name: "Red Bluff",
      longitude: -122.2358,
      latitude: 40.1786,
    }
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
    setMarkers([marker], "rough-circle")
  }, [flyTo, mapViewState, setMarkers])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
  }, [setMarkers])

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
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactDeltaMapViewState[breakpoint]
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

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
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactGroundMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

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
  const { sectionRef, isSectionActive } = useActiveSection("impact-water", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactDrinkingMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

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
  const { sectionRef, isSectionActive } = useActiveSection("impact-climate", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactClimateMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

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
