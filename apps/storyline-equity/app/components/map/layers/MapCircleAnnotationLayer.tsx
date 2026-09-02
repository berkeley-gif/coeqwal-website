"use client"

import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"
import type { MapCircleAnnotation } from "../config/locationPresets"

export default function MapCircleAnnotationLayer({
  annotations,
  progress,
  iconOverrides = {},
  iconColorOverrides = {},
  scaleOverrides = {},
  opacityOverrides = {},
  iconScaleOverrides = {},
  showStrokes = true,
  showLabels = true,
}: {
  annotations: MapCircleAnnotation[]
  progress: number
  iconOverrides?: Partial<Record<string, string>>
  iconColorOverrides?: Partial<Record<string, string>>
  scaleOverrides?: Partial<Record<string, number>>
  opacityOverrides?: Partial<Record<string, number>>
  iconScaleOverrides?: Partial<Record<string, number>>
  showStrokes?: boolean
  showLabels?: boolean
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
                  opacity: opacityOverrides[annotation.id] ?? 1,
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
                  <motion.circle
                    cx="85"
                    cy="85"
                    r="72.5"
                    fill="#172a48"
                    fillOpacity={0.7}
                    stroke={annotation.color}
                    strokeWidth="7"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{
                      duration: 0.8,
                      ease: "easeInOut",
                    }}
                  />
                ) : null}
                {(iconOverrides[annotation.id] ?? annotation.iconSrc) &&
                iconColorOverrides[annotation.id] ? (
                  <foreignObject
                    x="7"
                    y="9"
                    width="156"
                    height="156"
                    transform={`translate(85 85) scale(${iconScaleOverrides[annotation.id] ?? 1}) translate(-85 -85)`}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.2,
                        duration: 0.45,
                        ease: "easeOut",
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: iconColorOverrides[annotation.id],
                        maskImage: `url(${iconOverrides[annotation.id] ?? annotation.iconSrc})`,
                        WebkitMaskImage: `url(${iconOverrides[annotation.id] ?? annotation.iconSrc})`,
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        transformOrigin: "center",
                      }}
                    />
                  </foreignObject>
                ) : (iconOverrides[annotation.id] ?? annotation.iconSrc) ? (
                  <motion.image
                    href={iconOverrides[annotation.id] ?? annotation.iconSrc}
                    x={
                      (
                        iconOverrides[annotation.id] ?? annotation.iconSrc
                      )?.endsWith("/salmon.svg")
                        ? "22.5"
                        : "3"
                    }
                    y={
                      (
                        iconOverrides[annotation.id] ?? annotation.iconSrc
                      )?.endsWith("/salmon.svg")
                        ? "22.5"
                        : "3"
                    }
                    width={
                      (
                        iconOverrides[annotation.id] ?? annotation.iconSrc
                      )?.endsWith("/salmon.svg")
                        ? "125"
                        : "164"
                    }
                    height={
                      (
                        iconOverrides[annotation.id] ?? annotation.iconSrc
                      )?.endsWith("/salmon.svg")
                        ? "125"
                        : "164"
                    }
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
              {showLabels ? (
                <Typography
                  component="span"
                  sx={{
                    display: annotation.name ? "block" : "none",
                    opacity: opacityOverrides[annotation.id] ?? 1,
                    transition: "opacity 0.35s ease",
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
              ) : null}
            </Box>
          </Marker>
        ) : null,
      )}
    </>
  )
}
