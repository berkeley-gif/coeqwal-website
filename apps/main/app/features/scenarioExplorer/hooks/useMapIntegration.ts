import { useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import { useMapSources, useMapLayers } from "@repo/map"

/**
 * Hook that manages map integration for the scenario explorer
 * Handles map sources, layers, and styling based on selected outcomes
 */
export function useMapIntegration(
  showMapView: boolean,
  anySelectedOutcome: string | null,
) {
  const theme = useTheme()

  // Declarative source management
  useMapSources(
    [
      {
        id: "delivery-units",
        type: "geojson",
        data: "/geospatial_data/du.geojson",
      },
    ],
    [showMapView],
  )

  // Memoize map layers to prevent recreation on every render
  const mapLayers = useMemo(
    () =>
      [
        {
          id: "delivery-units-fill",
          type: "fill",
          source: "delivery-units",
          paint: {
            "fill-color": anySelectedOutcome
              ? [
                  "case",
                  ["==", ["get", "DU_NAME"], anySelectedOutcome],
                  theme.palette.blue.bright,
                  theme.palette.grey[300],
                ]
              : theme.palette.blue.bright,
            "fill-opacity": anySelectedOutcome ? 0.8 : 0.3,
          },
        },
        {
          id: "delivery-units-stroke",
          type: "line",
          source: "delivery-units",
          paint: {
            "line-color": theme.palette.grey[600],
            "line-width": anySelectedOutcome ? 2 : 1,
          },
        },
        // TODO: type this
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    [anySelectedOutcome, theme],
  )

  // Declarative layer management based on selected outcomes
  useMapLayers(mapLayers, [])

  return {
    mapLayers,
  }
}
