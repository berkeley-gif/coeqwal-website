"use client"

import { useEffect, useRef } from "react"
import { Map } from "@repo/map"
import { useMap } from "@repo/map"
import type { MapboxMapRef, ViewState } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { useMapState, mapActions } from "@repo/state/map"

interface MapContainerProps {
  // Props for backward compatibility
  uncontrolledRef?: React.RefObject<MapboxMapRef>
  viewState?: ViewState
  onViewStateChange?: (newViewState: ViewState) => void
}

export default function MapContainer({
  uncontrolledRef,
  viewState,
  onViewStateChange,
}: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  const mapState = useMapState()

  // Keep track of whether the map is initialized
  const initialized = useRef(false)

  // Once the map is mounted, register it with our actions
  useEffect(() => {
    // Connect uncontrolledRef to the context mapRef
    if (uncontrolledRef && mapRef.current) {
      uncontrolledRef.current = mapRef.current
    }

    // For our state management, just register the map instance
    // for the actions to use directly
    if (mapRef.current && !initialized.current) {
      // Register the map instance with our custom actions
      mapActions.registerMapInstance(mapRef.current as any)
      initialized.current = true
    }
  }, [uncontrolledRef, mapRef])

  // For backward compatibility only - update global state when local state changes
  useEffect(() => {
    if (viewState && onViewStateChange) {
      // Only sync if component is controlled (has both props)
      mapState.onViewStateChange({
        ...viewState,
        bearing: viewState.bearing ?? 0,
        pitch: viewState.pitch ?? 0,
      })
    }
  }, [viewState, onViewStateChange, mapState])

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        pointerEvents: "auto",
      }}
    >
      <Map
        mapboxToken={mapboxToken}
        // Prefer global state from Zustand, fall back to local state
        viewState={mapState.viewState}
        initialViewState={mapState.viewState}
        onMove={(evt: { viewState: ViewState }) => {
          // Update global state first
          mapState.onViewStateChange({
            ...evt.viewState,
            bearing: evt.viewState.bearing ?? 0,
            pitch: evt.viewState.pitch ?? 0,
          })

          // For backward compatibility, also update local state
          if (onViewStateChange) {
            onViewStateChange(evt.viewState)
          }
        }}
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        scrollZoom={false}
        interactive={true}
        dragPan={true}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  )
}
