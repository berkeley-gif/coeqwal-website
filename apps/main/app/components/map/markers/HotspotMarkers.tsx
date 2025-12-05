"use client"

import { Marker } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { MapMarkerTooltip } from "@repo/ui"

interface HotspotMarkersProps {
  visible?: boolean
}

export default function HotspotMarkers({
  visible = true,
}: HotspotMarkersProps) {
  if (!visible) return null

  return (
    <>
      {/* Marker 1: Los Angeles area */}
      <Marker longitude={-118.2437} latitude={34.0522} anchor="bottom">
        <MapMarkerTooltip
          text="Los Angeles - Urban water demand performing well"
          statusColor="#4CAF50"
        >
          <Box
            sx={{
              position: "relative",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.3)",
              },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/map_markers/los_angeles.png"
              alt="Los Angeles marker"
              style={{
                width: "60px",
                height: "auto",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            />
            {/* Status indicator */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#4CAF50", // Green for good status
                border: "2px solid white",
              }}
            />
          </Box>
        </MapMarkerTooltip>
      </Marker>

      {/* Marker 2: Sacramento area */}
      <Marker longitude={-121.3} latitude={38.6} anchor="bottom">
        <MapMarkerTooltip
          text="Sacramento - Municipal water supply under stress"
          statusColor="#ff4444"
        >
          <Box
            sx={{
              position: "relative",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.3)",
              },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/map_markers/drinking_water.png"
              alt="Sacramento drinking water marker"
              style={{
                width: "60px",
                height: "auto",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            />
            {/* Status indicator */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#ff4444", // Red for bad status
                border: "2px solid white",
              }}
            />
          </Box>
        </MapMarkerTooltip>
      </Marker>

      {/* Marker 3: Westlands W.D. - Central Valley */}
      <Marker longitude={-120.58} latitude={36.58} anchor="bottom">
        <MapMarkerTooltip
          text="Central Valley - Agricultural irrigation stable"
          statusColor="#4CAF50"
        >
          <Box
            sx={{
              position: "relative",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.3)",
              },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/map_markers/farmers.png"
              alt="Central Valley marker"
              style={{
                width: "60px",
                height: "auto",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            />
            {/* Status indicator */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#4CAF50", // Green
                border: "2px solid white",
              }}
            />
          </Box>
        </MapMarkerTooltip>
      </Marker>

      {/* Marker 4: Chico area */}
      <Marker longitude={-121.95} latitude={39.7285} anchor="bottom">
        <MapMarkerTooltip
          text="Chico - Crop irrigation facing drought challenges"
          statusColor="#ff4444"
        >
          <Box
            sx={{
              position: "relative",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.3)",
              },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/map_markers/farmers.png"
              alt="Chico marker"
              style={{
                width: "60px",
                height: "auto",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              }}
            />
            {/* Status indicator */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#ff4444", // Red for challenges
                border: "2px solid white",
              }}
            />
          </Box>
        </MapMarkerTooltip>
      </Marker>
    </>
  )
}
