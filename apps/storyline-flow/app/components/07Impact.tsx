"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { useCallback, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"
import { motion, useScroll, useTransform } from "@repo/motion"
import { SacramentoDelta, ShastaDam } from "./helpers/mapAnnotations"
import { MarkerType } from "./helpers/mapMarkers"
import { useFetchData } from "../hooks/useFetchData"

function SectionImpact() {
  const [markers, setMarkers] = useState<Record<string, MarkerType[]>>({}) // Initialize markers as an empty array

  useFetchData<Record<string, MarkerType[]>>(
    "/data/impact_marker.json",
    (data) => {
      setMarkers(data)
    },
  )

  return (
    <>
      <Transition />
      <Salmon markers={markers.salmon ?? []} />
      <Delta markers={markers.delta ?? []} />
      <Drinking markers={markers.drinkingwater ?? []} />
      <Climate markers={markers.climate ?? []} />
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

  const firstSentenceOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1])

  const secondSentenceOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.6],
    [0, 1],
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="50vh"
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

function Salmon({ markers }: { markers: MarkerType[] }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.salmon
  const { sectionRef, isSectionActive } = useActiveSection("impact-salmon", {
    amount: 0.5,
  })
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    if (hasSetMarkers) return // Prevent setting markers again if already set
    setMarkers(markers, "rough-circle")
    setTextMarkers([ShastaDam], "text")
    setHasSetMarkers(true)
    return
  }, [hasSetMarkers, setMarkers, markers, setTextMarkers])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setTextMarkers([], "text")
    setHasSetMarkers(false)
  }, [setTextMarkers, setMarkers])

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

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="80vh"
      sx={{ justifyContent: "center" }}
    >
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

function Delta({ markers }: { markers: MarkerType[] }) {
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
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const load = useCallback(() => {
    if (hasSetMarkers) return // Prevent setting markers again if already set
    setMarkers(markers, "rough-circle")
    setTextMarkers([SacramentoDelta], "text")
    setHasSetMarkers(true)
    return
  }, [hasSetMarkers, setMarkers, markers, setTextMarkers])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setTextMarkers([], "text")
    setHasSetMarkers(false)
  }, [setMarkers, setTextMarkers])

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

function Drinking({ markers }: { markers: MarkerType[] }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef, isSectionActive } = useActiveSection("impact-water", {
    amount: 0.5,
  })

  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const load = useCallback(() => {
    if (hasSetMarkers) return // Prevent setting markers again if already set
    setMarkers(markers, "rough-circle")
    setHasSetMarkers(true)
    return
  }, [hasSetMarkers, setMarkers, markers])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setHasSetMarkers(false)
  }, [setMarkers])

  useSectionLifecycle(isSectionActive, () => {}, load, unload)

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
    <Box
      ref={sectionRef}
      className="container"
      height="70vh"
      sx={{ justifyContent: "space-around" }}
    >
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

function Climate({ markers }: { markers: MarkerType[] }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.climate
  const { sectionRef, isSectionActive } = useActiveSection("impact-climate", {
    amount: 0.5,
  })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const load = useCallback(() => {
    if (hasSetMarkers) return // Prevent setting markers again if already set
    setMarkers(markers, "rough-circle")
    setHasSetMarkers(true)
    return
  }, [hasSetMarkers, setMarkers, markers])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setHasSetMarkers(false)
  }, [setMarkers])

  useSectionLifecycle(isSectionActive, () => {}, load, unload)

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
