"use client"

/**
 * StrategyRow
 *
 * A strategy row component for the Learn section that displays
 * strategy data from the same sources as StrategyGrid.
 * 
 * Accepts a strategyValue prop to specify which strategy to show.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoTooltip } from "@repo/ui"
import { strategies } from "../../../lib/scenarios"
import { CURRENT_OPERATIONS_ICONS } from "../../ScenarioCard"

interface StrategyRowProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
  /** Whether to show the description */
  showDescription?: boolean
}

/**
 * Get the operation icons for a given strategy
 * Uses the same logic as StrategyGrid for consistency
 */
function getStrategyIcons(strategyValue: string) {
  const icons = []

  // Icon 1: Current operations (always shown)
  icons.push({
    path: CURRENT_OPERATIONS_ICONS[0]?.path || "/images/icons/current_ops.svg",
    alt: CURRENT_OPERATIONS_ICONS[0]?.alt || "Current operations",
    description: CURRENT_OPERATIONS_ICONS[0]?.description || "Current operations",
    label: "Current operations",
  })

  // Icon 2: Land use (different for historical-ag strategy)
  if (strategyValue === "current-ops-historical-ag") {
    icons.push({
      path: "/images/icons/land_use_prev.svg",
      alt: "Historical land use",
      description: "Historical land use (2004-2013)",
      label: "Historical land use\n(2004-2013)",
    })
  } else {
    icons.push({
      path: CURRENT_OPERATIONS_ICONS[1]?.path || "/images/icons/land_use.svg",
      alt: CURRENT_OPERATIONS_ICONS[1]?.alt || "Current land use",
      description: CURRENT_OPERATIONS_ICONS[1]?.description || "Current land use considerations",
      label: "Updated agricultural\nland use (2020)",
    })
  }

  // Icon 3: TUCP status
  if (strategyValue === "current-ops-wo-tucp") {
    icons.push({
      path: "/images/icons/no_tucp.svg",
      alt: "Without TUCPs",
      description: "Operations without Temporary Urgent Change Petitions (TUCPs)",
      label: "TUCPs\nnot allowed",
    })
  } else {
    icons.push({
      path: CURRENT_OPERATIONS_ICONS[2]?.path || "/images/icons/tucp.svg",
      alt: CURRENT_OPERATIONS_ICONS[2]?.alt || "TUCP considerations",
      description: CURRENT_OPERATIONS_ICONS[2]?.description || "Temporary Urgent Change Petitions permitted",
      label: "TUCPs\nallowed",
    })
  }

  return icons
}

export function StrategyRow({
  strategyValue = "current-ops",
  showDescription = true,
}: StrategyRowProps) {
  const theme = useTheme()

  // Look up strategy data from shared source
  const strategy = strategies.find((s) => s.value === strategyValue)
  
  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  // Get icons based on strategy
  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: theme.borderRadius.card,
        padding: theme.spacing(2.5),
        boxShadow: theme.shadows[2],
        maxWidth: "500px",
        pointerEvents: "auto",
      }}
    >
      {/* Strategy label */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          mb: 2,
          color: theme.palette.grey[900],
        }}
      >
        {strategy.label}
      </Typography>

      {/* Operations icons */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, md: 3 },
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        {icons.map((icon) => (
          <InfoTooltip key={icon.path} description={icon.description}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                cursor: "help",
              }}
            >
              <Box
                sx={{
                  width: theme.spacing(5),
                  height: theme.spacing(5),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon.path}
                  alt={icon.alt}
                  style={{ width: "100%", height: "100%" }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  textAlign: "center",
                  color: theme.palette.grey[700],
                  fontSize: "0.7rem",
                  lineHeight: 1.2,
                  maxWidth: theme.spacing(10),
                  whiteSpace: "pre-line",
                }}
              >
                {icon.label}
              </Typography>
            </Box>
          </InfoTooltip>
        ))}
      </Box>

      {/* Description */}
      {showDescription && (
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            color: theme.palette.grey[700],
            lineHeight: 1.5,
          }}
        >
          {strategy.description}
        </Typography>
      )}
    </Box>
  )
}

export default StrategyRow

