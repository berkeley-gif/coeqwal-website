"use client"

import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"
import rough from "roughjs"
import type { MapCircleAnnotation } from "../config/locationPresets"

const roughCircleGenerator = rough.generator()
const roughCirclePathCache = new Map<string, string>()

function getRoughCirclePath(id: string) {
  const cachedPath = roughCirclePathCache.get(id)
  if (cachedPath) return cachedPath

  const seed =
    [...id].reduce(
      (hash, character) => (hash * 31 + character.charCodeAt(0)) % 2147483647,
      17,
    ) || 1
  const path =
    roughCircleGenerator.toPaths(
      roughCircleGenerator.circle(85, 85, 145, {
        roughness: 2,
        strokeWidth: 2,
        seed,
      }),
    )[0]?.d ?? ""

  roughCirclePathCache.set(id, path)
  return path
}

export default function MapCircleAnnotationLayer({
  annotations,
  progress,
  iconOverrides = {},
  scaleOverrides = {},
  showStrokes = true,
}: {
  annotations: MapCircleAnnotation[]
  progress: number
  iconOverrides?: Partial<Record<string, string>>
  scaleOverrides?: Partial<Record<string, number>>
  showStrokes?: boolean
}) {
  return (
    <>
      {annotations.map((annotation) =>
        progress >= annotation.revealAt ? (
          <Marker
            key={annotation.id}
            longitude={annotation.longitude}
            latitude={annotation.latitude}
            offset={annotation.offset}
            style={{ zIndex: 20 }}
          >
            <Box
              sx={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                pointerEvents: "none",
              }}
            >
              <motion.svg
                width="170"
                height="170"
                viewBox="0 0 170 170"
                aria-hidden="true"
                focusable="false"
                initial={{ opacity: 0, scale: 0.55, y: 18 }}
                animate={{
                  opacity: 1,
                  scale: scaleOverrides[annotation.id] ?? 1,
                  y: 0,
                }}
                exit={{ opacity: 0, scale: 0.82, y: 12 }}
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  filter: "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.32))",
                }}
              >
                {showStrokes ? (
                  <motion.path
                    d={getRoughCirclePath(annotation.id)}
                    fill="none"
                    stroke={annotation.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                    }}
                  />
                ) : null}
                {(iconOverrides[annotation.id] ?? annotation.iconSrc) ? (
                  <motion.image
                    href={iconOverrides[annotation.id] ?? annotation.iconSrc}
                    x="22.5"
                    y="22.5"
                    width="125"
                    height="125"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.45,
                      ease: "easeOut",
                    }}
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "center",
                    }}
                  />
                ) : null}
              </motion.svg>
              <Typography
                component="span"
                sx={{
                  color: "#fcfbfa",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  lineHeight: 1,
                  order: annotation.labelPosition === "above" ? -1 : 0,
                  marginTop:
                    annotation.labelPosition === "above" ? 0 : "-0.65rem",
                  marginBottom:
                    annotation.labelPosition === "above" ? "-1rem" : 0,
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.8)",
                }}
              >
                {annotation.name}
              </Typography>
            </Box>
          </Marker>
        ) : null,
      )}
    </>
  )
}
