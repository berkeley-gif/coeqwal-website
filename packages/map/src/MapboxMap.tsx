"use client" // necessary for mapbox-gl

import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useState,
} from "react"
import Map, { NavigationControl, Marker, Popup } from "react-map-gl/mapbox"
import type { MapRef, ViewStateChangeEvent } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { ViewState } from "./types.js" // TODO: this responsive plan for the map needs refinement

// ─────────────────────────────────────────────────────────────────────────────
// 1) RE-EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export { Marker, Popup }

// ─────────────────────────────────────────────────────────────────────────────
// 2) CUSTOM INTERFACES & TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** MarkerProperties: Info needed to render markers & tooltips */
export interface MarkerProperties {
  longitude: number
  latitude: number
  id?: string | number
  color?: string
  size?: number
  title?: string
  description?: string
  // Additional properties for tooltips
  Comment?: string
  nodeCode?: string
  properties?: {
    Comment?: string
    "node-code"?: string
    [key: string]: unknown
  }
}

/**
 * MapboxMapRef: Interface for working with the underlying map instance.
 * Provides three main methods (withMap, getMap, flyTo) plus setMarkers.
 */
export interface MapboxMapRef {
  // 2.1) withMap
  withMap: <T = void>(callback: (map: MapRef) => T, fallback?: T) => T

  // 2.2) getMap
  getMap: () => MapRef | undefined

  // 2.3) flyTo
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => void

  // 2.4) setMarkers
  setMarkers: (markers: MarkerProperties[]) => void
}

/**
 * MapboxMapProps: React props for the MapboxMap component.
 * Supports both controlled (viewState + onViewStateChange)
 * and uncontrolled modes (initialViewState).
 */
export interface MapboxMapProps {
  mapboxToken: string
  viewState?: ViewState
  initialViewState?: ViewState
  onViewStateChange?: (viewState: ViewState) => void
  style?: React.CSSProperties
  mapStyle?: string
  minZoom?: number
  attributionControl?: boolean
  scrollZoom?: boolean
  navigationControl?: boolean
  interactive?: boolean
  dragPan?: boolean
  onLoad?: () => void
}

