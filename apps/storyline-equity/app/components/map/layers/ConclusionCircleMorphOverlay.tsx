"use client"

import { useEffect, useMemo, useState } from "react"
import { Box } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { useReducedMotion } from "@repo/motion"
import type { MapCircleAnnotation } from "../config/locationPresets"
import {
  CONCLUSION_HANDOFF_END_PROGRESS,
  CONCLUSION_HANDOFF_START_PROGRESS,
  CONCLUSION_MORPH_LANDED_PROGRESS,
  CONCLUSION_MORPH_START_PROGRESS,
} from "../../../store"

// Screen-space radius/stroke of a geo marker's circle, matching
// MapCircleAnnotationLayer's `<circle r="72.5" strokeWidth="7">` inside its
// 170x170 svg — this overlay replaces that marker outright (rather than
// drawing alongside it) so it has to start as a pixel-for-pixel replica.
const SOURCE_MARKER_RADIUS = 55
const SOURCE_MARKER_STROKE_WIDTH = 4
const DEFAULT_ICON_COLOR = "#f2f0ef"
const CIRCLE_OUTLINE_COLOR = "#f2f0ef"
const DEFAULT_ICON_RADIUS_SCALE = 1.1
const SALMON_ICON_RADIUS_SCALE = 0.86

function getIconRadiusScale(iconSrc: string) {
  return iconSrc === "/map-icons/salmon.svg"
    ? SALMON_ICON_RADIUS_SCALE
    : DEFAULT_ICON_RADIUS_SCALE
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t)
}

export default function ConclusionCircleMorphOverlay({
  visible,
  progress,
  annotations,
  iconColors,
  icons,
}: {
  visible: boolean
  progress: number
  annotations: MapCircleAnnotation[]
  iconColors: Partial<Record<string, string>>
  icons: Partial<Record<string, string>>
}) {
  const { mapRef } = useMap()
  const prefersReducedMotion = useReducedMotion()
  const [mapVersion, setMapVersion] = useState(0)

  useEffect(() => {
    // Skip subscribing while hidden, same rationale as MetroRiverMorphOverlay:
    // camera transitions fire "move" dozens of times per animation, and
    // re-projecting on every tick is wasted work outside this section.
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map) return

    const update = () => {
      setMapVersion((version) => version + 1)
    }
    update()
    map.on("move", update)
    map.on("zoom", update)
    map.on("resize", update)
    window.addEventListener("resize", update)

    return () => {
      map.off("move", update)
      map.off("zoom", update)
      map.off("resize", update)
      window.removeEventListener("resize", update)
    }
  }, [mapRef, visible])

  const morphT = prefersReducedMotion
    ? Math.round(
        clamp01(
          (progress - CONCLUSION_MORPH_START_PROGRESS) /
            (CONCLUSION_MORPH_LANDED_PROGRESS -
              CONCLUSION_MORPH_START_PROGRESS),
        ),
      )
    : easeInOut(
        clamp01(
          (progress - CONCLUSION_MORPH_START_PROGRESS) /
            (CONCLUSION_MORPH_LANDED_PROGRESS -
              CONCLUSION_MORPH_START_PROGRESS),
        ),
      )
  // Settled icons hold alone on screen briefly, then crossfade out as
  // FloatingBubbles crossfades in at the same positions.
  const overlayOpacity =
    1 -
    clamp01(
      (progress - CONCLUSION_HANDOFF_START_PROGRESS) /
        (CONCLUSION_HANDOFF_END_PROGRESS - CONCLUSION_HANDOFF_START_PROGRESS),
    )

  const seedCircles = useMemo(() => {
    void mapVersion
    const map = mapRef?.current
    if (!map || !visible) return []

    return annotations.flatMap((annotation) => {
      const iconSrc = icons[annotation.id] ?? annotation.iconSrc
      if (!iconSrc) return []

      const projected = map.project({
        lng: annotation.longitude,
        lat: annotation.latitude,
      })
      const sourceX = projected.x + (annotation.offset?.[0] ?? 0)
      const sourceY = projected.y + (annotation.offset?.[1] ?? 0)
      const viewportBottom = window.innerHeight
      const targetY = viewportBottom + SOURCE_MARKER_RADIUS * 3
      const targetR = SOURCE_MARKER_RADIUS * 0.55
      const fullyOutsideProgress = clamp01(
        (viewportBottom + SOURCE_MARKER_RADIUS - sourceY) / (targetY - sourceY),
      )
      const offscreenFadeProgress = clamp01(
        (morphT - fullyOutsideProgress) / (1 - fullyOutsideProgress),
      )

      return [
        {
          id: annotation.id,
          iconSrc,
          color: iconColors[annotation.id] ?? DEFAULT_ICON_COLOR,
          cx: sourceX,
          cy: sourceY + (targetY - sourceY) * morphT,
          r: SOURCE_MARKER_RADIUS + (targetR - SOURCE_MARKER_RADIUS) * morphT,
          opacity: 1 - offscreenFadeProgress,
        },
      ]
    })
  }, [annotations, icons, iconColors, mapRef, mapVersion, morphT, visible])

  if (!visible) return null

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 12,
        pointerEvents: "none",
        opacity: overlayOpacity,
      }}
    >
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        {seedCircles.map((circle) => (
          <g
            key={circle.id}
            opacity={circle.opacity}
            style={{ filter: "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.32))" }}
          >
            <circle
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="#172a48"
              fillOpacity={0.7}
              stroke={CIRCLE_OUTLINE_COLOR}
              strokeWidth={
                (circle.r / SOURCE_MARKER_RADIUS) * SOURCE_MARKER_STROKE_WIDTH
              }
            />
            <foreignObject
              x={circle.cx - circle.r * getIconRadiusScale(circle.iconSrc)}
              y={circle.cy - circle.r * getIconRadiusScale(circle.iconSrc)}
              width={circle.r * getIconRadiusScale(circle.iconSrc) * 2}
              height={circle.r * getIconRadiusScale(circle.iconSrc) * 2}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: circle.color,
                  mask: `url(${circle.iconSrc}) center / contain no-repeat`,
                  WebkitMask: `url(${circle.iconSrc}) center / contain no-repeat`,
                }}
              />
            </foreignObject>
          </g>
        ))}
      </svg>
    </Box>
  )
}
