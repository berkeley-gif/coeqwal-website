"use client"

import { useEffect } from "react"
import { Layer, Marker, Source, useMap } from "@repo/map"
import { yubaRiver } from "@repo/data"
import { Box, Typography } from "@repo/ui/mui"
import { FreshWaterColor, OceanWaterColor } from "../../helpers/colorPalette"
import { YUBA_RIVER_LABEL } from "../config/locationPresets"
import { useLazyMount } from "../hooks/useLazyMount"

const YUBA_RIVER_LAYER_IDS = ["yuba-river-halo", "yuba-river-body"] as const

const YUBA_RIVER_SOURCE_ID = "yuba-river-source"
const RIVER_HALO_COLOR = "#07142c"
export default function YubaRiverLayer({
  visible,
  showLabel = true,
}: {
  visible: boolean
  showLabel?: boolean
}) {
  const { mapRef } = useMap()
  const shouldMount = useLazyMount(visible)
  const visibilityValue = visible ? "visible" : "none"

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    YUBA_RIVER_LAYER_IDS.forEach((id) => {
      if (!map.getLayer(id)) return

      map.setLayoutProperty(id, "visibility", visibilityValue)
    })
  }, [mapRef, visibilityValue])

  useEffect(() => {
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    YUBA_RIVER_LAYER_IDS.forEach((id) => {
      try {
        if (map.getLayer(id)) map.moveLayer(id)
      } catch {
        // Layer order is best-effort while the Mapbox style settles.
      }
    })
  }, [mapRef, visible])

  if (!shouldMount) return null

  return (
    <>
      <Source id={YUBA_RIVER_SOURCE_ID} type="geojson" data={yubaRiver}>
        <Layer
          id="yuba-river-halo"
          type="line"
          paint={{
            "line-color": RIVER_HALO_COLOR,
            "line-width": 9,
            "line-opacity": 0.72,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="yuba-river-body"
          type="line"
          paint={{
            "line-color": FreshWaterColor,
            "line-width": 5,
            "line-opacity": 1,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      {visible && showLabel ? (
        <Marker
          longitude={YUBA_RIVER_LABEL.longitude}
          latitude={YUBA_RIVER_LABEL.latitude}
        >
          <Box
            sx={{ position: "absolute", transform: "translate(-50%, -50%)" }}
          >
            <Typography
              component="span"
              sx={{
                whiteSpace: "nowrap",
                color: "#fcfbfa",
                typography: "caption",
                fontWeight: 700,
                backgroundColor: OceanWaterColor,
                padding: "5px 10px",
                lineHeight: 1,
                textAlign: "center",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
              }}
            >
              {YUBA_RIVER_LABEL.name}
            </Typography>
          </Box>
        </Marker>
      ) : null}
    </>
  )
}
