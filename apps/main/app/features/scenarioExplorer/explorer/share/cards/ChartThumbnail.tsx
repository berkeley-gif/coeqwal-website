"use client"

/**
 * Encapsulates the cached-thumbnail priority chain shared by every
 * share card:
 *
 *   1. `cachedSvg` -> render via `SvgThumbnail`. Vector, scales
 *      smoothly, persisted from the off-screen capture.
 *   2. `cachedImageDataUrl` -> render the rasterized PNG. Used for
 *      legacy URL-restored items where the SVG was not embedded.
 *   3. `liveChart` -> mount the panel-rendered chart as a fallback,
 *      when the parent has decided to pay the live render cost.
 *   4. Optional placeholder copy for variants that always reserve
 *      space (radar card uses this. Snapshot card omits it).
 *
 * Variants tweak the surface styling so individual cards stay
 * visually distinct:
 *   - `bordered`: framed container with a divider border. Used by
 *     the snapshot card (Distribution / Resilience tile).
 *   - `whiteSurface`: white background, no border. Used by the
 *     radar card to match its existing look.
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import SvgThumbnail from "./SvgThumbnail"

export type ChartThumbnailVariant = "bordered" | "whiteSurface"

export interface ChartThumbnailProps {
  /** Vector cache. Highest-priority source. */
  cachedSvg?: string
  /** Raster cache. Used when no vector cache is available. */
  cachedImageDataUrl?: string
  /**
   * Live chart fallback. Rendered when no cache is available. Parent
   * is responsible for deciding whether to mount this (live charts
   * pay a hook + render cost).
   */
  liveChart?: React.ReactNode
  /** Accessible label for the thumbnail surface. */
  ariaLabel: string
  /** Surface treatment. Default `bordered`. */
  variant?: ChartThumbnailVariant
  /** Aspect ratio for the SVG thumbnail container. Default 1. */
  aspectRatio?: number
  /**
   * Copy shown when none of the cache layers nor a live chart are
   * available. Pass `null` (or omit) to render nothing in that case.
   */
  placeholderLabel?: string | null
}

export default function ChartThumbnail({
  cachedSvg,
  cachedImageDataUrl,
  liveChart,
  ariaLabel,
  variant = "bordered",
  aspectRatio = 1,
  placeholderLabel = null,
}: ChartThumbnailProps) {
  const theme = useTheme()

  if (cachedSvg) {
    return (
      <SvgThumbnail
        svg={cachedSvg}
        ariaLabel={ariaLabel}
        aspectRatio={aspectRatio}
      />
    )
  }

  if (cachedImageDataUrl) {
    if (variant === "whiteSurface") {
      return (
        <Box
          component="img"
          src={cachedImageDataUrl}
          alt={ariaLabel}
          sx={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.palette.common.white,
            mt: 1,
          }}
        />
      )
    }
    return (
      <Box
        sx={{
          mt: 1,
          borderRadius: 1,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src={cachedImageDataUrl}
          alt={ariaLabel}
          sx={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      </Box>
    )
  }

  if (liveChart) return <>{liveChart}</>

  if (!placeholderLabel) return null

  return (
    <Box
      sx={{
        mt: 1,
        minHeight: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.palette.grey[400],
        fontSize: "0.75rem",
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: theme.borderRadius.sm,
      }}
    >
      {placeholderLabel}
    </Box>
  )
}
