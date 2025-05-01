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
import { PeopleIcon, MoneyBagIcon, FarmIcon } from "./helpers/Icons"
import React from "react"
import { useBreakpoint } from "@repo/ui/hooks"
import { concentricTransform } from "./helpers/breakpoints"

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
  past: { year: 1960, value: 3373827, annotation: "3.37M" },
  present: { year: 2024, value: 6551627 * 2.5, annotation: "6.55M" },
  icon: PeopleIcon,
  title: "SF Bay",
}

const soCalData = {
  past: { year: 1960, value: 9007878, annotation: "9.00M" },
  present: { year: 2024, value: 22095061 * 2.5, annotation: "22.01M" },
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
    name: "San Francisco Bay Area",
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
  const breakpoint = useBreakpoint()
  const mapViewState = cityMapViewState[breakpoint]

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
    setTextMarkers(markers, "text")
  }, [flyTo, setTextMarkers, mapViewState])

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
      width="80vw"
      sx={{ justifyContent: "center" }}
    >
      <ConcentricCircle
        size={
          concentricTransform[breakpoint]?.norcal?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={norCalData}
        shift={concentricTransform[breakpoint]?.norcal?.shift ?? [0, 0]}
        clipId="norcal"
        delay={0}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.norcal?.radius ?? 10}
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
        size={
          concentricTransform[breakpoint]?.socal?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={soCalData}
        shift={concentricTransform[breakpoint]?.socal?.shift ?? [0, 0]}
        clipId="socal"
        delay={1}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.socal?.radius ?? 10}
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
  const breakpoint = useBreakpoint()
  const mapViewState = valleyMapViewState[breakpoint]

  const almondData = {
    past: { year: 1980, value: 15998697724, annotation: "16B*" },
    present: { year: 2022, value: 132351395410, annotation: "132B" },
    icon: FarmIcon,
    title: "Yield",
  }

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
        size={
          concentricTransform[breakpoint]?.agriculture?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={almondData}
        shift={concentricTransform[breakpoint]?.agriculture?.shift ?? [0, 0]}
        clipId="almond"
        delay={1}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.agriculture?.radius ?? 10}
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
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]

  const economyData = {
    past: { year: 1980, value: 327958, annotation: "$327B*" },
    present: { year: 2024, value: 4103124, annotation: "$4,103B" },
    icon: MoneyBagIcon,
    title: "GDP",
  }

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
      height="120vh"
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
        size={
          concentricTransform[breakpoint]?.economy?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={economyData}
        shift={concentricTransform[breakpoint]?.economy?.shift ?? [0, 0]}
        clipId="economy"
        delay={1}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.economy?.radius ?? 10}
      />
    </Box>
  )
}

export default SectionBenefits
