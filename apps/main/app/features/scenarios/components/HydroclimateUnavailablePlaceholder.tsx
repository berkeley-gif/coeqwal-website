"use client"

/**
 * Rendered by tier tools when a sibling group has no scenario variant for
 * the active hydroclimate
 *
 * Three variants for the shapes the tier tools need:
 * - `dot`, for tight matrix cells (resilience matrix)
 * - `inline`, for list rows and chart axis labels (list view, comparison)
 * - `block`, for empty panels (radar, equity, key outcomes)
 *
 * Pass `groupId` when known so the tooltip can name the specific scenario
 * (e.g. "s0020 has not been run with the High climate risk hydroclimate").
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import {
  hydroclimateOptions,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../content/scenarios"
import { HYDROCLIMATE_CONFIG } from "../hydroclimateConfig"

export type HydroclimateUnavailableVariant = "dot" | "inline" | "block"

export interface HydroclimateUnavailablePlaceholderProps {
  /** Hydroclimate value with no variant for this scenario (e.g. `"cc50"`) */
  hydroclimate: string
  /** Sibling-group id, used to name the scenario in the tooltip */
  groupId?: string
  /** Display size and shape, defaults to `inline` */
  variant?: HydroclimateUnavailableVariant
}

export function HydroclimateUnavailablePlaceholder({
  hydroclimate,
  groupId,
  variant = "inline",
}: HydroclimateUnavailablePlaceholderProps) {
  const theme = useTheme()
  const option = hydroclimateOptions.find((o) => o.value === hydroclimate)
  const config = HYDROCLIMATE_CONFIG[hydroclimate]
  if (!option || !config) return null

  const longLabel = option.label
  const shortLabel = HYDROCLIMATE_SHORT_LABELS[hydroclimate] ?? longLabel
  const Icon = config.icon
  const accent = config.bgColor

  const subject = groupId ?? "This scenario"
  const tooltip = `${subject} has not been run with the ${longLabel} hydroclimate`

  if (variant === "dot") {
    return (
      <HybridTooltip content={tooltip}>
        <Box
          aria-label={tooltip}
          role="img"
          sx={{
            width: 16,
            height: 16,
            borderRadius: theme.borderRadius.circle,
            border: `1.5px dashed ${theme.palette.grey[400]}`,
            backgroundColor: "transparent",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      </HybridTooltip>
    )
  }

  if (variant === "inline") {
    return (
      <HybridTooltip content={tooltip}>
        <Box
          aria-label={tooltip}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.75,
            py: 0.25,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.palette.grey[100],
            border: `1px dashed ${theme.palette.grey[300]}`,
            color: theme.palette.grey[700],
            flexShrink: 0,
            maxWidth: "100%",
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: theme.borderRadius.circle,
              backgroundColor: accent,
              opacity: 0.5,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            No {shortLabel} data
          </Typography>
        </Box>
      </HybridTooltip>
    )
  }

  return (
    <Box
      role="status"
      aria-label={tooltip}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1,
        py: 3,
        px: 2,
        minHeight: 120,
        borderRadius: theme.borderRadius.md,
        border: `1px dashed ${theme.palette.grey[300]}`,
        backgroundColor: theme.palette.grey[50],
        color: theme.palette.grey[700],
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: theme.borderRadius.circle,
          backgroundColor: `${accent}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          sx={{
            fontSize: 18,
            color: accent,
            opacity: 0.8,
          }}
        />
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Data not available
      </Typography>
      <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
        {subject} has not been run with the {longLabel} hydroclimate.
      </Typography>
    </Box>
  )
}

export default HydroclimateUnavailablePlaceholder
