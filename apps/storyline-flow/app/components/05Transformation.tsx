"use client"

import { Box, LibraryBooksIcon } from "@repo/ui/mui"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"
import { useCallback, useEffect, useRef, useState } from "react"
import { useMap } from "@repo/map"
import { stateMapViewState } from "./helpers/mapViews"
import Underline from "./helpers/Underline"
import { useBreakpoint } from "@repo/ui/hooks"
import ScrollIndicator from "./helpers/ScrollIndicator"
import { DAMS } from "./helpers/data/dams"
import { canalLayerStyle } from "./helpers/mapLayerStyle"

function SectionTransformation() {
  return (
    <>
      <Transformation />
    </>
  )
}

//TODO: pop up those
// Use waterdrop for dams
function Transformation() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.transformation
  const { sectionRef, isSectionActive } = useActiveSection("transformation", {
    amount: 0.5,
  })
  const hasSeen = useRef(false)
  const { flyTo, setPaintProperty, addSource, addLayer } = useMap()
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]
  const [animationComplete, setAnimationComplete] = useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const init = useCallback(() => {
    addSource("delta-canal", {
      type: "vector",
      url: "mapbox://yskuo.dagkiwwv",
    })

    addLayer(
      "delta-canal-layer",
      "delta-canal",
      canalLayerStyle.type,
      canalLayerStyle.paint,
      canalLayerStyle.layout,
      { "source-layer": "delta_canal-40ddl9" },
    )
  }, [addLayer, addSource])

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
    setMarkers(DAMS, "dam")
    setPaintProperty("canal-layer", "line-opacity", 1)
    setPaintProperty("delta-canal-layer", "line-opacity", 1)
  }, [flyTo, mapViewState, setMarkers, setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("delta-canal-layer", "line-opacity", 0)
    setMarkers([], "dam")
  }, [setMarkers, setPaintProperty])

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
  }, [init, isSectionActive, load, unload])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence variant="h2" gutterBottom custom={0}>
          {content?.subtitle1}
          <br />
          {content?.subtitle2}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1.5}>
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={3}>
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p22}</span>{" "}
          {content?.p23}
        </Sentence>
        <Sentence custom={4}>
          {content?.p31}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p32}</span>{" "}
          {content?.p33}
        </Sentence>
        <Sentence custom={5}>
          {content?.p41}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p42}</span>{" "}
          {content?.p43}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          custom={6.5}
          onAnimationComplete={() => {
            setStartAnimation(true)
            setAnimationComplete(true)
          }}
        >
          {content?.transition.p11}
          <Underline startAnimation={startAnimation}>
            {content?.transition.p12}
          </Underline>
          {content?.transition.p13}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} delay={1} />
    </Box>
  )
}

export default SectionTransformation
