// page.tsx
"use client"

import React, { useRef } from "react"
import { MapboxMapRef } from "@repo/map"
import "./main.css"
import Opener from "./components/01Opener"
import SectionWaterSource from "./components/02WaterSource"
import MapContainer from "./components/MapContainer"

export default function Provider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const uncontrolledRef = useRef<MapboxMapRef | null>(null)

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
        {/* other sections */}
      </div>
    </>
  )
}
