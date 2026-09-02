"use client"

import { useEffect } from "react"
import { Layer, Marker, Source, useMap } from "@repo/map"
import { FreshWaterColor } from "../../helpers/colorPalette"
import { useLazyMount } from "../hooks/useLazyMount"
import { INDIGENOUS_RIVER_NETWORK_TROUGH_LAYER_ID } from "./IndigenousRiverNetworkLayer"
import ShastaIcon from "../markers/ShastaIcon"

const MCCLOUD_HEADWATER_SOURCE_ID = "mccloud-headwater-source"
const MCCLOUD_HEADWATER_SOURCE_LAYER = "McCloud_headwater.zip-hypvk0"
const MCCLOUD_SPRINGS_SOURCE_ID = "mccloud-springs-source"
const MCCLOUD_SPRINGS_SOURCE_LAYER = "McCloud_springs.zip-phame5"
const SPRING_RIPPLE_LAYER_IDS = [
  "mccloud-springs-ripple-1",
  "mccloud-springs-ripple-2",
] as const
const SHASTA_PEAK_COORDINATE: Coordinate = [-122.03, 41.56]

type Coordinate = [number, number]

export default function ShastaMcCloudLayer({ visible }: { visible: boolean }) {
  const { mapRef } = useMap()
  const shouldMount = useLazyMount(visible)
  const visibilityValue = visible ? "visible" : "none"

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map || !visible || !shouldMount) return

    let animationFrame = 0
    const animateRipples = (time: number) => {
      SPRING_RIPPLE_LAYER_IDS.forEach((layerId, index) => {
        if (!map.getLayer(layerId)) return

        const phase = (time / 4000 + index / SPRING_RIPPLE_LAYER_IDS.length) % 1
        map.setPaintProperty(layerId, "circle-radius", 5 + phase * 17)
        map.setPaintProperty(
          layerId,
          "circle-opacity",
          0.48 * Math.pow(1 - phase, 1.35),
        )
        map.setPaintProperty(
          layerId,
          "circle-stroke-opacity",
          0.9 * Math.pow(1 - phase, 1.25),
        )
      })

      animationFrame = requestAnimationFrame(animateRipples)
    }

    animationFrame = requestAnimationFrame(animateRipples)
    return () => cancelAnimationFrame(animationFrame)
  }, [mapRef, shouldMount, visible])

  if (!shouldMount) return null

  return (
    <>
      <>
        <Source
          id={MCCLOUD_HEADWATER_SOURCE_ID}
          type="vector"
          url="mapbox://coeqwal.4ymc2w"
        >
          <Layer
            id="mccloud-headwater-halo"
            beforeId={INDIGENOUS_RIVER_NETWORK_TROUGH_LAYER_ID}
            type="line"
            source-layer={MCCLOUD_HEADWATER_SOURCE_LAYER}
            paint={{
              "line-color": "#07142c",
              "line-width": 4,
              "line-opacity": 0.55,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
              visibility: visibilityValue,
            }}
          />
          <Layer
            id="mccloud-headwater-body"
            beforeId={INDIGENOUS_RIVER_NETWORK_TROUGH_LAYER_ID}
            type="line"
            source-layer={MCCLOUD_HEADWATER_SOURCE_LAYER}
            paint={{
              "line-color": FreshWaterColor,
              "line-width": 2.5,
              "line-opacity": 0.9,
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
              visibility: visibilityValue,
            }}
          />
        </Source>

        <Source
          id={MCCLOUD_SPRINGS_SOURCE_ID}
          type="vector"
          url="mapbox://coeqwal.zct2ss"
        >
          {SPRING_RIPPLE_LAYER_IDS.map((layerId) => (
            <Layer
              key={layerId}
              id={layerId}
              type="circle"
              source-layer={MCCLOUD_SPRINGS_SOURCE_LAYER}
              paint={{
                "circle-color": "rgba(0, 0, 0, 0)",
                "circle-radius": 7,
                "circle-opacity": 0.48,
                "circle-stroke-color": FreshWaterColor,
                "circle-stroke-opacity": 0.9,
                "circle-stroke-width": 2.25,
              }}
              layout={{ visibility: visibilityValue }}
            />
          ))}
          <Layer
            id="mccloud-springs-center"
            type="circle"
            source-layer={MCCLOUD_SPRINGS_SOURCE_LAYER}
            paint={{
              "circle-color": FreshWaterColor,
              "circle-radius": 6,
              "circle-opacity": 1,
              "circle-stroke-color": "#fcfbfa",
              "circle-stroke-width": 1.5,
            }}
            layout={{ visibility: visibilityValue }}
          />
        </Source>
      </>

      {visible ? (
        <>
          <Marker
            longitude={SHASTA_PEAK_COORDINATE[0]}
            latitude={SHASTA_PEAK_COORDINATE[1]}
          >
            <ShastaIcon
              style={{
                position: "absolute",
                width: 220,
                height: "auto",
                color: "#f2f0ef",
                transform: "translate(-50%, -50%)",
                filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45))",
              }}
            />
          </Marker>
        </>
      ) : null}
    </>
  )
}
