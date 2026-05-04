"use client"

/**
 * SvgThumbnail
 *
 * Renders a serialized SVG document as a vector thumbnail inside a
 * share card. The SVG markup is injected via dangerouslySetInnerHTML
 * so the chart stays vector at any zoom and scales smoothly to the
 * card width without rasterization. Inputs are produced by our own
 * off-screen capture host, so the markup is trusted.
 *
 * Use this in place of an `<img src={dataUrl} />` whenever the share
 * item carries a `cachedSvg` field.
 * */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"

export interface SvgThumbnailProps {
  /**
   * Serialized SVG document with a viewBox set. The component does
   * not modify the markup, the SVG keeps its native intrinsic ratio.
   */
  svg: string
  /** Accessible label for the thumbnail, surfaced as role img. */
  ariaLabel: string
  /** Aspect ratio of the thumbnail container. Default 1 (square). */
  aspectRatio?: number
}

export default function SvgThumbnail({
  svg,
  ariaLabel,
  aspectRatio = 1,
}: SvgThumbnailProps) {
  const theme = useTheme()
  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      sx={{
        width: "100%",
        aspectRatio: String(aspectRatio),
        backgroundColor: theme.palette.common.white,
        borderRadius: theme.borderRadius.sm,
        mt: 1,
        overflow: "hidden",
        "& > svg": {
          width: "100%",
          height: "100%",
          display: "block",
        },
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
