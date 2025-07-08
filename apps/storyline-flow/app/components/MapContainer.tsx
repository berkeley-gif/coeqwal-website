"use client"

import { useCallback, useEffect, useRef } from "react"
import { Map, useMap, MapRef } from "@repo/map"
import { Box } from "@repo/ui/mui"
import * as mapViews from "./helpers/mapViews"
import {
  DamLayer,
  TextMarker,
  TextMarkersLayer,
  TooltipLayer,
} from "./helpers/mapMarkers"
import { AnimatePresence } from "@repo/motion"
import useStoryStore from "../store"
import { useBreakpoint } from "@repo/ui/hooks"
import {
  boundaryPaintStyle,
  canalLayerStyle,
  cityBoundaryLayerStyle,
  deltaWaterLayerStyle,
  deltaWetlandLayerStyle,
  precipitationPaintStyle,
  riverLayerStyle,
  snowpackPaintStyle,
} from "./helpers/mapLayerStyle"
import { SierraNevadaMountains, TextAnnotation } from "./helpers/mapAnnotations"
import * as turf from "@turf/turf"
import { OceanWaterColor } from "./helpers/colorPalette"

interface MapContainerProps {
  onLoad?: () => void
  uncontrolledRef?: React.RefObject<MapRef | null>
}

interface SectionConfig {
  viewState: mapViews.ResponsiveMapViewState
  textAnnotations: TextAnnotation[]
}

const sectionConfig: Record<string, SectionConfig> = {
  opener: {
    viewState: mapViews.stateMapViewState,
    textAnnotations: [],
  },
  precipitation: {
    viewState: mapViews.stateMapViewState,
    textAnnotations: [],
  },
  variability: {
    viewState: mapViews.stateMapViewState,
    textAnnotations: [],
  },
  snowpack: {
    viewState: mapViews.stateMapViewState,
    textAnnotations: [SierraNevadaMountains],
  },
  flow: {
    viewState: mapViews.riverMapViewState,
    textAnnotations: [],
  },
  valley: {
    viewState: mapViews.riverValleyMapViewState,
    textAnnotations: [],
  },
  wetland: {
    viewState: mapViews.riverDeltaMapViewState,
    textAnnotations: [],
  },
  delta: {
    viewState: mapViews.deltaMapViewState,
    textAnnotations: [],
  },
  transition: {
    viewState: mapViews.stateMapViewState,
    textAnnotations: [],
  },
  goldrush: {
    viewState: mapViews.goldRushMapViewState,
    textAnnotations: [],
  },
  irrigation: {
    viewState: mapViews.reclamationMapViewState,
    textAnnotations: [],
  },
  drinking: {
    viewState: mapViews.drinkingMapViewState,
    textAnnotations: [],
  },
  transformation: {
    viewState: mapViews.stateZoomedMapViewState,
    textAnnotations: [],
  },
  city: {
    viewState: mapViews.cityMapViewState,
    textAnnotations: [],
  },
  agriculture: {
    viewState: mapViews.valleyMapViewState,
    textAnnotations: [],
  },
  economy: {
    viewState: mapViews.stateMapViewState,
    textAnnotations: [],
  },
  "impact-salmon": {
    viewState: mapViews.impactSalmonMapViewState,
    textAnnotations: [],
  },
  "impact-delta": {
    viewState: mapViews.impactDeltaMapViewState,
    textAnnotations: [],
  },
  "impact-groundwater": {
    viewState: mapViews.impactGroundMapViewState,
    textAnnotations: [],
  },
  "impact-water": {
    viewState: mapViews.impactDrinkingMapViewState,
    textAnnotations: [],
  },
  "impact-climate": {
    viewState: mapViews.impactClimateMapViewState,
    textAnnotations: [],
  },
}

