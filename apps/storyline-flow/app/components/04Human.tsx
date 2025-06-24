"use client"

import { useMap } from "@repo/map"
import { Box, Stack, Typography } from "@repo/ui/mui"
import { canalLayerStyle, riverLayerStyle } from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useCallback, useEffect, useRef, useState } from "react"
import { MarkerType } from "./helpers/mapMarkers"
import { useFetchData } from "../hooks/useFetchData"
import {
  DrinkingTextLabels,
  GoldRushTextLabels,
  IrrigationTextLabels,
} from "./helpers/mapAnnotations"
import {
  drinkingMapViewState,
  goldRushMapViewState,
  reclamationMapViewState,
} from "./helpers/mapViews"
import { useBreakpoint } from "@repo/ui/hooks"
import { motion, useScroll, useTransform } from "@repo/motion"
import { InfrastructureColor } from "./helpers/colorPalette"

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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.economy
  const { sectionRef, isSectionActive } = useActiveSection("goldrush", {
    amount: 0.5,
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const hasSeen = useRef(false)
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = goldRushMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
    })
    setMarkers(markers, "rough-circle")
    setTextMarkers(GoldRushTextLabels, "text")
  }, [flyTo, markers, setMarkers, setTextMarkers, mapViewState])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setTextMarkers([], "text")
  }, [setMarkers, setTextMarkers])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load, unload, isMapReady])

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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.economy.irrigation
  const { sectionRef, isSectionActive } = useActiveSection("irrigation", {
    amount: 0.5,
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const hasSeen = useRef(false)
  const { flyTo, setPaintProperty } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = reclamationMapViewState[breakpoint]

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
    setMarkers(markers, "rough-circle")
    setTextMarkers(IrrigationTextLabels, "text")
    setPaintProperty("canal-layer", "line-opacity", 0)
  }, [
    flyTo,
    markers,
    setMarkers,
    setTextMarkers,
    mapViewState,
    setPaintProperty,
  ])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setTextMarkers([], "text")
  }, [setMarkers, setTextMarkers])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load, unload, isMapReady])

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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.economy.drinking
  const { sectionRef, isSectionActive } = useActiveSection("drinking", {
    amount: 0.5,
  })
  const { addSource, addLayer, setPaintProperty, flyTo } = useMap()
  const hasSeen = useRef(false)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = drinkingMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const init = useCallback(() => {
    addSource("canal", {
      type: "geojson",
      data: "/rivers/drinking.geojson", //TODO: check this source
    })

    addLayer(
      "canal-layer",
      "canal",
      canalLayerStyle.type,
      canalLayerStyle.paint,
      canalLayerStyle.layout,
    )

    addSource("river-combined", {
      type: "vector",
      url: "mapbox://coeqwal.0rzbpybk",
    })

    addLayer(
      "river-combined-layer",
      "river-combined",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
      riverLayerStyle.layer,
    )
  }, [addSource, addLayer])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
    setPaintProperty("river-combined-layer", "line-opacity", 1)
    setPaintProperty("canal-layer", "line-opacity", 1)
    setTextMarkers(DrinkingTextLabels, "text")
  }, [flyTo, setPaintProperty, setTextMarkers, mapViewState])

  const unload = useCallback(() => {
    setPaintProperty("river-combined-layer", "line-opacity", 0)
    setTextMarkers([], "text")
  }, [setPaintProperty, setTextMarkers])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        unload()
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load, unload, init, isMapReady])

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
