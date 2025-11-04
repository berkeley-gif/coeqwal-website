"use client"

import { Source, Layer } from "@repo/map"

interface BasinsLayerProps {
  visible: boolean
}

export default function BasinsLayer({ visible }: BasinsLayerProps) {
  if (!visible) {
    return null
  }

  return (
    <Source
      id="basins-source"
      type="geojson"
      data="/geospatial_data/basins.geojson"
    >
      <Layer
        id="basins-layer"
        type="fill"
        paint={{
          "fill-color": "transparent",
          "fill-opacity": 0,
        }}
      />
      <Layer
        id="basins-outline-layer"
        type="line"
        paint={{
          "line-color": "white",
          "line-width": 1.5,
          "line-opacity": 0.8,
        }}
      />
      <Layer
        id="basins-labels"
        type="symbol"
        layout={{
          "text-field": ["get", "name"],
          "text-font": ["Neue Haas Grotesk", "Arial Unicode MS Bold"],
          "text-size": 16,
          "text-anchor": "center",
          "symbol-placement": "point",
          "text-offset": [
            "case",
            ["==", ["get", "name"], "Sacramento River Basin"],
            [0, 0],
            ["==", ["get", "name"], "San Joaquin River Basin"],
            [0, 0],
            [0, 1], // Tulare - slight adjustment down
          ],
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": "#3a4574", // theme.palette.blue.darkest
          "text-halo-width": 1,
          "text-opacity": 1,
        }}
      />
    </Source>
  )
}