// (Used by the higher-level Map component)
export interface MapProps extends Omit<MapboxMapProps, "onViewStateChange"> {
  viewState?: ViewState
  initialViewState?: ViewState
  onMove?: (evt: { viewState: ViewState }) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// 3) FORWARD-REF COMPONENT DEFINITION (MapboxMapBase)
// ─────────────────────────────────────────────────────────────────────────────
const MapboxMapBase: ForwardRefRenderFunction<MapboxMapRef, MapboxMapProps> = (
  {
    mapboxToken,

    // Controlled/uncontrolled camera management
    viewState,
    initialViewState,
    onViewStateChange,

    // Map configuration
    style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
    mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
    minZoom = 5.0,
    attributionControl = true,
    scrollZoom = false,
    navigationControl = true,
    interactive = true,
    dragPan = true,
    onLoad,
  },
  ref,
) => {
  // ───────────────────────────────────────────────────────────────────────────
  // 4) REFS & STATE
  // ───────────────────────────────────────────────────────────────────────────
  const internalMapRef = useRef<MapRef>(null)

  // Marker management
  const [markers, setMarkersState] = useState<MarkerProperties[]>([])
  const [selectedMarker, setSelectedMarker] = useState<MarkerProperties | null>(
    null,
  )

  // Check if we're in controlled mode
  const isControlled = viewState !== undefined

  // For uncontrolled, track local camera state
  const [internalViewState, setInternalViewState] = useState<ViewState>(
    initialViewState || {
      longitude: -122.4,
      latitude: 37.8,
      zoom: 8,
      bearing: 0,
      pitch: 0,
    },
  )

  // ───────────────────────────────────────────────────────────────────────────
  // 5) HELPER CALLBACKS
  // ───────────────────────────────────────────────────────────────────────────

  // Dynamically adjust marker size depending on the zoom
  const getScaledMarkerSize = useCallback((baseSize: number, zoom: number) => {
    const min = 4
    const max = 12
    const minScale = 0.8
    const maxScale = 1.2

    const clampedZoom = Math.max(min, Math.min(zoom, max))
    const ratio = (clampedZoom - min) / (max - min)
    const scaleFactor = minScale + ratio * (maxScale - minScale)
    return Math.round(baseSize * scaleFactor)
  }, [])

  // Fired when the map finishes loading
  const handleMapLoad = useCallback(() => {
    console.log("Map loaded")
    onLoad?.()
  }, [onLoad])

  // ───────────────────────────────────────────────────────────────────────────
  // 6) IMPERATIVE METHODS (exposed via ref)
  // ───────────────────────────────────────────────────────────────────────────

  // Single flyTo that works in both controlled & uncontrolled modes
  function flyTo(
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) {
    console.log("flyTo called, isControlled:", isControlled)

    if (isControlled && onViewStateChange) {
      onViewStateChange({
        longitude,
        latitude,
        zoom,
        bearing,
        pitch,
        transitionDuration: 3000,
      })
    } else {
      const mapInstance = internalMapRef.current
      if (!mapInstance) return

      // Imperative flyTo
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom,
        pitch,
        bearing,
        duration: 3000,
      })

      // Update local state if uncontrolled
      setInternalViewState({
        longitude,
        latitude,
        zoom,
        bearing,
        pitch,
      })
    }
  }

  // Returns the underlying MapRef
  function getMap(): MapRef | undefined {
    return internalMapRef.current ?? undefined
  }

  // Safely work with the map instance (null-check included)
  function withMap<T = void>(callback: (map: MapRef) => T, fallback?: T): T {
    const map = getMap()
    return map ? callback(map) : (fallback as T)
  }

  // Update the entire markers array
  function setMarkers(newMarkers: MarkerProperties[]) {
    setMarkersState(newMarkers)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7) MAP EVENT HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const handleViewStateChange = (evt: ViewStateChangeEvent) => {
    console.log("ViewStateChangeEvent:", evt)
    const newViewState = evt.viewState

    if (isControlled && onViewStateChange) {
      onViewStateChange(newViewState)
    } else {
      setInternalViewState(newViewState)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8) USE IMPERATIVE HANDLE
  //    Connects custom methods (flyTo, getMap, etc.) to the forwarded ref
  // ───────────────────────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo,
    getMap,
    withMap,
    setMarkers,
  }))

  // ───────────────────────────────────────────────────────────────────────────
  // 9) RENDER: MAP + CONTROLS + MARKERS + POPUP
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <Map
      ref={internalMapRef}
      reuseMaps
      mapboxAccessToken={mapboxToken}
      longitude={
        isControlled ? viewState?.longitude : internalViewState.longitude
      }
      latitude={isControlled ? viewState?.latitude : internalViewState.latitude}
      zoom={isControlled ? viewState?.zoom : internalViewState.zoom}
      bearing={
        isControlled ? viewState?.bearing || 0 : internalViewState.bearing
      }
      pitch={isControlled ? viewState?.pitch || 0 : internalViewState.pitch}
      onMove={handleViewStateChange}
      mapStyle={mapStyle}
      style={style}
      minZoom={minZoom}
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      dragPan={dragPan}
      interactive={interactive}
      onLoad={handleMapLoad}
      onClick={() => setSelectedMarker(null)}
    >
      {navigationControl && (
        <NavigationControl
          position="top-right"
          style={{ marginTop: "100px" }}
        />
      )}

      {/* Render all markers */}
      {markers.map((marker, index) => {
        const currentZoom = viewState?.zoom ?? internalViewState.zoom
        const baseSize = marker.size ?? 10
        const scaledSize = getScaledMarkerSize(baseSize, currentZoom)

        const tooltipId = marker.id || ""
        const tooltipComment =
          marker.Comment || marker.properties?.Comment || ""
        const tooltipNodeCode =
          marker.nodeCode || marker.properties?.["node-code"] || ""
        const tooltipContent = `ID: ${tooltipId}
Comment: ${tooltipComment}
Node Code: ${tooltipNodeCode}`

        return (
          <Marker
            key={String(marker.id) + index}
            longitude={marker.longitude}
            latitude={marker.latitude}
          >
            <div
              style={{
                backgroundColor: "rgba(239, 152, 39, 0.8)",
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                borderRadius: "50%",
                border: "1px solid white",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.8)",
                cursor: "pointer",
              }}
              title={tooltipContent}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMarker(
                  selectedMarker?.id === marker.id ? null : marker,
                )
              }}
            />
          </Marker>
        )
      })}

      {/* Popup for selected marker */}
      {selectedMarker && (
        <Popup
          longitude={selectedMarker.longitude}
          latitude={selectedMarker.latitude}
          closeButton={true}
          closeOnClick={false}
          onClose={() => setSelectedMarker(null)}
          anchor="bottom"
          offset={15}
          style={{ zIndex: 10 }}
        >
          <div style={{ padding: "5px", fontFamily: "Arial, sans-serif" }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                color: "#154F89",
                fontSize: "16px",
              }}
            >
              {selectedMarker.id}
            </h3>
            {selectedMarker.Comment && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Comment:</strong>{" "}
                {selectedMarker.Comment || selectedMarker.properties?.Comment}
              </div>
            )}
            {(selectedMarker.nodeCode ||
              selectedMarker.properties?.["node-code"]) && (
              <div style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Node Type:</strong>{" "}
                {selectedMarker.nodeCode ||
                  selectedMarker.properties?.["node-code"]}
              </div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 10) EXPORT THE FINAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>(MapboxMapBase)
