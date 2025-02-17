"use client"

import React, { useRef, useState, useEffect } from "react"
import Map, { NavigationControl, MapRef, ViewState } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { useTheme, useMediaQuery } from "@mui/material"

export interface MapProps {
  mapboxToken: string
  /** Optional initial view */
  initialViewState?: ViewState
  minZoom?: number
  style?: React.CSSProperties // Inline CSS styling for the map container
  mapStyle?: string // Basemap style URL. Defaults to COEQWAL's custom satellite style
  attributionControl?: boolean
  scrollZoom?: boolean

  /**
   * If true, this component re-anchors on window resize
   * (e.g., preserves the same center).
   */
  responsive?: boolean
}

type ViewStateChangeEvent = {
  viewState: ViewState
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
    longitude: -129.06368988805684,
    latitude: 37.46691559581208,
    zoom: 5.36,
    pitch: 0,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
  minZoom = 5.0,
  style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
  mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
  attributionControl = true,
  scrollZoom = false,

  // Prop to control whether we anchor on resize
  responsive = true,
}) => {
  // 1. Convert initialViewState to a React state so we can control it.
  const [viewState, setViewState] = useState<ViewState>(initialViewState)
  // Ref to the underlying "core" map / interactions
  const mapRef = useRef<MapRef>(null)

  const theme = useTheme()
  // Example: separate breakpoints for small & medium screens
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.only("xl"))

  // When viewport changes, recenter/zoom as desired
  useEffect(() => {
    if (!responsive) return

    // If size is <= 599px
    if (isXs) {
      setViewState((prev) => ({
        ...prev,
        longitude: -123.32201065632816,
        latitude: 36.91827613725431,
        zoom: 5,
        pitch: 0,
        bearing: 0,
      }))
    }
    // If size is between 600px and < 900px
    else if (isSm) {
      setViewState((prev) => ({
        ...prev,
        longitude: -123.32201065632816,
        latitude: 36.91827613725431,
        zoom: 5,
        pitch: 0,
        bearing: 0,
      }))
    }
    // If size is between 900px and < 1200px
    else if (isMd) {
      setViewState((prev) => ({
        ...prev,
        longitude: -124.26560803859064,
        latitude: 37.33091086711717,
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
      }))
    }
    // If size is between 1200px and < 1536px
    else if (isLg) {
      setViewState((prev) => ({
        ...prev,
        longitude: -122.7281490904835,
        latitude: 37.33091086711717,
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
      }))
    }
    // If size is >= 1536px (xl or default)
    else {
      setViewState((prev) => ({
        ...prev,
        longitude: -128.86525814333174,
        latitude: 37.33091086711717,
        zoom: 5.5,
        pitch: 0,
        bearing: 0,
      }))
    }
  }, [responsive, isXs, isSm, isMd, isLg, isXl])

  return (
    <Map
      ref={mapRef}
      reuseMaps
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      style={style}
      // Instead of using initialViewState, supply our controlled values:
      {...viewState}
      minZoom={minZoom}
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      dragPan
      // onMove updates our viewState any time the user pans/zooms
      onMove={(evt: { viewState: ViewState }) => {
        setViewState(evt.viewState)
        console.log(
          `Lon: ${evt.viewState.longitude}, ` +
            `Lat: ${evt.viewState.latitude}, ` +
            `Zoom: ${evt.viewState.zoom}, ` +
            `Pitch: ${evt.viewState.pitch}, ` +
            `Bearing: ${evt.viewState.bearing}`,
        )
      }}
    >
      <NavigationControl position="top-right" style={{ marginTop: "100px" }} />
    </Map>
  )
}
