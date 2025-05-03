"use client"

import { Map } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { stateMapViewState } from "./helpers/mapViews"
import {
  CarouselLayer,
  DamLayer,
  TextMarker,
  TextMarkersLayer,
} from "./helpers/mapMarkers"
import { AnimatePresence } from "@repo/motion"
import useStoryStore from "../store"
import { useBreakpoint } from "@repo/ui/hooks"

interface MapContainerProps {
  onLoad?: () => void
}

export default function MapContainer({ onLoad }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const markerLayer = useStoryStore((state) => state.markerLayer)
  const textMarkerLayer = useStoryStore((state) => state.textMarkerLayer)
  const breakpoint = useBreakpoint()
  const mapViewState = stateMapViewState[breakpoint]

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/yskuo/cma13gphw006s01spd63nhmr9"
        initialViewState={mapViewState}
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
          {markerLayer.style === "dam" && (
            <DamLayer markers={markerLayer.points} />
          )}
        </AnimatePresence>
      </Map>
    </Box>
  )
}
