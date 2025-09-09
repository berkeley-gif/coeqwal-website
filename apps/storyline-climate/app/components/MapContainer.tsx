"use client"

import { useEffect, useRef } from "react"
import { Map, useMap, MapRef, Source, Layer } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { deltaMapViewState } from "./helpers/mapViewStates"
import { useBreakpoint } from "@repo/ui/hooks"
import { AnimatePresence } from "@repo/motion"
import { TextMarker, TextMarkersLayer } from "./helpers/mapLayers"
import { SacramentoRiver, SanJoaquinRiver } from "./helpers/mapAnnotations"
import { InfrastructureColor } from "./helpers/colorPalette"
import useStoryStore from "../store"

interface MapContainerProps {
  onLoad?: () => void
  uncontrolledRef?: React.RefObject<MapRef | null>
}
export default function MapContainer({
  uncontrolledRef,
  onLoad,
}: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  const initialized = useRef(false)
  const resourceLoaded = useRef(false)
  const breakpoint = useBreakpoint()
  const textMarkerLayer = useStoryStore((state) => state.textMarkerLayer)

  useEffect(() => {
    if (!resourceLoaded.current) {
      //loadResources()
      console.log("📦 Resource loaded, setting map ready state")
      resourceLoaded.current = true
    }
    console.log("📌 MapContainer useEffect running for activeSection:")
    //updateMapLayer(activeSection)
    //updateMapViewState(activeSection)
    //updateMapAnnotations(activeSection)
  }, [resourceLoaded])

  // ✅ Register mapRef and sync uncontrolledRef
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    console.log("🚀 MapContainer useEffect running")

    // Wait for mapRef to be initialized
    const checkMapRef = () => {
      const ref = mapRef?.current
      if (!ref) {
        console.warn(
          "❌ mapRef.current is null in MapContainer, will retry in 500ms",
        )
        setTimeout(checkMapRef, 500)
        return
      }

      console.log("✅ mapRef.current initialized in MapContainer")

      if (uncontrolledRef) {
        uncontrolledRef.current = ref
        console.log(
          "🔗 uncontrolledRef assigned successfully",
          ref ? "with valid map" : "but map is null",
        )
      }

      if (!initialized.current) {
        initialized.current = true
        console.log("📌 map instance registered with mapActions")
      }
    }

    // Start the check process
    checkMapRef()
  }, [mapRef, uncontrolledRef])

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/coeqwal/cmc0zhlcr008p01sof4ob61vg"
        style={{ width: "100%", height: "40vh" }}
        interactive={false}
        navigationControl={false}
        dragPan={true}
        onLoad={onLoad}
        initialViewState={deltaMapViewState[breakpoint]!}
      >
        <RiverLayer />
        <TunnelLayer />
        <SalinityHistoricalLayer />
        <RiverFlowLayer />
        <AnimatePresence>
          <TextMarkersLayer
            markers={[SacramentoRiver, SanJoaquinRiver]}
            styledMarker={TextMarker}
            key={1}
          />
          {textMarkerLayer.style === "text" && (
            <TextMarkersLayer
              key={2}
              markers={textMarkerLayer.points}
              styledMarker={TextMarker}
            />
          )}
        </AnimatePresence>
      </Map>
    </Box>
  )
}

function SalinityHistoricalLayer() {
  return (
    <>
      <Source
        id="salinity-historical-arrow"
        type="geojson"
        data="/data/crappy_historical_x2_arrow.geojson"
      >
        <Layer
          id="salinity-historical-arrow-layer"
          type="line"
          source="salinity-historical-arrow"
          paint={{
            "line-color": "#F2f0EF",
            "line-width": 5,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
      <Source
        id="salinity-dummy-arrow"
        type="geojson"
        data="/data/crappy_dummy_x2_arrow.geojson"
      >
        <Layer
          id="salinity-dummy-arrow-layer"
          type="line"
          source="salinity-dummy-arrow"
          paint={{
            "line-color": "#F1B143",
            "line-width": 5,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
      <Source
        id="salinity-export-arrow"
        type="geojson"
        data="/data/crappy_export.geojson"
      >
        <Layer
          id="salinity-export-arrow-layer"
          type="line"
          source="salinity-export-arrow"
          paint={{
            "line-color": InfrastructureColor,
            "line-width": 5,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
    </>
  )
}

function RiverFlowLayer() {
  return (
    <>
      <Source
        id="sac-arrow"
        type="geojson"
        data="/data/crappy_sac_flow.geojson"
      >
        <Layer
          id="sac-arrow-layer"
          type="line"
          source="sac-arrow"
          paint={{
            "line-color": "#76bfe6",
            "line-width": 6,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
      <Source
        id="san-joaquin-arrow"
        type="geojson"
        data="/data/crappy_joaquin_flow.geojson"
      >
        <Layer
          id="joaquin-arrow-layer"
          type="line"
          source="san-joaquin-arrow"
          paint={{
            "line-color": "#76bfe6",
            "line-width": 6,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
    </>
  )
}

function TunnelLayer() {
  return (
    <>
      <Source id="delta-tunnel" type="vector" url="mapbox://coeqwal.1vtnekq4">
        <Layer
          id="delta-tunnel-layer"
          type="line"
          source="delta-tunnel"
          source-layer="delta-biwt27"
          paint={{
            "line-color": InfrastructureColor,
            "line-width": 5,
            "line-opacity": 0,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
    </>
  )
}

function RiverLayer() {
  return (
    <>
      <Source
        id="river-sac"
        type="geojson"
        data={"/data/SacramentoRiver.geojson"}
      />
      <Source
        id="river-sanjoaquin"
        type="geojson"
        data={"/data/SanJoaquinRiver.geojson"}
      />
      <Layer
        id="river-sanjoaquin-layer"
        type="line"
        source="river-sanjoaquin"
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
        paint={{
          "line-color": "#50B1E7",
          "line-width": 5,
        }}
      />
      <Layer
        id="river-sac-layer"
        type="line"
        source="river-sac"
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
        paint={{
          "line-color": "#50B1E7",
          "line-width": 5,
        }}
      />
    </>
  )
}
