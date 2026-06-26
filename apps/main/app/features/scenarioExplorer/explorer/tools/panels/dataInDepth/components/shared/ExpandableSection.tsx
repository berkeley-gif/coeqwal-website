"use client"

/**
 * ExpandableSection - shared scaffolding for Data in depth category sections.
 *
 * Owns the parts every batch-backed section repeats: the sticky scenario
 * header row (with the expand control), the inline body wrapper, and the
 * expand-to-fullscreen MobileModal (title chip, sticky header, sizing).
 *
 * Each section supplies a `renderBody(isModal)` callback that returns the
 * section content. It is called once for the inline view and once for the
 * modal view so the two stay in sync.
 */

import React, { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { getOutcomeCategoryColor } from "../../config/outcomeDefinitions"
import { outcomeCategories } from "../../config/outcomeCategories"

interface ExpandableSectionProps {
  /** Resolved scenario ids to compare (columns). */
  scenarios: string[]
  /** Maps scenarioId to display name. */
  scenarioNames: Record<string, string>
  /** Outcome-category id, used for the modal title icon and color. */
  categoryId: string
  /** Human-readable section title shown in the modal header. */
  title: string
  /** ARIA label for the modal content region. */
  contentAriaLabel: string
  /**
   * Renders the section body. Receives `isModal` so the body can adjust
   * behavior (for example tooltip z-index) between the two views.
   */
  renderBody: (isModal: boolean) => React.ReactNode
}

export function ExpandableSection({
  scenarios,
  scenarioNames,
  categoryId,
  title,
  contentAriaLabel,
  renderBody,
}: ExpandableSectionProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const categoryColor = getOutcomeCategoryColor(theme, categoryId)
  const categoryIcon = outcomeCategories.find((c) => c.id === categoryId)?.icon

  return (
    <>
      {/* Sticky scenario header row. The soft drop shadow below mirrors the
          List view's pinned block, so it reads as a fixed header that content
          scrolls under. */}
      <Box
        sx={theme.scenarios.stickyScenarioHeader}
      >
        <ChartGridProvider scenarios={scenarios}>
          <GridScenarioHeader
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            onExpand={() => setIsExpanded(true)}
          />
        </ChartGridProvider>
      </Box>

      {/* Inline body */}
      <Box sx={{ mt: theme.space.component.md }}>{renderBody(false)}</Box>

      {/* Expanded modal view */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.space.gap.lg,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${categoryColor}15`,
                color: categoryColor,
                fontSize: 20,
              }}
            >
              {categoryIcon}
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.primary }}
            >
              {title}
            </Typography>
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel={contentAriaLabel}
        stickyHeader={
          <ChartGridProvider scenarios={scenarios}>
            <GridScenarioHeader
              scenarios={scenarios}
              scenarioNames={scenarioNames}
            />
          </ChartGridProvider>
        }
      >
        <Box sx={{ p: theme.space.component.lg }}>{renderBody(true)}</Box>
      </MobileModal>
    </>
  )
}

export default ExpandableSection
