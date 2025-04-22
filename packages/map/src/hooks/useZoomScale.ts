// packages/map/src/hooks/useZoomScale.ts
"use client"

export function useZoomScale(baseSize: number): number {
  // 🛑 Temporarily disable zoom-based scaling
  return baseSize
}

// import { useMap } from "../context/MapContext"

// export function useZoomScale(baseSize: number): number {
//   const { mapRef } = useMap()
//   const zoom = mapRef.current?.getMap()?.getZoom() ?? 8

//   const min = 4
//   const max = 12
//   const minScale = 0.8
//   const maxScale = 1.2

//   const clamped = Math.max(min, Math.min(zoom, max))
//   const ratio = (clamped - min) / (max - min)
//   const scale = minScale + ratio * (maxScale - minScale)

//   return Math.round(baseSize * scale)
// }
