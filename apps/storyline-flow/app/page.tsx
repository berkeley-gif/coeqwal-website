'use client'

import React, { useRef } from "react"
import { Map } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { stateMapViewState } from "./components/helpers/mapViews";
import './main.css'
import Opener from "./components/01Opener";
import SectionWaterSource from "./components/02WaterSource";

export default function Provider() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div id='map-container'>
        <Map mapboxToken={mapboxToken} viewState={stateMapViewState}
            mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
            scrollZoom={false}
            navigationControl={false}
            dragPan={false}
            interactive={false}
          />
      </div>
      <div ref={containerRef} className="story-container" style={{height: '100%', width: '75vw'}}>
        <Opener />
        <SectionWaterSource />
      </div>
    </>
  );
}

