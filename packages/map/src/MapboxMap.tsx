"use client"

import React from "react"
import Map, { NavigationControl } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

export interface MapProps {
  mapboxToken: string
  initialViewState?: {
    latitude: number
    longitude: number
    zoom: number
    pitch?: number
    bearing?: number
  }
  minZoom?: number
  style?: React.CSSProperties // Inline CSS styling for the map container
  mapStyle?: string // Basemap style URL. Defaults to COEQWAL's custom satellite style
  attributionControl?: boolean
  scrollZoom?: boolean
}

type ViewStateChangeEvent = {
  viewState: {
    longitude: number
    latitude: number
    zoom: number
    pitch: number
    bearing: number
  }
}

/*
 * Usage example:
 * <MapboxMap
 *   mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}
 *   initialViewState={{ latitude: 37.8, longitude: -122.4, zoom: 8 }}
 *   style={{ width: '100%', height: '400px' }}
 * />
 */

export const MapboxMap: React.FC<MapProps> = ({
  mapboxToken,
  initialViewState = {
    longitude: -120.0298,
    latitude: 37.6733,
    zoom: 5.36,
    pitch: 0,
    bearing: 0,
  },
  minZoom = 5.0,
  style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
  mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
  attributionControl = true,
  scrollZoom = false,
}) => {

  return (
    <Map
      mapboxAccessToken={mapboxToken}
      initialViewState={initialViewState}
      minZoom={minZoom}
      mapStyle={mapStyle}
      style={style}
      reuseMaps
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      dragPan={true}
      onMove={(evt: ViewStateChangeEvent) => {
        const { longitude, latitude, zoom, pitch, bearing } = evt.viewState
        console.log(
          `Lon: ${longitude}, Lat: ${latitude}, Zoom: ${zoom}, Pitch: ${pitch}, Bearing: ${bearing}`
        )
      }}
    >
      <NavigationControl position="top-right" />
    </Map>
  )
}
