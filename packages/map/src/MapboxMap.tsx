"use client"

import React, { useRef, useState, useEffect } from "react"
import Map, { NavigationControl, MapRef, ViewState } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { useTheme, useMediaQuery } from "@mui/material"
import { Theme } from "@mui/material/styles"
import { initialMapView, breakpointViews } from "../../../apps/main/lib/mapViews.ts"

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
  // Fallback to shared default
  initialViewState = initialMapView,
  minZoom = 5.0,
  style = { width: "100vw", height: "100vh", pointerEvents: "auto" },
  mapStyle = "mapbox://styles/digijill/cl122pj52001415qofin7bb1c",
  attributionControl = true,
  scrollZoom = false,

  // Prop to control whether we anchor on resize
  responsive = true,
}) => {
  // The controlled view state
  const [viewState, setViewState] = useState<ViewState>(initialViewState)

  // Access raw map if needed
  const mapRef = useRef<MapRef>(null)

  const theme = useTheme<Theme>()
  // Example: separate breakpoints for small & medium screens
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.only("xl"))

  // On resize, change view
  useEffect(() => {
    if (!responsive) return

    if (isXs) {
      setViewState(prev => ({ ...prev, ...breakpointViews.xs }))
    } else if (isSm) {
      setViewState(prev => ({ ...prev, ...breakpointViews.sm }))
    } else if (isMd) {
      setViewState(prev => ({ ...prev, ...breakpointViews.md }))
    } else if (isLg) {
      setViewState(prev => ({ ...prev, ...breakpointViews.lg }))
    } else {
      // xl + default
      setViewState(prev => ({ ...prev, ...breakpointViews.xl }))
    }
  }, [responsive, isXs, isSm, isMd, isLg, isXl])

  return (
    <Map
      ref={mapRef}
      reuseMaps
      mapboxAccessToken={mapboxToken}
      mapStyle={mapStyle}
      style={style}
      // Controlled view
      {...viewState}
      minZoom={minZoom}
      attributionControl={attributionControl}
      scrollZoom={scrollZoom}
      // Let user drag/pan
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
