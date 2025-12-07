"use client"

/**
 * StrategyRow and related components
 *
 * Components for displaying strategy information in the Learn section.
 * Data is pulled from the same sources as StrategyGrid.
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

interface StrategyInfoPanelProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
}

interface KeyOperationsPanelProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
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
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      {/* Strategy label */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          mb: showDescription ? 0.5 : 0,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
        }}
      >
        {strategy.label} strategy
      </Typography>

      {/* Description - matches StrategyGrid layout (before icons) */}
      {showDescription && (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            lineHeight: 1.4,
            fontSize: theme.typography.nav.fontSize,
            color: theme.palette.grey[700],
          }}
        >
          {strategy.description}
        </Typography>
      )}

      {/* Divider and Key operations section */}
      <Box
        sx={{
          borderTop: `1px solid ${theme.palette.grey[300]}`,
          pt: 2,
          mt: showDescription ? 0 : 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            fontSize: theme.typography.body2.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.grey[900],
          }}
        >
          Key operations
        </Typography>

        {/* Operations icons - matches StrategyGrid spacing */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, md: 1 },
            alignItems: "flex-start",
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
        {icons.map((icon) => (
          <InfoTooltip key={icon.path} description={icon.description}>
            <Box
              sx={{
                width: { xs: theme.spacing(4), lg: theme.spacing(5) },
                height: { xs: theme.spacing(4), lg: theme.spacing(5) },
                cursor: "pointer",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.path}
                alt={icon.alt}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
          </InfoTooltip>
        ))}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * StrategyInfoPanel - Shows just the title and description
 */
export function StrategyInfoPanel({
  strategyValue = "current-ops",
}: StrategyInfoPanelProps) {
  const theme = useTheme()

  const strategy = strategies.find((s) => s.value === strategyValue)
  
  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          mb: 0.5,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
        }}
      >
        {strategy.label} strategy
      </Typography>

      <Typography
        variant="body2"
        sx={{
          lineHeight: 1.4,
          fontSize: theme.typography.nav.fontSize,
          color: theme.palette.grey[700],
        }}
      >
        {strategy.description}
      </Typography>
    </Box>
  )
}

/**
 * KeyOperationsPanel - Shows just the key operations icons
 */
export function KeyOperationsPanel({
  strategyValue = "current-ops",
}: KeyOperationsPanelProps) {
  const theme = useTheme()

  const strategy = strategies.find((s) => s.value === strategyValue)
  
  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[900],
        }}
      >
        Key operations
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.5, md: 1 },
          alignItems: "flex-start",
          flexDirection: "row",
          justifyContent: "flex-start",
        }}
      >
        {icons.map((icon) => (
          <InfoTooltip key={icon.path} description={icon.description}>
            <Box
              sx={{
                width: { xs: theme.spacing(4), lg: theme.spacing(5) },
                height: { xs: theme.spacing(4), lg: theme.spacing(5) },
                cursor: "pointer",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.path}
                alt={icon.alt}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
          </InfoTooltip>
        ))}
      </Box>
    </Box>
  )
}

export default StrategyRow

