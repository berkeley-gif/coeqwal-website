"use client"

import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { Map, MapProvider, useMap } from "@repo/map"
import type { TierColorMap } from "../../map/visualizationLayers/types"

const MAPBOX_STYLE = "mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
const FILL_LAYER_ID = "demand-units"
const OUTLINE_LAYER_ID = "demand-units-tier-outline"

const CENTRAL_VALLEY_VIEW = {
  longitude: -120.5,
  latitude: 37.2,
  zoom: 6.2,
  bearing: 0,
  pitch: 0,
}

interface TierDemoMapProps {
  tierColorMap: Record<string, string>
  opacity?: number
}

export interface TierDemoMapHandle {
  project: (lng: number, lat: number) => { x: number; y: number } | null
}

function buildFillColorExpression(
  tierColorMap: TierColorMap,
  defaultColor: string,
): ["match", ...unknown[]] | string {
  const pairs: (string | number)[] = []
  for (const [featureId, color] of Object.entries(tierColorMap)) {
    pairs.push(featureId, color)
  }
  if (pairs.length === 0) return defaultColor
  return ["match", ["get", "DU_ID"], ...pairs, defaultColor]
}

function TierDemoMapInner({
  tierColorMap,
}: {
  tierColorMap: Record<string, string>
}) {
  const { mapRef } = useMap()
  const [loaded, setLoaded] = useState(false)
  const appliedRef = useRef(false)

  const applyTierStyles = useCallback(() => {
    const map = mapRef?.current?.getMap()
    if (!map) return false

    const layer = map.getLayer(FILL_LAYER_ID)
    if (!layer) return false

    const hasTierData = Object.keys(tierColorMap).length > 0
    const colorExpr = buildFillColorExpression(tierColorMap, "rgba(0,0,0,0)")

    map.setPaintProperty(FILL_LAYER_ID, "fill-opacity-transition", { duration: 0, delay: 0 })
    map.setPaintProperty(FILL_LAYER_ID, "fill-color", colorExpr as any)
    map.setPaintProperty(FILL_LAYER_ID, "fill-outline-color", colorExpr as any)
    map.setPaintProperty(FILL_LAYER_ID, "fill-opacity", hasTierData ? 0.9 : 0.4)
    map.setLayoutProperty(FILL_LAYER_ID, "visibility", "visible")

    try { map.moveLayer(FILL_LAYER_ID) } catch { /* ok */ }

    // Create tier-colored outline layer (same pattern as OutcomePolygonLayer)
    if (!map.getLayer(OUTLINE_LAYER_ID)) {
      const sourceId = (layer as any).source as string
      const sourceLayer = (layer as any)["source-layer"] as string | undefined

      try {
        map.addLayer({
          id: OUTLINE_LAYER_ID,
          type: "line",
          source: sourceId,
          ...(sourceLayer ? { "source-layer": sourceLayer } : {}),
          paint: {
            "line-color": colorExpr as any,
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              5, 0.5,
              7, 1,
              9, 2,
              11, 3,
            ],
            "line-opacity": 0.9,
            "line-offset": [
              "interpolate", ["linear"], ["zoom"],
              5, -0.25,
              7, -0.5,
              9, -1,
              11, -1.5,
            ],
          },
        })
      } catch { /* layer may already exist */ }
    } else {
      map.setPaintProperty(OUTLINE_LAYER_ID, "line-color", colorExpr as any)
    }

    return true
  }, [tierColorMap, mapRef])

  useEffect(() => {
    if (!loaded) return

    if (applyTierStyles()) {
      appliedRef.current = true
      return
    }

    const interval = setInterval(() => {
      if (applyTierStyles()) {
        appliedRef.current = true
        clearInterval(interval)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (appliedRef.current && loaded) {
      applyTierStyles()
    }
  }, [tierColorMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <Map
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      mapStyle={MAPBOX_STYLE}
      initialViewState={CENTRAL_VALLEY_VIEW}
      minZoom={5}
      maxZoom={8}
      scrollZoom={false}
      touchZoom={false}
      doubleClickZoom={false}
      dragPan={false}
      dragRotate={false}
      touchRotate={false}
      keyboard={false}
      interactive={false}
      style={{ width: "100%", height: "100%" }}
      projection={{ name: "globe" }}
      onLoad={handleLoad}
    />
  )
}

const TierDemoMap = forwardRef<TierDemoMapHandle, TierDemoMapProps>(
  function TierDemoMap({ tierColorMap, opacity = 1 }, ref) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          transition: "opacity 0.3s ease",
          borderRadius: "inherit",
          overflow: "hidden",
        }}
      >
        <MapProvider>
          <ProjectHandle ref={ref} />
          <TierDemoMapInner tierColorMap={tierColorMap} />
        </MapProvider>
      </div>
    )
  },
)

const ProjectHandle = forwardRef<TierDemoMapHandle>(
  function ProjectHandle(_, ref) {
    const { mapRef } = useMap()

    useImperativeHandle(ref, () => ({
      project(lng: number, lat: number) {
        const map = mapRef?.current?.getMap()
        if (!map) return null
        const pt = map.project([lng, lat])
        return { x: pt.x, y: pt.y }
      },
    }), [mapRef])

    return null
  },
)

export default TierDemoMap
