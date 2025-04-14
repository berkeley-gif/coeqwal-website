"use client"

import React, { useRef, useState } from "react"
import { MapboxMapRef, useMap } from "@repo/map"
import { Box, CircularProgress } from "@repo/ui/mui"
import { stateMapViewState } from "./components/helpers/mapViews"
import "./main.css"
import Opener from "./components/01Opener"
import SectionWaterSource from "./components/02WaterSource"
import MapContainer from "./components/MapContainer"
import SectionDelta from "./components/03Delta"
import SectionHuman from "./components/04Human"
import SectionTransformation from "./components/05Transformation"
import SectionImpact from "./components/06Impact"
import Conclusion from "./components/07Conclusion"

export default function Provider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const uncontrolledRef = useRef<MapboxMapRef | null>(null)
  const { mapRef } = useMap()
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  const handleFlyTo = () => {
    /*if (uncontrolledRef.current) {
      uncontrolledRef.current.flyTo(-120, 37, 7)
    }*/
    if (mapRef.current) {
      mapRef.current.flyTo(
        stateMapViewState.longitude,
        stateMapViewState.latitude,
        8,
        stateMapViewState.pitch,
        stateMapViewState.bearing,
      )
    }
  }

  return (
    <>
      <div id="map-container">
        <MapContainer uncontrolledRef={uncontrolledRef} />
      </div>
      <div
        ref={containerRef}
        className="story-container"
        style={{ height: "100%", width: "70vw" }}
      >
        <Opener />
        <SectionWaterSource />
        <SectionDelta />
        <SectionHuman />
        <SectionTransformation />
        <SectionImpact />
        <Conclusion />
      </div>
    </>
  )
}

function Loader() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#031a35",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <CircularProgress color="inherit" />
    </Box>
  )
}
