"use client"

import { Box } from "@repo/ui/mui"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  cityMapViewState,
  stateMapViewState,
  valleyMapViewState,
} from "./helpers/mapViews"
import { useMap } from "@repo/map"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"
import ConcentricCircle from "./vis/ConcentricCircle"
import { PeopleIcon, AlmondIcon } from "./helpers/Icons"
import React from "react"

function SectionBenefits() {
  return (
    <>
      <City />
      <Agriculture />
      <Economy />
    </>
  )
}

const norCalData = {
  past: { year: 1940, value: 3066654, annotation: "3.06M" },
  present: { year: 2024, value: 15581091, annotation: "15.5M" },
  icon: PeopleIcon,
  title: "NorCal",
}

const soCalData = {
  past: { year: 1940, value: 3840733, annotation: "3.84M" },
  present: { year: 2024, value: 23479897, annotation: "23.48M" },
  icon: PeopleIcon,
  title: "SoCal",
}

const markers = [
  {
    id: "norcal",
    name: "Southern California",
    latitude: 34.0522,
    longitude: -118.2437,
    radius: 100,
  },
  {
    id: "socal",
    name: "Northern California",
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100,
  },
]

function City() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef, isSectionActive } = useActiveSection("city", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)

  const load = useCallback(() => {
    flyTo({
      longitude: cityMapViewState.longitude,
      latitude: cityMapViewState.latitude,
      zoom: cityMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
    setTextMarkers(markers, "text")
  }, [flyTo, setTextMarkers])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log("initialize stuff")
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log("unload stuff")
        setTextMarkers([], "text")
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load, setTextMarkers])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="120vh"
      width="70vw"
      sx={{ justifyContent: "center" }}
    >
      <ConcentricCircle
        size={{ width: 600, height: 400 }}
        data={norCalData}
        shift={[1, 0.3]}
        clipId="norcal"
        delay={0}
        startAnimation={startAnimation}
      />
      <Box className="paragraph">
        <Sentence
          custom={0}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          {content?.benefits.p1}
        </Sentence>
      </Box>
      <ConcentricCircle
        size={{ width: 800, height: 400 }}
        data={soCalData}
        shift={[0.8, 0.27]}
        clipId="socal"
        delay={1}
        startAnimation={startAnimation}
      />
    </Box>
  )
}

function Agriculture() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef, isSectionActive } = useActiveSection("agriculture", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)

  const almondData = {
    past: { year: 1980, value: 327314, annotation: "0.32M" },
    present: { year: 2022, value: 1582870, annotation: "1.58M" },
    icon: AlmondIcon,
    title: "Almond",
  }

  const load = useCallback(() => {
    flyTo({
      longitude: valleyMapViewState.longitude,
      latitude: valleyMapViewState.latitude,
      zoom: valleyMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        console.log("initialize stuff")
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        console.log("unload stuff")
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      width="70vw"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence
          custom={0}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          {content?.benefits.p2}
        </Sentence>
      </Box>
      <ConcentricCircle
        size={{ width: 600, height: 400 }}
        data={almondData}
        shift={[0.5, 0.3]}
        clipId="almond"
        delay={1}
        startAnimation={startAnimation}
      />
    </Box>
  )
}

function Economy() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.benefits
  const { sectionRef, isSectionActive } = useActiveSection("economy", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)

  const economyData = {
    past: { year: 1980, value: 13779, annotation: "$50.9K*" },
    present: { year: 2024, value: 104916, annotation: "$105K" },
    icon: PeopleIcon,
    title: "Economy",
  }

  const load = useCallback(() => {
    flyTo({
      longitude: stateMapViewState.longitude,
      latitude: stateMapViewState.latitude,
      zoom: stateMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        console.log("initialize stuff")
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        console.log("unload stuff")
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      width="70vw"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence
          custom={0}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          {content?.p3}
        </Sentence>
      </Box>
      <ConcentricCircle
        size={{ width: 600, height: 400 }}
        data={economyData}
        shift={[0.5, 0.5]}
        clipId="economy"
        delay={1}
        startAnimation={startAnimation}
      />
    </Box>
  )
}

export default SectionBenefits
