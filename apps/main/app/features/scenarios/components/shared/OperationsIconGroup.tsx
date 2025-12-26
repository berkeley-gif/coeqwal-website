/**
 * OperationsIconGroup - Renders strategy operation icons with tooltips
 *
 * Shared component for rendering the key operations icons for a strategy.
 * Used by both Learn mode (KeyOperationsPanel) and Explore mode (StrategyGrid).
 *
 * Handles both baseline strategies (current ops, land use, TUCP) and
 * non-baseline theme strategies (SGMA, Environmental).
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import {
  getStrategyIcons,
  getThemeIcon,
  getThemeIconDescription,
  getIconSize,
} from "./strategyIcons"
import { CURRENT_OPERATIONS_ICONS } from "../../../../content/scenarios"

export interface OperationsIconGroupProps {
  /** Strategy value (e.g., "current-ops", "sgma-sj-valley") */
  strategyValue: string
  /** Strategy theme (e.g., "baseline", "groundwater", "environmental") */
  theme?: string
  /** Icon size variant */
  size?: "sm" | "md" | "lg"
  /** Layout direction */
  layout?: "horizontal" | "vertical"
}

export function OperationsIconGroup({
  strategyValue,
  theme: strategyTheme,
  size = "md",
  layout = "horizontal",
}: OperationsIconGroupProps) {
  const theme = useTheme()
  const iconSize = getIconSize(size)

  // Non-baseline themes use custom theme icons
  if (strategyTheme && strategyTheme !== "baseline") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.5, md: 1 },
          alignItems: "flex-start",
          flexDirection: layout === "horizontal" ? "row" : "column",
          justifyContent: "flex-start",
        }}
      >
        {/* Theme icon (Groundwater/Environmental) */}
        <HybridTooltip
          content={
            <>
              <Box
                component="span"
                sx={{
                  fontWeight: theme.typography.fontWeightSemiBold,
                  display: "block",
                  mb: 0.5,
                }}
              >
                {strategyTheme === "groundwater"
                  ? "SGMA Limits"
                  : "Environmental Flows"}
              </Box>
              {getThemeIconDescription(strategyTheme, strategyValue)}
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
            {getThemeIcon(strategyTheme)}
          </Box>
        </HybridTooltip>

        {/* Land use icon */}
        <HybridTooltip
          content={
            <>
              <Box
                component="span"
                sx={{
                  fontWeight: theme.typography.fontWeightSemiBold,
                  display: "block",
                  mb: 0.5,
                }}
              >
                2020 LandIQ land use
              </Box>
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
              <Box
                component="span"
                sx={{
                  fontWeight: theme.typography.fontWeightSemiBold,
                  display: "block",
                  mb: 0.5,
                }}
              >
                TUCPs Allowed
              </Box>
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

  // Baseline strategies use standard icons from getStrategyIcons
  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 0.5, md: 1 },
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
              <Box
                component="span"
                sx={{
                  fontWeight: theme.typography.fontWeightSemiBold,
                  display: "block",
                  mb: 0.5,
                }}
              >
                {icon.label.replace(/\n/g, " ")}
              </Box>
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

      {/* Additional icon for baseline strategies without TUCP */}
      {(strategyValue === "current-ops-wo-tucp" ||
        strategyValue === "usbr-2024-wo-tucp") && (
        <HybridTooltip
          content={
            <>
              <Box
                component="span"
                sx={{
                  fontWeight: theme.typography.fontWeightSemiBold,
                  display: "block",
                  mb: 0.5,
                }}
              >
                Without TUCPs
              </Box>
              This scenario does not include Temporary Urgent Change Petitions.
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
              src="/images/icons/no_tucp.svg"
              alt="Without TUCPs"
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
        </HybridTooltip>
      )}
    </Box>
  )
}

export default OperationsIconGroup




