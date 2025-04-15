"use client"

import React, { useRef } from "react"
import Image from "next/image"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import SectionContainer from "./helpers/SectionContainer"
import { MapTransitions, Marker, useMap } from "@repo/map"
import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { stateMapViewState } from "./helpers/mapViews"
import { Layer } from "@repo/map"
import { motion } from "@repo/motion"

const riverLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": "#9acbcf",
    "line-width": 3,
    "line-opacity": 0,
  },
}

interface Point {
  latitude: number
  longitude: number
  caption?: string
}

const getMarker = (point: Point, idx: number) => (
  <Marker latitude={point.latitude} longitude={point.longitude} key={idx}>
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }} // Define exit animation
      transition={{ duration: 0.5 }}
      className="impact-marker"
    ></motion.div>
  </Marker>
)

function SectionHuman() {
  return (
    <>
      <SectionContainer id="temporary-holder">
        <Box className="container" height="50vh">
          <Box className="paragraph" height="50vh"></Box>
        </Box>
      </SectionContainer>
      <Header />
      <Irrigation />
      <Drinking />
    </>
  )
}

function Header() {
  const content = storyline.economy
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef } = useMap() // from our context

  useIntersectionObserver(
    ref,
    (isInterSecting) => {
      if (isInterSecting && mapRef.current) {
        console.log("hello")
        mapRef.current?.flyTo(
          stateMapViewState.longitude,
          stateMapViewState.latitude,
          stateMapViewState.zoom,
        )
      }
    },
    { threshold: 0 },
  )

  return (
    <SectionContainer id="economy">
      <Box
        ref={ref}
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
        <Box className="paragraph">
          <Typography variant="h3" gutterBottom>
            {content.title}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">
            {content.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">
            {content.p3} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">{content.p4}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

function Irrigation() {
  const content = storyline.economy.irrigation
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container

  return (
    <>
      <SectionContainer id="irrigation">
        <Box className="container" height="100vh">
          <Box ref={ref} className="paragraph">
            <Typography variant="body1">
              {content.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">{content.p2}</Typography>
          </Box>
          <Box className="paragraph">
            <Image
              src="/economy/mining.jpg"
              alt="Irrigation"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>
      </SectionContainer>
    </>
  )
}

function Drinking() {
  const content = storyline.economy.drinking
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container
  const viewState = stateMapViewState
  const { mapRef } = useMap()
  const markers = [
    { longitude: -114.596, latitude: 33.61, caption: "Colorado River" },
    { longitude: -118.3951, latitude: 37.3686, caption: "Lake Mead" },
    { longitude: -119.7862, latitude: 37.9481, caption: "Lake Powell" },
  ]

  function loadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    mapRef.current?.addSource("river-combined", {
      type: "geojson",
      data: "/rivers/combinedRivers.geojson",
    })
    mapRef.current?.addLayer({
      id: "river-combined-layer",
      source: "river-combined",
      ...riverLayerStyle,
    } as Layer)

    mapRef.current
      ?.getMap()
      ?.getMap()
      ?.setPaintProperty("river-combined-layer", "line-opacity", 1)
  }

  function unloadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    const layers = mapInst.getStyle().layers.map((layer) => layer.id)
    if (!layers.includes("river-combined-layer")) return
    mapRef.current
      ?.getMap()
      ?.getMap()
      ?.setPaintProperty("river-combined-layer", "line-opacity", 0)
    mapRef.current?.setMotionChildren(null)
  }

  function moveTo() {
    if (!mapRef.current?.getMap()) return
    mapRef.current?.flyTo(
      viewState.longitude,
      viewState.latitude,
      viewState.zoom,
      0,
      0,
      3500,
      MapTransitions.SMOOTH,
    )
    const markerToAdd = markers.map((point, idx) => getMarker(point, idx))
    mapRef.current?.setMotionChildren(markerToAdd)
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        loadRivers()
        moveTo()
      } else {
        unloadRivers()
      }
    },
    { threshold: 0 },
  )

  return (
    <>
      <SectionContainer id="drinking">
        <Box ref={ref} className="container" height="100vh">
          <Box className="paragraph">
            <Typography variant="body1">
              {content.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">
              {content.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">{content.p3}</Typography>
          </Box>
          <Box className="paragraph">
            <Image
              src="/economy/water.jpg"
              alt="Drinking"
              width={1000}
              height={700}
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>
      </SectionContainer>
    </>
  )
}

export default SectionHuman
