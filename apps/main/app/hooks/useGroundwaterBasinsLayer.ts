import { useCallback, useState } from "react"

export const GROUNDWATER_SOURCE_ID = "groundwater-basins-source"
export const GROUNDWATER_LAYER_ID = "groundwater-basins-layer"

export function useGroundwaterBasinsLayer() {
  const [isLoaded, setIsLoaded] = useState(false)

  // Add the groundwater basins source and layer to the map
  const addGroundwaterLayer = useCallback((map: mapboxgl.Map) => {
    if (!map) return

    // Check if source already exists
    if (!map.getSource(GROUNDWATER_SOURCE_ID)) {
      try {
        // Add the GeoJSON source with inline data instead of loading from file
        map.addSource(GROUNDWATER_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  id: "1",
                  name: "Central Valley Aquifer",
                  status: "high-priority",
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-121.5, 37.0],
                      [-120.0, 37.0],
                      [-120.0, 38.5],
                      [-121.5, 38.5],
                      [-121.5, 37.0],
                    ],
                  ],
                },
              },
              {
                type: "Feature",
                properties: {
                  id: "2",
                  name: "Sacramento Valley Groundwater Basin",
                  status: "medium-priority",
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-122.0, 38.5],
                      [-121.0, 38.5],
                      [-121.0, 39.5],
                      [-122.0, 39.5],
                      [-122.0, 38.5],
                    ],
                  ],
                },
              },
              {
                type: "Feature",
                properties: {
                  id: "3",
                  name: "San Joaquin Valley Groundwater Basin",
                  status: "critical",
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-121.0, 36.0],
                      [-119.5, 36.0],
                      [-119.5, 37.0],
                      [-121.0, 37.0],
                      [-121.0, 36.0],
                    ],
                  ],
                },
              },
            ],
          },
        })

        // Add the fill layer with initial opacity of 0
        map.addLayer({
          id: GROUNDWATER_LAYER_ID,
          type: "fill",
          source: GROUNDWATER_SOURCE_ID,
          paint: {
            "fill-color": "#3388ff", // Blue color for water
            "fill-opacity": 0, // Start invisible for fade-in
            "fill-outline-color": "#ffffff", // White border
          },
        })

        setIsLoaded(true)
        console.log("Groundwater basins layer added")
      } catch (error) {
        console.error("Error adding groundwater layer:", error)
      }
    }
  }, [])

  // Animate the opacity of the groundwater basins layer
  const fadeInGroundwaterLayer = useCallback(
    (
      map: mapboxgl.Map,
      targetOpacity: number = 0.6,
      duration: number = 2000,
    ) => {
      if (!map || !map.getLayer(GROUNDWATER_LAYER_ID)) return

      const startTime = performance.now()
      const startOpacity =
        (map.getPaintProperty(
          GROUNDWATER_LAYER_ID,
          "fill-opacity",
        ) as number) || 0

      function animate(time: number) {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Use easing for smoother animation
        const easedProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2

        const currentOpacity =
          startOpacity + (targetOpacity - startOpacity) * easedProgress

        map.setPaintProperty(
          GROUNDWATER_LAYER_ID,
          "fill-opacity",
          currentOpacity,
        )

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          console.log("Groundwater basins fade-in complete")
        }
      }

      requestAnimationFrame(animate)
    },
    [],
  )

  // Remove the groundwater basins layer
  const removeGroundwaterLayer = useCallback((map: mapboxgl.Map) => {
    if (!map) return

    if (map.getLayer(GROUNDWATER_LAYER_ID)) {
      map.removeLayer(GROUNDWATER_LAYER_ID)
    }

    if (map.getSource(GROUNDWATER_SOURCE_ID)) {
      map.removeSource(GROUNDWATER_SOURCE_ID)
    }

    setIsLoaded(false)
  }, [])

  return {
    isLoaded,
    addGroundwaterLayer,
    fadeInGroundwaterLayer,
    removeGroundwaterLayer,
  }
}
