"use client"

import { Map } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { stateMapViewState } from "./helpers/mapViews"
import {
  CarouselLayer,
  TextMarker,
  TextMarkersLayer,
} from "./helpers/mapMarkers"
import { AnimatePresence } from "@repo/motion"
import useStoryStore from "../store"

interface MapContainerProps {
  onLoad?: () => void
}

export default function MapContainer({ onLoad }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const markerLayer = useStoryStore((state) => state.markerLayer)
  const textMarkerLayer = useStoryStore((state) => state.textMarkerLayer)

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/yskuo/cma13gphw006s01spd63nhmr9"
        initialViewState={stateMapViewState}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        navigationControl={false}
        dragPan={false}
        onLoad={onLoad}
      >
        <AnimatePresence>
          {markerLayer.style === "rough-circle" && (
            <CarouselLayer markers={markerLayer.points} />
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
        </AnimatePresence>
      </Map>
    </Box>
  )
}
