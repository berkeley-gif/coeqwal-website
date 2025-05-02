"use client"

import { useMap } from "@repo/map"
import { Box, VisibilityIcon } from "@repo/ui/mui"
import { canalLayerStyle, riverLayerStyle } from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useCallback, useEffect, useRef, useState } from "react"
import { Sentence } from "@repo/motion/components"
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
import ScrollIndicator from "./helpers/ScrollIndicator"

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
  const { sectionRef, isSectionActive } = useActiveSection("goldrush", {
    amount: 0.5,
  })
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const hasSeen = useRef(false)
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = goldRushMapViewState[breakpoint]
  const [animationComplete, setAnimationComplete] = useState(false)

  const load = useCallback(() => {
    setTimeout(() => {
      flyTo({
        longitude: mapViewState?.longitude ?? 0,
        latitude: mapViewState?.latitude ?? 0,
        zoom: mapViewState?.zoom ?? 1,
        transitionOptions: {
          duration: 2000,
        },
      })
    }, 1000)
    setTimeout(() => {
      setMarkers(markers, "rough-circle")
      setTextMarkers(GoldRushTextLabels, "text")
    }, 2000)
  }, [flyTo, markers, setMarkers, setTextMarkers, mapViewState])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
    setTextMarkers([], "text")
  }, [setMarkers, setTextMarkers])

  useEffect(() => {
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
  }, [isSectionActive, load, unload])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence variant="h3" gutterBottom custom={0}>
          {content?.title}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>{content?.p1}</Sentence>
        <Sentence
          custom={1}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.p2}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
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
  const hasSeen = useRef(false)
  const { flyTo, setPaintProperty } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = reclamationMapViewState[breakpoint]
  const [animationComplete, setAnimationComplete] = useState(false)

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
  }, [isSectionActive, load, unload])

  return (
    <Box className="container" height="100vh" sx={{ justifyContent: "center" }}>
      <Box ref={sectionRef} className="paragraph">
        <Sentence custom={0}>{content?.p1}</Sentence>
        <Sentence
          custom={1}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.p2}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
    </Box>
  )
}

function Drinking() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy.drinking
  const { sectionRef, isSectionActive } = useActiveSection("drinking", {
    amount: 0.5,
  })
  const { addSource, addLayer, setPaintProperty, flyTo } = useMap()
  const hasSeen = useRef(false)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = drinkingMapViewState[breakpoint]
  const [animationComplete, setAnimationComplete] = useState(false)

  const init = useCallback(() => {
    addSource("canal", {
      type: "geojson",
      data: "/rivers/drinking.geojson",
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
      url: "mapbox://yskuo.a2firbty",
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
  }, [isSectionActive, load, unload, init])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence custom={0}>
          {content?.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={1}>{content?.p2}</Sentence>
        <Sentence
          custom={2}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.p3}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
    </Box>
  )
}

export default SectionHuman
