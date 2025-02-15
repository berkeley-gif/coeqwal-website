import React from "react"
import Map, { NavigationControl } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

export interface MapProps {
  mapboxToken: string // Store in app's .env file
  initialViewState: {
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
}

/**
 * A minimal React component wrapping `react-map-gl`. Props values listed below are defaults.
 *
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
  style = { width: "100vw", height: "100vh" },
  mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
  attributionControl = true,
}) => {
  return (
    <Map
      mapboxApiAccessToken={mapboxToken}
      initialViewState={initialViewState}
      minZoom={minZoom}
      mapStyle={mapStyle}
      style={style}
      reuseMaps={true}
      attributionControl={attributionControl}
    >
      <NavigationControl position="bottom-right" />
    </Map>
  )
}
