"use client"

import { Map } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { stateMapViewState } from "./helpers/mapViews"
import { MarkersLayer } from "./helpers/mapMarkers"
import { AnimatePresence } from "@repo/motion"
import useStoryStore from "../store"

interface MapContainerProps {
  onLoad?: () => void
}

export default function MapContainer({ onLoad }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const markers = useStoryStore((state) => state.markers)

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/yskuo/cm9dhus8h009v01sp2sxn2g6r"
        initialViewState={stateMapViewState}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        navigationControl={false}
        dragPan={false}
        onLoad={onLoad}
      >
        <AnimatePresence>
          <MarkersLayer markers={markers} />
        </AnimatePresence>
      </Map>
    </Box>
  )
}
