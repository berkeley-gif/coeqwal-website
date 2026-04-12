"use client"

/**
 * OperationsIconGroup - Renders scenario operation icons with tooltips
 *
 * Data-driven component that reads from the icon registry in opsIcons.tsx.
 * Each scenario maps to an ordered list of icons (theme icon first, then operations).
 *
 * Used by StrategyGrid, ScenarioRow, and KeyOperationsPanel.
 */

import React, { useCallback } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HybridTooltip } from "@repo/ui"
import { useDrawerStore } from "@repo/state/drawer"
import type { ScenarioTheme } from "../../../../content/scenarios"
import { getIconSize } from "./strategyIcons"
import { getScenarioIconDefs, renderIconDef } from "./opsIcons"

const OPS_GLOSSARY_TERMS = [
  {
    pattern: /\bSGMA\b/g,
    glossaryTerm: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    pattern: /\bDelta Conveyance Project\b/g,
    glossaryTerm: "Delta Conveyance Project",
  },
]

function OpsDescriptionWithLinks({ text }: { text: string }) {
  const { setDrawerContent, openDrawer } = useDrawerStore()

  const handleClick = useCallback(
    (glossaryTerm: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      setDrawerContent({ selectedTerm: glossaryTerm })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  const combinedPattern = new RegExp(
    `(${OPS_GLOSSARY_TERMS.map((t) => t.pattern.source).join("|")})`,
    "g",
  )
  const parts = text.split(combinedPattern)

  return (
    <>
      {parts.map((part, i) => {
        const term = OPS_GLOSSARY_TERMS.find((t) =>
          new RegExp(t.pattern.source).test(part),
        )
        if (term) {
          return (
            <Box
              key={i}
              component="button"
              onClick={handleClick(term.glossaryTerm)}
              sx={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textDecoration: "underline",
                font: "inherit",
                color: "inherit",
              }}
            >
              {part}
            </Box>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export interface OperationsIconGroupProps {
  /** Scenario ID (e.g., "s0020", "s0025") */
  scenarioId: string
  /** Scenario theme (currently unused.icons are driven by scenario ID) */
  theme?: ScenarioTheme
  /** Icon size variant */
  size?: "sm" | "md" | "lg"
  /** Layout direction */
  layout?: "horizontal" | "vertical"
  /** Called when an icon is clicked.receives the icon ID for cross-scenario selection */
  onIconClick?: (iconId: string) => void
}

export function OperationsIconGroup({
  scenarioId,
  size = "md",
  layout = "vertical",
  onIconClick,
}: OperationsIconGroupProps) {
  const theme = useTheme()
  const iconSize = getIconSize(size)
  const fixedIconSize = theme.spacing(iconSize.lg)

  const iconDefs = getScenarioIconDefs(scenarioId)

  if (iconDefs.length === 0) return null

  const isHorizontal = layout === "horizontal"

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: isHorizontal
          ? `repeat(auto-fill, ${fixedIconSize})`
          : `repeat(3, ${fixedIconSize})`,
        gap: theme.space.gap.xs,
        justifyContent: "flex-start",
        ...(isHorizontal && { width: "100%" }),
      }}
    >
      {iconDefs.map((def) => (
        <HybridTooltip
          key={def.id}
          content={
            <>
              <Typography variant="tooltipHeader" sx={{ mb: 0.5 }}>
                {def.label}
              </Typography>
              <OpsDescriptionWithLinks text={def.description} />
            </>
          }
        >
          <Box
            tabIndex={0}
            role="button"
            aria-label={`${def.label} - focus or click for details`}
            onClick={
              onIconClick
                ? (e: React.MouseEvent) => {
                    e.stopPropagation()
                    onIconClick(def.id)
                  }
                : undefined
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
            {renderIconDef(def)}
          </Box>
        </HybridTooltip>
      ))}
    </Box>
  )
}

export default OperationsIconGroup