export default function MapContainer({
  uncontrolledRef,
  onLoad,
}: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef, addSource, addLayer, flyTo, setFilter } = useMap()
  const setMarkers = useStoryStore((state) => state.setMarkers)
  const markerLayer = useStoryStore((state) => state.markerLayer)
  const textMarkerLayer = useStoryStore((state) => state.textMarkerLayer)
  const breakpoint = useBreakpoint()
  const mapViewState = mapViews.stateMapViewState[breakpoint]
  const initialized = useRef(false)
  const resourceLoaded = useRef(false)
  const isMapReady = useStoryStore((state) => state.isMapReady)
  const activeSection = useStoryStore((state) => state.activeSection)
  const selectedMonthSnowpack = useStoryStore(
    (state) => state.selectedMonthSnowpack,
  )

  const loadResources = useCallback(() => {
    // precipitation
    addSource("precipitation-vector", {
      type: "vector",
      url: "mapbox://coeqwal.6dxtit1i",
    })
    addLayer(
      "precipitation-vector-layer",
      "precipitation-vector",
      "fill",
      precipitationPaintStyle,
      {},
      { "source-layer": "region" },
    )
    //snowpack
    addSource("snowpack", {
      type: "vector",
      url: "mapbox://coeqwal.a5ader88",
    })
    addLayer(
      "snowpack-layer",
      "snowpack",
      "fill",
      snowpackPaintStyle,
      {},
      { "source-layer": "monthly_snowpack-745lqa" },
    )
    // delta
    addSource("river-sac", {
      type: "geojson",
      data: "/rivers/SacramentoRiver.geojson",
    })
    addLayer(
      "river-sac-layer",
      "river-sac",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )
    addSource("river-sanjoaquin", {
      type: "geojson",
      data: "/rivers/SanJoaquinRiver.geojson",
    })
    addLayer(
      "river-sanjoaquin-layer",
      "river-sanjoaquin",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )
    // valley
    addSource("valley-boundary", {
      type: "geojson",
      data: turf.featureCollection([]),
    })
    addLayer(
      "valley-boundary-layer",
      "valley-boundary",
      boundaryPaintStyle.type,
      boundaryPaintStyle.paint,
      boundaryPaintStyle.layout,
      {},
    )
    //wetland
    addSource("delta-water", {
      type: "vector",
      url: "mapbox://coeqwal.97rr9qs8",
    })
    addLayer(
      "delta-water-layer",
      "delta-water",
      deltaWaterLayerStyle.type,
      deltaWaterLayerStyle.paint,
      {},
      deltaWaterLayerStyle.layer,
    )
    addSource("delta-wetland", {
      type: "vector",
      url: "mapbox://coeqwal.29dkicxr",
    })
    addLayer(
      "delta-wetland-layer",
      "delta-wetland",
      deltaWetlandLayerStyle.type,
      deltaWetlandLayerStyle.paint,
      {},
      deltaWetlandLayerStyle.layer,
    )
    //delta
    addSource("delta-boundary", {
      type: "geojson",
      data: turf.featureCollection([]),
    })
    addLayer(
      "delta-boundary-layer",
      "delta-boundary",
      boundaryPaintStyle.type,
      boundaryPaintStyle.paint,
      boundaryPaintStyle.layout,
      {},
    )
    //canal
    addSource("canal", {
      type: "geojson",
      data: "/rivers/drinking.geojson",
    })
    addLayer(
      "canal-layer",
      "canal",
      canalLayerStyle.type,
      canalLayerStyle.paint,
      canalLayerStyle.layout,
    )
    addSource("river-combined", {
      type: "vector",
      url: "mapbox://coeqwal.0rzbpybk",
    })
    addLayer(
      "river-combined-layer",
      "river-combined",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
      riverLayerStyle.layer,
    )
    // transformation
    addSource("delta-canal", {
      type: "vector",
      url: "mapbox://coeqwal.85rgmvo5",
    })
    addLayer(
      "delta-canal-layer",
      "delta-canal",
      canalLayerStyle.type,
      canalLayerStyle.paint,
      canalLayerStyle.layout,
      { "source-layer": "delta_canal_v2-8yjrvw" },
    )
    addSource("nhd-rivers", {
      type: "vector",
      url: "mapbox://coeqwal.8mz01pu4",
    })
    addLayer(
      "nhd-rivers-layer",
      "nhd-rivers",
      riverLayerStyle.type,
      {
        ...riverLayerStyle.paint,
        "line-color": OceanWaterColor,
        "line-width": 1,
      },
      riverLayerStyle.layout,
      { "source-layer": "hydrology" },
    )
    // city
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

  const updateMapViewState = useCallback(
    (activeSection: string) => {
      const mapViewState =
        sectionConfig[activeSection]?.viewState[breakpoint] ??
        mapViews.stateMapViewState[breakpoint]
      flyTo({
        longitude: mapViewState?.longitude ?? 0,
        latitude: mapViewState?.latitude ?? 0,
        zoom: mapViewState?.zoom ?? 1,
        pitch: mapViewState?.pitch ?? 0,
        bearing: mapViewState?.bearing ?? 0,
      })
    },
    [flyTo, breakpoint],
  )

  const updateMapAnnotations = useCallback(
    (activeSection: string) => {
      const textAnnotations =
        sectionConfig[activeSection]?.textAnnotations ?? []
      setMarkers(textAnnotations, "text")
    },
    [setMarkers],
  )

  const updateMapLayer = useCallback(
    (activeSection: string) => {
      switch (activeSection) {
        case "precipitation":
          //console.log("why didnt work")
          //setPaintProperty("precipitation-vector-layer", "fill-opacity", 1)
          return
        case "snowpack":
          setFilter("snowpack-layer", [
            "all",
            ["==", ["get", "month-adjusted"], selectedMonthSnowpack],
          ] as unknown as string)
          return
        default:
          //console.log("testing", activeSection)
          return
      }
    },
    [selectedMonthSnowpack, setFilter],
  )

  useEffect(() => {
    if (!isMapReady) return
    if (!resourceLoaded.current) {
      loadResources()
      console.log("📦 Resource loaded, setting map ready state")
      resourceLoaded.current = true
    }
    console.log(
      "📌 MapContainer useEffect running for activeSection:",
      activeSection,
    )
    updateMapLayer(activeSection)
    updateMapViewState(activeSection)
    //updateMapAnnotations(activeSection)
  }, [
    activeSection,
    isMapReady,
    resourceLoaded,
    loadResources,
    updateMapLayer,
    updateMapViewState,
    updateMapAnnotations,
  ])

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
        initialViewState={mapViewState}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        navigationControl={false}
        dragPan={false}
        onLoad={onLoad}
      >
        <AnimatePresence>
          {markerLayer.style === "rough-circle" && (
            //<CarouselLayer markers={markerLayer.points} />
            <TooltipLayer markers={markerLayer.points} />
          )}
          {markerLayer.style === "text" && (
            <TextMarkersLayer
              key={1}
              markers={markerLayer.points}
              styledMarker={TextMarker}
            />
          )}
          {textMarkerLayer.style === "text" && (
            <TextMarkersLayer
              key={2}
              markers={textMarkerLayer.points}
              styledMarker={TextMarker}
            />
          )}
          {markerLayer.style === "dam" && (
            <DamLayer markers={markerLayer.points} />
          )}
        </AnimatePresence>
      </Map>
    </Box>
  )
}
