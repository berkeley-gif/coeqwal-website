"use client"

import { useMap } from "@repo/map"
import { Box, Stack, Typography } from "@repo/ui/mui"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useCallback, useState } from "react"
import { MarkerType } from "./helpers/mapMarkers"
import { useFetchData } from "../hooks/useFetchData"
import {
  DrinkingTextLabels,
  GoldRushTextLabels,
  IrrigationTextLabels,
} from "./helpers/mapAnnotations"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import { InfrastructureColor } from "./helpers/colorPalette"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"

const MotionTypography = motion.create(Typography)

function SectionHuman() {
  const [mineMarkers, setMineMarkers] = useState<Record<string, MarkerType[]>>(
    {},
  ) // Initialize markers as an empty array

  useFetchData<Record<string, MarkerType[]>>(
    "/data/goldrush_marker.json",
    (data) => {
      setMineMarkers(data)
    },
  )

  return (
    <>
      <Header markers={mineMarkers.mining || []} />
      <Irrigation markers={mineMarkers.irrigation || []} />
      <Drinking />
    </>
  )
}

function Header({ markers }: { markers: MarkerType[] }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy
  const { sectionRef } = useActiveSection("goldrush", {
    amount: 0.5,
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.2 && latest < 0.9 && !hasSetMarkers) {
      setMarkers(markers, "rough-circle")
      setTextMarkers(GoldRushTextLabels, "text")
      setHasSetMarkers(true)
      return
    } else if (latest < 0.2 || latest > 0.9) {
      setMarkers([], "rough-circle")
      setTextMarkers([], "text")
      setHasSetMarkers(false)
    }
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
        <Typography variant="h3" gutterBottom>
          {" "}
          {content?.title}{" "}
        </Typography>
      </motion.div>
      <motion.div
        className="paragraph"
        style={{ opacity: secondParagraphOpacity }}
      >
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1"> {content?.p2}</Typography>
      </motion.div>
    </Box>
  )
}

function Irrigation({ markers }: { markers: MarkerType[] }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy.irrigation
  const { sectionRef, isSectionActive } = useActiveSection("irrigation", {
    amount: 0.5,
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.4 && latest < 0.9 && !hasSetMarkers) {
      setMarkers(markers, "rough-circle")
      setTextMarkers(IrrigationTextLabels, "text")
      setHasSetMarkers(true)
      return
    }
  })

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setTextMarkers([], "text")
    setHasSetMarkers(false)
  }, [setMarkers, setTextMarkers])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {},
    unload,
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
    </Box>
  )
}

function Drinking() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy.drinking
  const { sectionRef, isSectionActive } = useActiveSection("drinking", {
    amount: 0.5,
  })
  const { setPaintProperty } = useMap()
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.4 && latest < 1) {
      setPaintProperty("river-combined-layer", "line-opacity", 1)
      setPaintProperty("canal-layer", "line-opacity", 1)
      return
    } else {
      setPaintProperty("river-combined-layer", "line-opacity", 0)
      if (latest < 0.4) {
        setPaintProperty("canal-layer", "line-opacity", 0)
      }
    }
  })

  useSectionLifecycle(
    isSectionActive,
    () => {},
    () => {
      setTextMarkers(DrinkingTextLabels, "text")
    },
    () => {
      setTextMarkers([], "text")
    },
  )

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
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Stack spacing={5} direction="column">
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
        </Stack>
      </Box>
    </Box>
  )
}

export default SectionHuman
