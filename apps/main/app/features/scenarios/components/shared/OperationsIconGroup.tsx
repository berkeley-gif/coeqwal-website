"use client"

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
  // Use the lg size consistently - icons should never shrink at smaller viewports
  const iconSize = getIconSize(size)
  const fixedIconSize = theme.spacing(iconSize.lg)

  // Non-baseline themes use custom theme icons
  if (scenarioTheme && scenarioTheme !== "baseline") {
    return (
      <Box
        sx={{
          display: "flex",
          gap: theme.space.gap.sm,
          alignItems: "flex-start",
          flexDirection: layout === "horizontal" ? "row" : "column",
          justifyContent: "center",
        }}
      >
        {/* Theme icon (Groundwater/Environmental) */}
        <HybridTooltip
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                {scenarioTheme === "groundwater"
                  ? "SGMA limits"
                  : "Environmental flows"}
              </Typography>
              {getThemeIconDescription(scenarioTheme, scenarioId)}
            </>
          }
        >
          <Box
            tabIndex={0}
            role="button"
            aria-label={
              scenarioTheme === "groundwater"
                ? "SGMA limits - focus or click for details"
                : "Environmental flows - focus or click for details"
            }
            sx={{
              width: fixedIconSize,
              height: fixedIconSize,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.borderRadius.circle,
              "&:focus-visible": {
                outline: `2px solid ${theme.palette.blue.bright}`,
                outlineOffset: "2px",
              },
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
            tabIndex={0}
            role="button"
            aria-label="2020 LandIQ land use - focus or click for details"
            sx={{
              width: fixedIconSize,
              height: fixedIconSize,
              cursor: "pointer",
              borderRadius: theme.borderRadius.circle,
              "&:focus-visible": {
                outline: `2px solid ${theme.palette.blue.bright}`,
                outlineOffset: "2px",
              },
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
                TUCPs allowed
              </Typography>
              Temporary Urgent Change Petitions (TUCPs) permit changes during
              droughts to meet human health and safety needs and protect
              endangered species.
            </>
          }
        >
          <Box
            tabIndex={0}
            role="button"
            aria-label="TUCPs allowed - focus or click for details"
            sx={{
              width: fixedIconSize,
              height: fixedIconSize,
              cursor: "pointer",
              borderRadius: theme.borderRadius.circle,
              "&:focus-visible": {
                outline: `2px solid ${theme.palette.blue.bright}`,
                outlineOffset: "2px",
              },
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
        gap: theme.space.gap.sm,
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
            tabIndex={0}
            role="button"
            aria-label={`${icon.label.replace(/\n/g, " ")} - focus or click for details`}
            sx={{
              width: fixedIconSize,
              height: fixedIconSize,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.borderRadius.circle,
              "&:focus-visible": {
                outline: `2px solid ${theme.palette.blue.bright}`,
                outlineOffset: "2px",
              },
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
