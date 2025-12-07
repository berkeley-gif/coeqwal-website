"use client"

/**
 * StrategyRow and related components
 *
 * Components for displaying strategy information in the Learn section.
 * Data is pulled from the same sources as StrategyGrid.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoTooltip } from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { strategies } from "../../../lib/scenarios"
import { CURRENT_OPERATIONS_ICONS } from "../../ScenarioCard"
import { OUTCOMES } from "../../../lib/outcomes"
import { useScenarioTiers } from "../../../hooks/useTierData"

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

interface KeyOutcomesPanelProps {
  /** Scenario ID to display (defaults to "s0020" for current operations) */
  scenarioId?: string
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
            <InfoTooltip
              key={icon.path}
              description={
                <>
                  <Box
                    component="span"
                    sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                  >
                    {icon.label.replace(/\n/g, " ")}
                  </Box>
                  {icon.description}
                </>
              }
            >
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
          <InfoTooltip
            key={icon.path}
            description={
              <>
                <Box
                  component="span"
                  sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                >
                  {icon.label.replace(/\n/g, " ")}
                </Box>
                {icon.description}
              </>
            }
          >
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

/**
 * KeyOutcomesPanel - Shows the key outcomes glyphs
 * Uses the same layout as ScenarioCard
 */
export function KeyOutcomesPanel({
  scenarioId = "s0020",
}: KeyOutcomesPanelProps) {
  const theme = useTheme()

  // Fetch tier data for the scenario
  const { chartData, isLoading } = useScenarioTiers(scenarioId)

  // Helper function to get tier values for an outcome
  const getTierValues = (outcome: string): [number, number, number, number] => {
    const tierData = chartData[outcome]
    if (!tierData || tierData.length !== 4) {
      return [0, 0, 0, 0]
    }
    return [
      tierData[0]?.value ?? 0,
      tierData[1]?.value ?? 0,
      tierData[2]?.value ?? 0,
      tierData[3]?.value ?? 0,
    ]
  }

  // Helper function to detect if tier data represents a single value
  const isSingleValueTier = (outcome: string): boolean => {
    const tierData = chartData[outcome]
    if (!tierData || tierData.length === 0) return false
    return tierData[0]?.tierType === "single_value"
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
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[900],
        }}
      >
        Key outcomes
      </Typography>

      {/* Outcomes grid - 5 columns like ScenarioCard */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 1,
          alignItems: "start",
        }}
      >
        {OUTCOMES.map((outcome) => {
          const tierData = chartData[outcome]
          const hasData =
            tierData !== undefined &&
            tierData.length > 0 &&
            tierData.some((tier) => tier.value > 0)

          return (
            <InfoTooltip
              key={outcome}
              description={
                <>
                  <Box
                    component="span"
                    sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                  >
                    {outcome}
                  </Box>
                  Click to learn more about this outcome.
                </>
              }
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  p: 0.5,
                  borderRadius: theme.borderRadius.rounded,
                  transition: "all 0.2s ease",
                  opacity: isLoading ? 0.5 : hasData ? 1 : 0.7,
                  "&:hover": {
                    backgroundColor: theme.palette.grey[100],
                  },
                }}
              >
                <ScenarioGlyph
                  tierColors={
                    hasData
                      ? [
                          theme.palette.tiers.tier1,
                          theme.palette.tiers.tier2,
                          theme.palette.tiers.tier3,
                          theme.palette.tiers.tier4,
                        ]
                      : [
                          theme.palette.grey[300],
                          theme.palette.grey[300],
                          theme.palette.grey[300],
                          theme.palette.grey[300],
                        ]
                  }
                  values={getTierValues(outcome)}
                  variant={isSingleValueTier(outcome) ? "dots" : "bars"}
                  size={45}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: hasData
                      ? theme.palette.blue.darkest
                      : theme.palette.grey[500],
                    fontWeight: 500,
                    textAlign: "center",
                    fontSize: "0.65rem",
                    lineHeight: 1.2,
                    minHeight: "2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {outcome}
                </Typography>
              </Box>
            </InfoTooltip>
          )
        })}
      </Box>
    </Box>
  )
}

export default StrategyRow

