"use client"

import { useEffect, useMemo, useState } from "react"
import { Box } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { useReducedMotion } from "@repo/motion"
import {
  getBubblesClusterRect,
  packedBubbles,
} from "../../helpers/FloatingBubbles"
import type { MapCircleAnnotation } from "../config/locationPresets"
import {
  CONCLUSION_HANDOFF_END_PROGRESS,
  CONCLUSION_HANDOFF_START_PROGRESS,
  CONCLUSION_MAP_FADE_END_PROGRESS,
  CONCLUSION_MORPH_LANDED_PROGRESS,
  CONCLUSION_MORPH_START_PROGRESS,
} from "../../../store"

// Screen-space radius/stroke of a geo marker's circle, matching
// MapCircleAnnotationLayer's `<circle r="72.5" strokeWidth="7">` inside its
// 170x170 svg — this overlay replaces that marker outright (rather than
// drawing alongside it) so it has to start as a pixel-for-pixel replica.
const SOURCE_MARKER_RADIUS = 72.5
const SOURCE_MARKER_STROKE_WIDTH = 7
const DEFAULT_ICON_COLOR = "#f2f0ef"

type PackedBubble = (typeof packedBubbles)[number]

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t)
}

// One "seed" bubble per icon type — the largest packed bubble of that type —
// is what each matching geo marker morphs toward. The rest of that type's
// bubbles are "bloom" siblings that emerge from the seed once it lands.
function groupPackedBubbles() {
  const seedByIconSrc = new Map<string, PackedBubble>()
  for (const bubble of packedBubbles) {
    const current = seedByIconSrc.get(bubble.iconSrc)
    if (!current || bubble.r > current.r)
      seedByIconSrc.set(bubble.iconSrc, bubble)
  }

  const bloomByIconSrc = new Map<string, PackedBubble[]>()
  for (const bubble of packedBubbles) {
    if (seedByIconSrc.get(bubble.iconSrc) === bubble) continue
    const siblings = bloomByIconSrc.get(bubble.iconSrc) ?? []
    siblings.push(bubble)
    bloomByIconSrc.set(bubble.iconSrc, siblings)
  }

  return { seedByIconSrc, bloomByIconSrc }
}

