/**
 * OperationsIconGroup - Renders scenario operation icons with tooltips
 *
 * Shared component for rendering the key operations icons for a scenario.
 * Used by both Learn mode (KeyOperationsPanel) and Explore mode (StrategyGrid).
 *
 * Handles both baseline scenarios (current ops, land use, TUCP) and
 * non-baseline theme scenarios (SGMA, Environmental).
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import type { ScenarioTheme } from "../../../../content/scenarios"
import {
  getScenarioIcons,
  getThemeIcon,
  getThemeIconDescription,
  getIconSize,
} from "./strategyIcons"

export interface OperationsIconGroupProps {
  /** Scenario ID (e.g., "s0020", "s0025") */
  scenarioId: string
  /** Scenario theme (e.g., "baseline", "groundwater", "environmental") */
  theme?: ScenarioTheme
  /** Icon size variant */
  size?: "sm" | "md" | "lg"
  /** Layout direction */
  layout?: "horizontal" | "vertical"
}

export function OperationsIconGroup({
  scenarioId,
  theme: scenarioTheme,
  size = "md",
  layout = "horizontal",
}: OperationsIconGroupProps) {
  const theme = useTheme()
  const iconSize = getIconSize(size)

  // Non-baseline themes use custom theme icons
  if (scenarioTheme && scenarioTheme !== "baseline") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: { xs: theme.spacingTokens.gap.xs, md: theme.spacingTokens.gap.sm },
          alignItems: "flex-start",
          flexDirection: layout === "horizontal" ? "row" : "column",
          justifyContent: "flex-start",
        }}
      >
        {/* Theme icon (Groundwater/Environmental) */}
        <HybridTooltip
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                {scenarioTheme === "groundwater"
                  ? "SGMA Limits"
                  : "Environmental Flows"}
              </Typography>
              {getThemeIconDescription(scenarioTheme, scenarioId)}
            </>
          }
        >
          <Box
            sx={{
              width: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              height: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getThemeIcon(scenarioTheme)}
          </Box>
        </HybridTooltip>

        {/* Land use icon */}
        <HybridTooltip
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                2020 LandIQ land use
              </Typography>
              Current agricultural land use data from 2020 LandIQ survey.
            </>
          }
        >
          <Box
            sx={{
              width: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              height: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              cursor: "pointer",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/icons/land_use.svg"
              alt="2020 Land use"
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
        </HybridTooltip>

        {/* TUCP icon (most non-baseline themes include TUCPs) */}
        <HybridTooltip
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                TUCPs Allowed
              </Typography>
              Temporary Urgent Change Petitions (TUCPs) permit changes during
              droughts to meet human health and safety needs and protect
              endangered species.
            </>
          }
        >
          <Box
            sx={{
              width: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              height: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              cursor: "pointer",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/icons/tucp.svg"
              alt="TUCPs allowed"
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
        </HybridTooltip>
      </Box>
    )
  }

  // Baseline scenarios use standard icons from getScenarioIcons
  const icons = getScenarioIcons(scenarioId)

  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: theme.spacingTokens.gap.xs, md: theme.spacingTokens.gap.sm },
        alignItems: "flex-start",
        flexDirection: layout === "horizontal" ? "row" : "column",
        justifyContent: "flex-start",
      }}
    >
      {icons.map((icon) => (
        <HybridTooltip
          key={icon.path}
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                {icon.label.replace(/\n/g, " ")}
              </Typography>
              {icon.description}
            </>
          }
        >
          <Box
            sx={{
              width: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              height: { xs: theme.spacing(iconSize.xs), lg: theme.spacing(iconSize.lg) },
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon.path}
              alt={icon.alt}
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          </Box>
        </HybridTooltip>
      ))}
    </Box>
  )
}

export default OperationsIconGroup
