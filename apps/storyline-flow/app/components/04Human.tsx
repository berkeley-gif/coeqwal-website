"use client"

import { useMap } from "@repo/map"
import { Box, VisibilityIcon } from "@repo/ui/mui"
import { riverLayerStyle } from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useCallback, useEffect, useRef } from "react"
import { Sentence } from "@repo/motion/components"

function SectionHuman() {
  return (
    <>
      <Header />
      <Irrigation />
      <Drinking />
    </>
  )
}

function Header() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy
  const { sectionRef } = useActiveSection("goldrush", { amount: 0.5 })

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
        <Sentence custom={1}>{content?.p2}</Sentence>
      </Box>
    </Box>
  )
}

function Irrigation() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy.irrigation
  const { sectionRef } = useActiveSection("irrigation", { amount: 0.5 })

  return (
    <Box className="container" height="100vh" sx={{ justifyContent: "center" }}>
      <Box ref={sectionRef} className="paragraph">
        <Sentence custom={0}>
          {content?.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={1}>{content?.p2}</Sentence>
      </Box>
    </Box>
  )
}

function Drinking() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.economy.drinking
  const { sectionRef, isSectionActive } = useActiveSection("drinking", {
    amount: 0.5,
  })
  const { addSource, addLayer, setPaintProperty } = useMap()
  const hasSeen = useRef(false)

  const init = useCallback(() => {
    addSource("river-combined", {
      type: "geojson",
      data: "/rivers/combinedRivers.geojson",
    })

    addLayer(
      "river-combined-layer",
      "river-combined",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )
  }, [addSource, addLayer])

  const load = useCallback(() => {
    setPaintProperty("river-combined-layer", "line-opacity", 1)
  }, [setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("river-combined-layer", "line-opacity", 0)
  }, [setPaintProperty])

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
        <Sentence custom={1}>
          {content?.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={2}>{content?.p3}</Sentence>
      </Box>
    </Box>
  )
}

export default SectionHuman
