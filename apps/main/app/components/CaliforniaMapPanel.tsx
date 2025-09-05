"use client"

import { Map } from "@repo/map"
import { Box } from "@repo/ui/mui"

interface CaliforniaMapPanelProps {
  id?: string
  mapboxToken?: string
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  return (
    <Box
      id={id}
      sx={{
        position: "sticky",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: (theme) => theme.zIndex.basement, // Map when used as background element
      }}
    >
      <Map
        mapboxToken={token}
        mapStyle="mapbox://styles/digijill/clz4h7lfm00mn01rih4x75g46"
        initialViewState={{
          longitude: -121.4944,
          latitude: 37.0902,
          zoom: 7,
          bearing: 0,
          pitch: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        dragPan={true}
        interactive={true}
      />
    </Box>
  )
}