const { seedByIconSrc, bloomByIconSrc } = groupPackedBubbles()

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
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Skip subscribing while hidden, same rationale as MetroRiverMorphOverlay:
    // camera transitions fire "move" dozens of times per animation, and
    // re-projecting on every tick is wasted work outside this section.
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map) return

    const update = () => {
      setMapVersion((version) => version + 1)
      setViewport({ width: window.innerWidth, height: window.innerHeight })
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
  // Blooms while the map (rendered separately, outside this overlay) fades
  // away — see the CONCLUSION_* staging comment in store.ts.
  const bloomT = clamp01(
    (progress - CONCLUSION_MORPH_LANDED_PROGRESS) /
      (CONCLUSION_MAP_FADE_END_PROGRESS - CONCLUSION_MORPH_LANDED_PROGRESS),
  )
  // Settled icons hold alone on screen briefly, then crossfade out as
  // FloatingBubbles crossfades in at the same positions.
  const overlayOpacity =
    1 -
    clamp01(
      (progress - CONCLUSION_HANDOFF_START_PROGRESS) /
        (CONCLUSION_HANDOFF_END_PROGRESS - CONCLUSION_HANDOFF_START_PROGRESS),
    )

  const clusterRect = useMemo(
    () => getBubblesClusterRect(viewport.width, viewport.height),
    [viewport.width, viewport.height],
  )

  const seedCircles = useMemo(() => {
    void mapVersion
    const map = mapRef?.current
    if (!map || !visible) return []

    return annotations.flatMap((annotation) => {
      const iconSrc = icons[annotation.id] ?? annotation.iconSrc
      const seed = iconSrc ? seedByIconSrc.get(iconSrc) : undefined
      if (!iconSrc || !seed) return []

      const projected = map.project({
        lng: annotation.longitude,
        lat: annotation.latitude,
      })
      const sourceX = projected.x + (annotation.offset?.[0] ?? 0)
      const sourceY = projected.y + (annotation.offset?.[1] ?? 0)
      const targetX = clusterRect.x + (seed.cx / 100) * clusterRect.width
      const targetY = clusterRect.y + (seed.cy / 100) * clusterRect.height
      const targetR = (seed.r / 100) * clusterRect.width

      return [
        {
          id: annotation.id,
          iconSrc,
          color: iconColors[annotation.id] ?? DEFAULT_ICON_COLOR,
          cx: sourceX + (targetX - sourceX) * morphT,
          cy: sourceY + (targetY - sourceY) * morphT,
          r: SOURCE_MARKER_RADIUS + (targetR - SOURCE_MARKER_RADIUS) * morphT,
        },
      ]
    })
  }, [
    annotations,
    clusterRect,
    icons,
    iconColors,
    mapRef,
    mapVersion,
    morphT,
    visible,
  ])

  const bloomCircles = useMemo(() => {
    if (!visible) return []
    const rendered = new Set<string>()
    const items: {
      key: string
      cx: number
      cy: number
      r: number
      iconSrc: string
      color: string
      opacity: number
    }[] = []

    annotations.forEach((annotation) => {
      const iconSrc = icons[annotation.id] ?? annotation.iconSrc
      if (!iconSrc || rendered.has(iconSrc)) return
      rendered.add(iconSrc)

      const seed = seedByIconSrc.get(iconSrc)
      const siblings = bloomByIconSrc.get(iconSrc) ?? []
      if (!seed) return

      const seedX = clusterRect.x + (seed.cx / 100) * clusterRect.width
      const seedY = clusterRect.y + (seed.cy / 100) * clusterRect.height
      const color = iconColors[annotation.id] ?? DEFAULT_ICON_COLOR

      siblings.forEach((bubble, index) => {
        const targetX = clusterRect.x + (bubble.cx / 100) * clusterRect.width
        const targetY = clusterRect.y + (bubble.cy / 100) * clusterRect.height
        const targetR = (bubble.r / 100) * clusterRect.width
        const staggerStart = index * 0.06
        const localT = prefersReducedMotion
          ? Math.round(bloomT)
          : easeInOut(clamp01((bloomT - staggerStart) / (1 - staggerStart)))

        items.push({
          key: `${iconSrc}-${index}`,
          cx: seedX + (targetX - seedX) * localT,
          cy: seedY + (targetY - seedY) * localT,
          r: targetR * localT,
          iconSrc: bubble.iconSrc,
          color,
          opacity: localT,
        })
      })
    })

    return items
  }, [
    annotations,
    bloomT,
    clusterRect,
    icons,
    iconColors,
    prefersReducedMotion,
    visible,
  ])

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
            style={{ filter: "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.32))" }}
          >
            <circle
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="#172a48"
              fillOpacity={0.7}
              stroke={circle.color}
              strokeWidth={
                (circle.r / SOURCE_MARKER_RADIUS) * SOURCE_MARKER_STROKE_WIDTH
              }
            />
            <foreignObject
              x={circle.cx - circle.r * 0.86}
              y={circle.cy - circle.r * 0.86}
              width={circle.r * 1.72}
              height={circle.r * 1.72}
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
        {bloomCircles.map((circle) => (
          <g
            key={circle.key}
            opacity={circle.opacity}
            style={{ filter: "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.32))" }}
          >
            <circle
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill="#172a48"
              fillOpacity={0.7}
              stroke={circle.color}
              strokeWidth={
                (circle.r / SOURCE_MARKER_RADIUS) * SOURCE_MARKER_STROKE_WIDTH
              }
            />
            <foreignObject
              x={circle.cx - circle.r * 0.86}
              y={circle.cy - circle.r * 0.86}
              width={circle.r * 1.72}
              height={circle.r * 1.72}
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
