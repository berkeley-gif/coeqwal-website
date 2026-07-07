"use client"

import { useRef, useState } from "react"
import { Box, Typography } from "../../mui-components"
import type { SxProps, Theme } from "../../mui-components"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { Text } from "./Text"
import type { RichText } from "./types"

export type ImageCaptionPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

export interface ImageCaptionProps {
  lines: readonly RichText[]
  placement?: ImageCaptionPlacement
  offset?: string | number
  hideOnScroll?: boolean
  hiddenTop?: string | number
  visibleTop?: string | number
  panelSx?: SxProps<Theme>
  sx?: SxProps<Theme>
  id?: string
  className?: string
  role?: string
  "aria-label"?: string
}

const MotionBox = motion.create(Box)

function resolveOffset(value: string | number | undefined) {
  if (value === undefined) return undefined
  return typeof value === "number" ? `${value}px` : value
}

function placementSx(
  placement: ImageCaptionPlacement,
  offset: string | number,
): SxProps<Theme> {
  const resolvedOffset = resolveOffset(offset)

  switch (placement) {
    case "top-right":
      return { top: resolvedOffset, right: resolvedOffset }
    case "bottom-left":
      return { bottom: resolvedOffset, left: resolvedOffset }
    case "bottom-right":
      return { bottom: resolvedOffset, right: resolvedOffset }
    case "top-left":
    default:
      return { top: resolvedOffset, left: resolvedOffset }
  }
}

export function ImageCaption({
  lines,
  placement = "top-left",
  offset = 30,
  hideOnScroll = false,
  hiddenTop = 45,
  visibleTop = 74.5,
  panelSx,
  sx,
  id,
  className,
  role,
  "aria-label": ariaLabel,
}: ImageCaptionProps) {
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)
  const [isHidden, setIsHidden] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (!hideOnScroll) return

    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  return (
    <MotionBox
      animate={hideOnScroll ? (isHidden ? "hidden" : "visible") : undefined}
      variants={
        hideOnScroll
          ? {
              hidden: { top: resolveOffset(hiddenTop) },
              visible: { top: resolveOffset(visibleTop) },
            }
          : undefined
      }
      transition={hideOnScroll ? { duration: 0.3 } : undefined}
      id={id}
      className={className}
      role={role}
      aria-label={ariaLabel}
      sx={[
        {
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          zIndex: 3,
          pointerEvents: "none",
          p: "10px",
          color: "common.white",
          backgroundColor: "overlay.waterDark",
          textAlign: "left",
        },
        placementSx(placement, offset),
        ...(Array.isArray(panelSx) ? panelSx : [panelSx]),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box>
        {lines.map((line, index) => (
          <Typography key={index} component="p" variant="caption" sx={{ m: 0 }}>
            <Text value={line} />
          </Typography>
        ))}
      </Box>
    </MotionBox>
  )
}
