"use client"

/**
 * CapturedSizeFrame
 *
 * Renders its children at fixed `captureWidth x captureHeight` and
 * uniformly CSS-scales the whole frame so it fills its parent's
 * width while preserving the capture aspect ratio. The result is
 * indistinguishable from how a captured SVG thumbnail scales: every
 * font size, line width, tick label, and pad value shrinks together.
 *
 * Why live fallbacks need this:
 *
 * Captured SVG thumbnails (`SvgThumbnail`) inject a serialized SVG
 * with `width: 100%; height: 100%`; the browser uses the SVG's
 * `viewBox` to scale the entire pre-rendered chart proportionally.
 *
 * A live re-render of the same chart (RadarPlot, TierGrid, ...) at
 * the small card width re-runs layout at that smaller size: font
 * sizes stay at their absolute px values, axis labels reflow,
 * spacing changes. Wrapping the live mount in this frame forces the
 * chart to render at the same dimensions as the capture, then CSS
 * `transform: scale(...)` produces the same visual scaling as the
 * captured SVG.
 *
 * Used by every `Share<Variant>LiveChart` that backs a thumbnail
 * slot in `ShareSnapshotCard` / `ShareRadarCard`. New live charts
 * should opt into this rather than rendering responsively at card
 * width, otherwise the URL-restored view drifts from the capture.
 */

import React, { useLayoutEffect, useRef, useState } from "react"
import { Box, type SxProps, type Theme } from "@repo/ui/mui"

export interface CapturedSizeFrameProps {
  /** Pixel width the children are rendered at. */
  captureWidth: number
  /** Pixel height the children are rendered at. */
  captureHeight: number
  /** Optional sx applied to the outer aspect-ratio frame. */
  sx?: SxProps<Theme>
  children: React.ReactNode
}

export default function CapturedSizeFrame({
  captureWidth,
  captureHeight,
  sx,
  children,
}: CapturedSizeFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState<number>(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setScale(w / captureWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [captureWidth])

  return (
    <Box
      ref={containerRef}
      sx={[
        {
          width: "100%",
          position: "relative",
          aspectRatio: `${captureWidth} / ${captureHeight}`,
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {scale > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${captureWidth}px`,
            height: `${captureHeight}px`,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}
