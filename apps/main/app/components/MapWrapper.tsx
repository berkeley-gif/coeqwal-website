"use client"

import React, { useCallback, useEffect } from "react"
import { useMap } from "../context/MapContext"
import { MapboxMap, MinimalViewState } from "@repo/map"
import { useTheme, useMediaQuery } from "@mui/material"
import { breakpointViews } from "../../lib/mapViews"

export default function MapWrapper() {
  const { viewState, setViewState, mapRef, setMapLoaded } = useMap()
  const theme = useTheme()

  // Basic breakpoint detection
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))

  // Memoize getBreakpointKey
  const getBreakpointKey = useCallback((): "xs" | "sm" | "md" | "lg" | "xl" => {
    if (isXs) return "xs"
    if (isSm) return "sm"
    if (isMd) return "md"
    if (isLg) return "lg"
    if (isXl) return "xl"
    return "xl"
  }, [isXs, isSm, isMd, isLg, isXl])

  // Whenever breakpoints change, update the map's view
  useEffect(() => {
    const bpKey = getBreakpointKey()
    const coords = breakpointViews[bpKey]
    setViewState((prev: MinimalViewState) => ({
      ...prev,
      ...coords,
      transitionDuration: 1000,
    }))
  }, [isXs, isSm, isMd, isLg, isXl, setViewState, getBreakpointKey])

  return (
    <MapboxMap
      ref={mapRef}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={(vs) => setViewState(vs)}
      style={{ width: "100%", height: "100%" }}
      scrollZoom={false}
      onLoad={() => {
        setMapLoaded(true)
      }}
    />
  )
}
