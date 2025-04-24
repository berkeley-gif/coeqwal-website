"use client"

import { useState } from "react"
import { Box, Button, Stack } from "@repo/ui/mui"
import {
  Map,
  useMap,
  useMapLayers,
  useMapSources,
  MAP_STYLES,
  MAP_THEME_URLS,
} from "@repo/map"

/**
 * Example component showing declarative map layer management
 */
export default function RiverMapExample() {
  const [mapboxToken] = useState(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "")
  const [showRivers, setShowRivers] = useState(true)
  const [showWatersheds, setShowWatersheds] = useState(false)

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle={MAP_THEME_URLS.light}
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 8,
        }}
      >
        <RiverLayers visible={showRivers} watershedsVisible={showWatersheds} />
      </Map>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          position: "absolute",
          bottom: 20,
          left: 20,
          zIndex: 10,
          background: "rgba(255,255,255,0.7)",
          padding: 2,
          borderRadius: 1,
        }}
      >
        <Button
          variant="contained"
          color={showRivers ? "primary" : "inherit"}
          onClick={() => setShowRivers(!showRivers)}
        >
          {showRivers ? "Hide Rivers" : "Show Rivers"}
        </Button>

        <Button
          variant="contained"
          color={showWatersheds ? "primary" : "inherit"}
          onClick={() => setShowWatersheds(!showWatersheds)}
        >
          {showWatersheds ? "Hide Watersheds" : "Show Watersheds"}
        </Button>
      </Stack>
    </Box>
  )
}

/**
 * Declarative component for river and watershed layers
 */
function RiverLayers({
  visible = true,
  watershedsVisible = false,
}: {
  visible?: boolean
  watershedsVisible?: boolean
}) {
  // Define sources declaratively
  useMapSources(
    [
      {
        id: "rivers",
        type: "geojson",
        data: "/data/rivers.geojson",
      },
      {
        id: "watersheds",
        type: "geojson",
        data: "/data/watersheds.geojson",
      },
    ],
    [],
  )

  // Define layers declaratively - these will update when visibility changes
  useMapLayers(
    [
      {
        id: "rivers-layer",
        source: "rivers",
        type: MAP_STYLES.river.type,
        paint: {
          ...MAP_STYLES.river.paint,
          "line-opacity": visible ? 1 : 0,
        },
        layout: MAP_STYLES.river.layout,
      },
      {
        id: "watersheds-layer",
        source: "watersheds",
        type: MAP_STYLES.watershed.type,
        paint: {
          ...MAP_STYLES.watershed.paint,
          "line-opacity": watershedsVisible ? 0.8 : 0,
        },
        layout: MAP_STYLES.watershed.layout,
      },
    ],
    [visible, watershedsVisible],
  )

  // This component doesn't render anything directly
  return null
}

/**
 * Alternative approach using imperative methods
 */
function ImperativeRiverLayers({
  visible = true,
  watershedsVisible = false,
}: {
  visible?: boolean
  watershedsVisible?: boolean
}) {
  const { addSource, addLayer, setPaintProperty, getStyle } = useMap()

  useEffect(() => {
    // Setup sources and layers
    const style = getStyle()

    if (!style.sources["rivers"]) {
      addSource("rivers", {
        type: "geojson",
        data: "/data/rivers.geojson",
      })

      addLayer(
        "rivers-layer",
        "rivers",
        MAP_STYLES.river.type,
        MAP_STYLES.river.paint,
        MAP_STYLES.river.layout,
      )
    }

    if (!style.sources["watersheds"]) {
      addSource("watersheds", {
        type: "geojson",
        data: "/data/watersheds.geojson",
      })

      addLayer(
        "watersheds-layer",
        "watersheds",
        MAP_STYLES.watershed.type,
        MAP_STYLES.watershed.paint,
        MAP_STYLES.watershed.layout,
      )
    }

    // No need to clean up - this is done by the map component
  }, [])

  // Update visibility whenever props change
  useEffect(() => {
    setPaintProperty("rivers-layer", "line-opacity", visible ? 1 : 0)
  }, [visible])

  useEffect(() => {
    setPaintProperty(
      "watersheds-layer",
      "line-opacity",
      watershedsVisible ? 0.8 : 0,
    )
  }, [watershedsVisible])

  return null
}
