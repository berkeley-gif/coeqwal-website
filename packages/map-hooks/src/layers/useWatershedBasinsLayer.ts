import { useCallback, useState } from "react"
import { WATERSHEDS_BASINS_PATH } from "@repo/geo-data/src/california/basins"

export const WATERSHED_BASINS_SOURCE_ID = "watershed-basins-source"
export const WATERSHED_BASINS_LAYER_ID = "watershed-basins-layer"

export function useWatershedBasinsLayer() {
  const [isLoaded, setIsLoaded] = useState(false)

  // New function to create a chloropleth effect
  const createChloroplethEffect = useCallback(
    (map: mapboxgl.Map, blueHue: number = 210) => {
      if (!map || !map.getLayer(WATERSHED_BASINS_LAYER_ID)) return

      try {
        // Use HSL color to create a random effect with consistent blue family
        map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-color", [
          "case",
          ["==", ["%", ["get", "FID"], 4], 0],
          `hsl(${blueHue}, 80%, 80%)`, // Light blue
          ["==", ["%", ["get", "FID"], 4], 1],
          `hsl(${blueHue}, 85%, 70%)`, // Medium light blue
          ["==", ["%", ["get", "FID"], 4], 2],
          `hsl(${blueHue}, 90%, 60%)`, // Medium blue
          ["==", ["%", ["get", "FID"], 4], 3],
          `hsl(${blueHue}, 95%, 35%)`, // Dark blue
          `hsl(${blueHue}, 85%, 60%)`, // Default blue
        ])

        console.log("Applied chloropleth effect with hue:", blueHue)
      } catch (e) {
        console.error("Error creating chloropleth effect:", e)
        // Fallback to solid color
        map.setPaintProperty(
          WATERSHED_BASINS_LAYER_ID,
          "fill-color",
          `hsl(${blueHue}, 70%, 60%)`, // Solid blue fallback
        )
      }
    },
    [],
  )

  // Add the watershed basins source and layer to the map
  const addWatershedBasinsLayer = useCallback((map: mapboxgl.Map) => {
    if (!map) return

    // Check if source already exists
    if (!map.getSource(WATERSHED_BASINS_SOURCE_ID)) {
      try {
        // Add the GeoJSON source
        map.addSource(WATERSHED_BASINS_SOURCE_ID, {
          type: "geojson",
          data: WATERSHEDS_BASINS_PATH,
        })

        // Add the fill layer with initial opacity of 0
        map.addLayer({
          id: WATERSHED_BASINS_LAYER_ID,
          type: "fill",
          source: WATERSHED_BASINS_SOURCE_ID,
          paint: {
            "fill-color": "rgba(255, 255, 255, 0)",
            "fill-opacity": 0,
            "fill-outline-color": "#ffffff",
          },
        })

        setIsLoaded(true)
        console.log("Watershed basins layer added")
      } catch (error) {
        console.error("Error adding watershed basins layer:", error)
      }
    }
  }, [])

  // Set the visibility of the watershed basins layer
  const setWatershedBasinsVisibility = useCallback(
    (map: mapboxgl.Map, visible: boolean) => {
      if (!map || !map.getLayer(WATERSHED_BASINS_LAYER_ID)) return

      try {
        // Set opacity based on visibility
        const opacity = visible ? 0.6 : 0
        map.setPaintProperty(WATERSHED_BASINS_LAYER_ID, "fill-opacity", opacity)
        console.log(
          `Watershed basins visibility set to: ${visible ? "visible" : "hidden"}`,
        )
      } catch (error) {
        console.error("Error setting watershed basins visibility:", error)
      }
    },
    [],
  )

  // Animate the opacity of the watershed basins layer
  const fadeInWatershedBasinsLayer = useCallback(
    (
      map: mapboxgl.Map,
      targetOpacity: number = 0.6,
      duration: number = 2000,
    ) => {
      if (!map || !map.getLayer(WATERSHED_BASINS_LAYER_ID)) return

      const startTime = performance.now()
      const startOpacity =
        (map.getPaintProperty(
          WATERSHED_BASINS_LAYER_ID,
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
          WATERSHED_BASINS_LAYER_ID,
          "fill-opacity",
          currentOpacity,
        )

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          console.log("Watershed basins fade-in complete")
        }
      }

      requestAnimationFrame(animate)
    },
    [],
  )

  // Remove the watershed basins layer
  const removeWatershedBasinsLayer = useCallback((map: mapboxgl.Map) => {
    if (!map) return

    if (map.getLayer(WATERSHED_BASINS_LAYER_ID)) {
      map.removeLayer(WATERSHED_BASINS_LAYER_ID)
    }

    if (map.getSource(WATERSHED_BASINS_SOURCE_ID)) {
      map.removeSource(WATERSHED_BASINS_SOURCE_ID)
    }

    setIsLoaded(false)
  }, [])

  return {
    isLoaded,
    addWatershedBasinsLayer,
    setWatershedBasinsVisibility,
    fadeInWatershedBasinsLayer,
    removeWatershedBasinsLayer,
    createChloroplethEffect, // Export the new chloropleth function
  }
}
