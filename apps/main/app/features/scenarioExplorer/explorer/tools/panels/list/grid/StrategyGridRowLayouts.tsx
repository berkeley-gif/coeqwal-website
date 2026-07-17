"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  OperationsIconGroup,
  StrategyHeader,
  type ChartDataPoint,
  type OutcomeName,
  type ScenarioForDisplay,
} from "../../../../../../scenarios/components/shared"
import { useWorkspaceSlice } from "../../../../store"
import { describeOutcomeLocations } from "../../../../../../../content/outcomes"
import type { ScenarioTheme } from "../../../../../../../content/scenarios"
import type { LayoutMode } from "./StrategyGridHeader"
import { InlineRowActions } from "./InlineRowActions"

/**
 * Non-compact mode content - grid-based layout with vertical dividers
 *
 * In "full" mode (≥ fullBreakpoint): 4 columns inline
 * In "wrapped" mode (600px - fullBreakpoint): 3 columns with outcomes wrapping below
 */
interface NonCompactRowContentProps {
  scenario: ScenarioForDisplay
  layoutMode: LayoutMode
  showOperations?: boolean
  showDescription?: boolean
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (displayName: string, name: string) => React.ReactNode
  showThemeBadge?: boolean
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  onIconClick?: (iconId: string) => void
  isDistributionView?: boolean
  scenarioChartData?: Record<string, ChartDataPoint[]>
}

export function NonCompactRowContent({
  scenario,
  layoutMode,
  showOperations = true,
  showDescription = true,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
  isPinned = false,
  accentColor,
  handleShare,
  togglePinnedScenario,
  pinRowTourRef,
  shareRowTourRef,
  operationsRowTourRef,
}: NonCompactRowContentProps & {
  isPinned?: boolean
  accentColor?: string
  handleShare?: () => void
  togglePinnedScenario?: (id: string) => void
  pinRowTourRef?: React.RefCallback<HTMLElement | null>
  shareRowTourRef?: React.RefCallback<HTMLElement | null>
  operationsRowTourRef?: React.RefCallback<HTMLElement | null>
}) {
  const theme = useTheme()
  const isListMode = useWorkspaceSlice((s) => s.exploreMode === "list")
  const outcomeDisplayMode = useWorkspaceSlice((s) => s.outcomeDisplayMode)

  const isWrappedMode = layoutMode === "wrapped"
  const isCompactMode = layoutMode === "compact"
  const isFullMode = layoutMode === "full"

  const inlineActionsNode =
    isListMode && handleShare && togglePinnedScenario && accentColor ? (
      <Box sx={{ display: "inline-flex", alignItems: "center" }}>
        <InlineRowActions
          scenarioId={scenario.scenarioId}
          scenarioLabel={scenario.label}
          displayMode={outcomeDisplayMode}
          isPinned={isPinned}
          accentColor={accentColor}
          onShare={handleShare}
          togglePinnedScenario={togglePinnedScenario}
          pinTourRef={pinRowTourRef}
          shareTourRef={shareRowTourRef}
        />
      </Box>
    ) : undefined

  const strategyHeaderBlock = (disableTrunc: boolean) => (
    <StrategyHeader
      strategy={scenario}
      titleVariant="body2"
      compact={isListMode}
      showDescription={showDescription}
      disableTruncation={disableTrunc}
      descriptionMaxWidth="none"
      showThemeBadge={showThemeBadge}
      onThemeBadgeClick={onThemeBadgeClick}
      inlineActions={inlineActionsNode}
    />
  )

  return (
    <>
      {/* Columns 2+3: In wrapped/compact mode, merge into a single flex row;
          in full mode, keep as separate subgrid cells */}
      {isFullMode ? (
        <>
          {/* Column 2: Scenario name and description */}
          <Box
            sx={{
              gridColumn: "2",
              minWidth: 0,
              pr: theme.scenarios.grid.divider.gap,
              pt: theme.scenarios.grid.row.padding,
              pb: theme.scenarios.grid.row.padding,
              alignSelf: "start",
            }}
          >
            {strategyHeaderBlock(true)}
          </Box>

          {/* Column 3: Key operations */}
          <Box
            ref={operationsRowTourRef}
            sx={{
              gridColumn: "3",
              borderLeft: `1px solid ${theme.palette.grey[300]}`,
              pl: 1,
              display: "flex",
              flexDirection: "column",
              gap: theme.space.gap.md,
              justifyContent: "flex-start",
              alignItems: "flex-start",
              pt: theme.scenarios.grid.row.padding,
              pb: theme.scenarios.grid.row.padding,
              overflow: "hidden",
              opacity: showOperations ? 1 : 0,
              pointerEvents: showOperations ? "auto" : "none",
              transition: "opacity 200ms ease",
            }}
          >
            <OperationsIconGroup
              scenarioId={scenario.scenarioId}
              theme={scenario.theme}
              size="md"
              onIconClick={onIconClick}
            />
          </Box>
        </>
      ) : (
        <Box
          sx={{
            gridColumn: "2 / -1",
            display: "flex",
            alignItems: "stretch",
            gap: theme.space.gap.xl,
            pt: theme.scenarios.grid.row.padding,
            minWidth: 0,
          }}
        >
          <Box sx={{ flex: "none", width: "50%", minWidth: 0 }}>
            {strategyHeaderBlock(true)}
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: showOperations ? 1 : 0,
              pointerEvents: showOperations ? "auto" : "none",
              transition: "opacity 200ms ease",
            }}
          >
            {isCompactMode && (
              <Typography
                variant="dashboard"
                sx={{
                  color: theme.palette.grey[600],
                  fontWeight: 500,
                  mb: theme.space.gap.md,
                }}
              >
                Key operations
              </Typography>
            )}
            <OperationsIconGroup
              scenarioId={scenario.scenarioId}
              theme={scenario.theme}
              size="md"
              layout="horizontal"
              onIconClick={onIconClick}
            />
          </Box>
        </Box>
      )}
    </>
  )
}
