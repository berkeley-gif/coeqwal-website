"use client"

import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"
import type { MapCircleAnnotation } from "../config/locationPresets"

export default function MapCircleAnnotationLayer({
  annotations,
  progress,
}: {
  annotations: MapCircleAnnotation[]
  progress: number
}) {
  return (
    <>
      {annotations.map((annotation) =>
        progress >= annotation.revealAt ? (
        <Marker
          key={annotation.id}
          longitude={annotation.longitude}
          latitude={annotation.latitude}
        >
          <Box
            sx={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.75,
              pointerEvents: "none",
            }}
          >
            <motion.svg
              width="112"
              height="112"
              viewBox="0 0 112 112"
              aria-hidden="true"
              focusable="false"
              initial={{ opacity: 0, scale: 0.55, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.82, y: 8 }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                filter: "drop-shadow(0 12px 20px rgba(0, 0, 0, 0.32))",
              }}
            >
              <motion.circle
                cx="56"
                cy="56"
                r="42"
                fill={`${annotation.color}2E`}
                stroke={annotation.color}
                strokeWidth="4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut",
                }}
              />
              <motion.circle
                cx="56"
                cy="56"
                r="29"
                fill="#fcfbfa"
                opacity="0.14"
                stroke="#fcfbfa"
                strokeWidth="1.5"
                strokeDasharray="5 6"
                initial={{ rotate: -30 }}
                animate={{ rotate: 0 }}
                transition={{
                  duration: 0.9,
                  ease: "easeOut",
                }}
                style={{
                  transformOrigin: "56px 56px",
                }}
              />
              <motion.path
                d="M42 56h28M56 42v28"
                stroke="#fcfbfa"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.72"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                  delay: 0.18,
                }}
              />
            </motion.svg>
            <Typography
              component="span"
              sx={{
                color: "#fcfbfa",
                fontSize: "0.8rem",
                fontWeight: 700,
                lineHeight: 1,
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
