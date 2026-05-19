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

interface CompactRowContentProps {
  scenario: ScenarioForDisplay
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (displayName: string, name: string) => React.ReactNode
  showThemeBadge?: boolean
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  onIconClick?: (iconId: string) => void
}

export function CompactRowContent({
  scenario,
  outcomeNames,
  renderOutcomeItem,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
}: CompactRowContentProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: theme.space.gap.md,
        pl: 0.5,
      }}
    >
      {/* First row: Title/description + Key operations */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          gap: theme.space.gap.lg,
        }}
      >
        <StrategyHeader
          strategy={scenario}
          titleVariant="body2"
          showThemeBadge={showThemeBadge}
          onThemeBadgeClick={onThemeBadgeClick}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.md,
            flexShrink: 0,
          }}
        >
          <Typography
            variant="dashboard"
            sx={{ fontWeight: 500, color: theme.palette.grey[600] }}
          >
            Key operations
          </Typography>
          <OperationsIconGroup
            scenarioId={scenario.scenarioId}
            theme={scenario.theme}
            size="md"
            onIconClick={onIconClick}
          />
        </Box>
      </Box>

      {/* Key outcomes section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.md,
        }}
      >
        <Typography
          variant="dashboard"
          sx={{ fontWeight: 500, color: theme.palette.grey[600] }}
        >
          Key outcomes
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: theme.space.gap.lg,
          }}
        >
          {/* First 5 outcomes */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              "@container strategy-grid (min-width: 600px)": {
                gridTemplateColumns: "repeat(5, 1fr)",
              },
              gap: theme.space.gap.sm,
            }}
          >
            {outcomeNames
              .slice(0, 5)
              .map(({ shortCode, displayName }) =>
                renderOutcomeItem(shortCode, displayName),
              )}
          </Box>
          {/* Remaining outcomes */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              "@container strategy-grid (min-width: 600px)": {
                gridTemplateColumns: "repeat(5, 1fr)",
              },
              gap: theme.space.gap.sm,
            }}
          >
            {outcomeNames
              .slice(5)
              .map(({ shortCode, displayName }) =>
                renderOutcomeItem(shortCode, displayName),
              )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

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
  outcomeNames,
  renderOutcomeItem,
  showThemeBadge = true,
  onThemeBadgeClick,
  onIconClick,
  isDistributionView = false,
  scenarioChartData = {},
  isPinned = false,
  accentColor,
  handleShare,
  togglePinnedScenario,
  outcomeColRef,
  pinRowTourRef,
  shareRowTourRef,
  operationsRowTourRef,
}: NonCompactRowContentProps & {
  isPinned?: boolean
  accentColor?: string
  handleShare?: () => void
  togglePinnedScenario?: (id: string) => void
  outcomeColRef?: React.RefObject<HTMLDivElement | null>
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
            {strategyHeaderBlock(false)}
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

      {/* Column 4: Outcome glyphs - wraps below in wrapped mode */}
      <Box
        ref={outcomeColRef}
        className="outcome-col"
        sx={{
          gridColumn:
            layoutMode === "compact" ? "2" : isWrappedMode ? "2 / -1" : "4",
          borderLeft:
            layoutMode === "full"
              ? `1px solid ${theme.palette.grey[300]}`
              : "none",
          pl: layoutMode === "full" ? theme.scenarios.grid.divider.gap : 0,
          pt:
            layoutMode === "full"
              ? theme.scenarios.grid.glyphOffset
              : layoutMode === "wrapped"
                ? theme.space.gap.md
                : theme.space.gap.lg,
          pb: layoutMode === "compact" ? 0 : theme.scenarios.grid.row.padding,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: theme.space.gap.md,
        }}
      >
        {/* Key outcomes label - compact mode only (wrapped uses header row) */}
        {layoutMode === "compact" && (
          <Typography
            variant="dashboard"
            sx={{
              color: theme.palette.grey[600],
              fontWeight: 500,
            }}
          >
            Key outcomes
          </Typography>
        )}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              layoutMode === "compact"
                ? "repeat(3, 1fr)"
                : "repeat(auto-fit, minmax(60px, 1fr))",
            gap: theme.space.gap.sm,
            alignItems: isDistributionView ? "flex-start" : undefined,
            mt: 0,
            maxWidth: "100%",
            width: "100%",
          }}
        >
          {outcomeNames.map(({ shortCode, displayName }) =>
            renderOutcomeItem(shortCode, displayName),
          )}
        </Box>
        {isDistributionView && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                layoutMode === "compact"
                  ? "repeat(3, 1fr)"
                  : "repeat(auto-fit, minmax(60px, 1fr))",
              gap: theme.space.gap.sm,
              maxWidth: "100%",
              width: "100%",
            }}
          >
            {outcomeNames.map(({ shortCode }) => {
              const totalLocations =
                scenarioChartData[shortCode]?.[0]?.totalLocations
              const description = describeOutcomeLocations(
                shortCode,
                totalLocations,
              )
              if (!description) return <Box key={`loc-${shortCode}`} />
              return (
                <Typography
                  key={`loc-${shortCode}`}
                  variant="outcomeLabel"
                  sx={{
                    color: theme.palette.grey[500],
                    fontSize: "0.65rem",
                    textAlign: "center",
                    lineHeight: 1.3,
                    px: 0.25,
                  }}
                >
                  {description}
                </Typography>
              )
            })}
          </Box>
        )}
      </Box>
    </>
  )
}

/**
 * Outcomes-only row content - just the outcome glyphs, no title/ops/checkbox.
 * Uses the same CSS grid as OutcomeCategoryLabels in the header so columns align.
 *
 * In distribution view, a second grid row of location descriptions is appended
 * so all descriptions align horizontally across outcomes.
 */
export function OutcomesOnlyRowContent({
  outcomeNames,
  renderOutcomeItem,
  isDistributionView = false,
  scenarioChartData = {},
}: {
  outcomeNames: OutcomeName[]
  renderOutcomeItem: (shortCode: string, displayName: string) => React.ReactNode
  isDistributionView?: boolean
  scenarioChartData?: Record<string, ChartDataPoint[]>
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: `repeat(${outcomeNames.length}, 1fr)`,
        columnGap: theme.space.gap.sm,
        rowGap: isDistributionView ? "2px" : theme.space.gap.sm,
        pt: theme.scenarios.grid.glyphOffset,
        pb: theme.scenarios.grid.row.padding,
        pl: theme.scenarios.grid.divider.gap,
        borderLeft: "none",
        "@container strategy-grid (min-width: 600px)": {
          borderLeft: `1px solid ${theme.palette.grey[300]}`,
        },
        alignItems: isDistributionView ? "start" : "end",
      }}
    >
      {outcomeNames.map(({ shortCode, displayName }) =>
        renderOutcomeItem(shortCode, displayName),
      )}
      {isDistributionView &&
        outcomeNames.map(({ shortCode }) => {
          const totalLocations =
            scenarioChartData[shortCode]?.[0]?.totalLocations
          const description = describeOutcomeLocations(
            shortCode,
            totalLocations,
          )
          if (!description) return <Box key={`loc-${shortCode}`} />
          return (
            <Typography
              key={`loc-${shortCode}`}
              variant="outcomeLabel"
              sx={{
                color: theme.palette.grey[500],
                fontSize: "0.65rem",
                textAlign: "center",
                lineHeight: 1.3,
                px: 0.25,
              }}
            >
              {description}
            </Typography>
          )
        })}
    </Box>
  )
}
