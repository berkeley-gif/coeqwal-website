"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  cityMapViewState,
  stateMapViewState,
  valleyMapViewState,
} from "./helpers/mapViews"
import { useMap } from "@repo/map"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import ConcentricCircle from "./vis/ConcentricCircle"
import { PeopleIcon, MoneyBagIcon, FarmIcon } from "./helpers/Icons"
import React from "react"
import { useBreakpoint } from "@repo/ui/hooks"
import { concentricTransform } from "./helpers/breakpoints"
import { motion, useScroll, useTransform } from "@repo/motion"
import { cityBoundaryLayerStyle } from "./helpers/mapLayerStyle"

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
  past: { year: "in 1960 \u2014 ", value: 3373827, annotation: "3.37M" },
  present: {
    year: "in 2024 \u2014",
    value: 6551627 * 2.5,
    annotation: "6.55M",
  },
  icon: PeopleIcon,
  title: "SF Bay",
}

const soCalData = {
  past: { year: "in 1960 \u2014 ", value: 9007878, annotation: "9.00M" },
  present: {
    year: "in 2024 \u2014",
    value: 22095061 * 2.5,
    annotation: "22.01M",
  },
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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.impact
  const { sectionRef, isSectionActive } = useActiveSection("city", {
    amount: 0.5,
  })
  const { flyTo, setPaintProperty, addSource, addLayer } = useMap()
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const breakpoint = useBreakpoint()
  const mapViewState = cityMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const init = useCallback(() => {
    addSource("city-boundary", {
      type: "vector",
      url: "mapbox://coeqwal.7j5glhyx",
    })
    addLayer(
      "city-boundary-layer",
      "city-boundary",
      cityBoundaryLayerStyle.type,
      cityBoundaryLayerStyle.paint,
      cityBoundaryLayerStyle.layout,
      cityBoundaryLayerStyle.layer,
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
    setTextMarkers(markers, "text")
    setPaintProperty("canal-layer", "line-opacity", 0)
    setPaintProperty("city-boundary-layer", "line-opacity", 1)
  }, [flyTo, mapViewState, setTextMarkers, setPaintProperty])

  useEffect(() => {
    if (!isMapReady) return
    if (isSectionActive) {
      if (!hasSeen.current) {
        init()
        //console.log("initialize stuff")
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log("unload stuff")
        setTextMarkers([], "text")
        setPaintProperty("city-boundary-layer", "line-opacity", 0)
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [
    isSectionActive,
    load,
    setTextMarkers,
    isMapReady,
    setPaintProperty,
    init,
  ])

  const sentenceOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1])

  useEffect(() => {
    const unsubscribe = sentenceOpacity.on("change", (value) => {
      if (value > 0.8) {
        setStartAnimation(true)
      }
    })
    return unsubscribe
  }, [sentenceOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="130vh"
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
      <motion.div className="paragraph" style={{ opacity: sentenceOpacity }}>
        <Typography>{content?.benefits.p1}</Typography>
        <Typography variant="caption">
          Data source:{" "}
          <a
            href="https://www2.census.gov/library/publications/decennial/1960/population-volume-1/vol-01-06-c.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            1960
          </a>{" "}
          and{" "}
          <a
            href="https://www.census.gov/quickfacts/geo/chart/santaclaracountycalifornia/PST045224"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            2024
          </a>{" "}
          from the U.S. Census Bureau
        </Typography>
      </motion.div>
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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.impact
  const { sectionRef, isSectionActive } = useActiveSection("agriculture", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = valleyMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const almondData = {
    past: { year: "in 1980 \u2014", value: 13987139000, annotation: "14B" },
    present: {
      year: "in 2023 \u2014",
      value: 59389887000,
      annotation: "59.3B",
    },
    /*present: {
      year: "in 2022 \u2014",
      value: 132351395410,
      annotation: "132B",
    },*/
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
    if (!isMapReady) return
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
  }, [isSectionActive, load, isMapReady])

  const sentenceOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  useEffect(() => {
    const unsubscribe = sentenceOpacity.on("change", (value) => {
      if (value > 0.8) {
        setStartAnimation(true)
      }
    })
    return unsubscribe
  }, [sentenceOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="70vh"
      width="70vw"
      sx={{ justifyContent: "center" }}
    >
      <motion.div className="paragraph" style={{ opacity: sentenceOpacity }}>
        <Typography> {content?.benefits.p2}</Typography>
        <Typography variant="caption">
          Data source: Cash receipts by state from{" "}
          <a
            href="https://data.ers.usda.gov/reports.aspx?ID=4052#Pf221faeb8bdd40be9b9db688e7036405_19_17iT0R0x5"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            United States Department of Agriculture
          </a>{" "}
          in current dollars
        </Typography>
      </motion.div>
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
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const content = storyline?.impact.benefits
  const { sectionRef, isSectionActive } = useActiveSection("economy", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const hasSeen = useRef(false)
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const economyData = {
    past: { year: "in 1980 \u2014", value: 327958, annotation: "$327B" },
    present: { year: "in 2024 \u2014", value: 4103124, annotation: "$4,103B" },
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
    if (!isMapReady) return
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
  }, [isSectionActive, load, isMapReady])

  const sentenceOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  useEffect(() => {
    const unsubscribe = sentenceOpacity.on("change", (value) => {
      if (value > 0.8) {
        setStartAnimation(true)
      }
    })
    return unsubscribe
  }, [sentenceOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="130vh"
      width="90vw"
      sx={{ justifyContent: "center" }}
    >
      <motion.div className="paragraph" style={{ opacity: sentenceOpacity }}>
        <Typography>{content?.p3}</Typography>
        <Typography variant="caption">
          Data source: GDP by state from{" "}
          <a
            href="https://www.bea.gov/data/gdp/gdp-state"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            U.S. Bureau of Economic Analysis
          </a>{" "}
          in current dollars
        </Typography>
      </motion.div>
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
