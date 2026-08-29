"use client"

/**
 * StrategyGridContent - Scenario rows container for StrategyGrid
 *
 * Maps scenarios to StrategyGridRow components and handles:
 * - Search result dividers between highlighted and non-highlighted rows
 * - Filtering based on showOnlyChosen state
 *
 * This component is rendered when renderMode is "contentOnly" or "all".
 *
 * @see StrategyGridRow for individual row rendering
 * @see layoutConfig.ts for spacing constant documentation
 */

import React, { useMemo } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { PanelFeedback } from "@repo/ui"
import type { ScenarioForDisplay } from "../../../../../../scenarios/components/shared"
import { useWorkspaceSlice } from "../../../../store"
import { StrategyGridRow } from "./StrategyGridRow"
import type { LayoutMode } from "./StrategyGridHeader"
import type { ScenarioTheme } from "../../../../../../../content/scenarios"
import ThemeGroupHeader from "../../../chrome/sidebar/ThemeGroupHeader"
import { HydroclimateGate } from "../../../../../../scenarios/components/HydroclimateGate"

export interface StrategyGridContentProps {
  scenarios: ScenarioForDisplay[]
  highlightedScenarios: Set<string>
  showSearchDivider: boolean
  themeMatchingScenarioIds?: Set<string>
  showThemeDivider?: boolean
  showAllThemeDividers?: boolean
  groupByTheme?: boolean
  scenariosInContiguousThemeOrder?: boolean
  iconMatchingScenarioIds?: Set<string>
  showIconDivider?: boolean
  selectedScenarios: string[]
  showOnlyChosen: boolean
  showAlternativeBaselines: boolean
  layoutMode: LayoutMode
  showOperations?: boolean
  onToggleScenario: (scenarioId: string) => void
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  onIconClick?: (iconId: string) => void
  scenarioColors?: Record<string, string>
  activeScenarioIds?: Set<string>
  onRowHover?: (scenarioIds: string[] | null) => void
}

/**
 * StrategyGridContent renders the list of scenario rows with support for
 * search highlighting, summary panels, and search result dividers.
 */
export function StrategyGridContent({
  scenarios,
  highlightedScenarios,
  showSearchDivider,
  themeMatchingScenarioIds,
  showThemeDivider = false,
  showAllThemeDividers = false,
  groupByTheme = false,
  scenariosInContiguousThemeOrder = true,
  iconMatchingScenarioIds,
  showIconDivider = false,
  selectedScenarios,
  showOnlyChosen,
  showAlternativeBaselines,
  layoutMode,
  showOperations = true,
  onToggleScenario,
  onThemeBadgeClick,
  onIconClick,
  scenarioColors,
  activeScenarioIds,
  onRowHover,
}: StrategyGridContentProps) {
  const theme = useTheme()

  const PRIMARY_BASELINE_ID = "s0020"

  const displayScenarios = (() => {
    if (showOnlyChosen) {
      return scenarios.filter((s) => selectedScenarios.includes(s.scenarioId))
    }
    if (!showAlternativeBaselines) {
      return scenarios.filter(
        (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
      )
    }
    return scenarios
  })()

  const hasThemedScenarios = useMemo(
    () => displayScenarios.some((s) => Boolean(s.theme)),
    [displayScenarios],
  )
  const themeSubheaderMode =
    groupByTheme && scenariosInContiguousThemeOrder && hasThemedScenarios
  const showThemeBadgeUnpinned = !themeSubheaderMode

  const themeScenarioIds = useMemo(() => {
    if (!themeSubheaderMode) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    for (const s of displayScenarios) {
      if (s.theme) {
        const ids = map.get(s.theme) ?? []
        ids.push(s.scenarioId)
        map.set(s.theme, ids)
      }
    }
    return map
  }, [themeSubheaderMode, displayScenarios])

  const renderScenarioRows = (
    list: ScenarioForDisplay[],
    opts: {
      themeIds: Map<string, string[]>
      isFirstGroup: boolean
      registerTourFirstListItem: boolean
    },
  ) =>
    list.flatMap((scenario, index, arr) => {
      const isHighlighted = highlightedScenarios.has(scenario.scenarioId)
      const nextScenario = arr[index + 1]
      const isNextHighlighted = nextScenario
        ? highlightedScenarios.has(nextScenario.scenarioId)
        : false

      const shouldShowDivider =
        showSearchDivider && isHighlighted && !isNextHighlighted

      const isThemeMatch =
        themeMatchingScenarioIds?.has(scenario.scenarioId) ?? false
      const isNextThemeMatch = nextScenario
        ? (themeMatchingScenarioIds?.has(nextScenario.scenarioId) ?? false)
        : false
      const shouldShowThemeDivider =
        showThemeDivider && isThemeMatch && !isNextThemeMatch

      const isIconMatch =
        iconMatchingScenarioIds?.has(scenario.scenarioId) ?? false
      const isNextIconMatch = nextScenario
        ? (iconMatchingScenarioIds?.has(nextScenario.scenarioId) ?? false)
        : false
      const shouldShowIconDivider =
        showIconDivider && isIconMatch && !isNextIconMatch

      const shouldShowThemeGroupDivider =
        !themeSubheaderMode &&
        showAllThemeDividers &&
        nextScenario !== undefined &&
        scenario.theme !== nextScenario.theme

      const rows: React.ReactNode[] = []

      if (themeSubheaderMode && scenario.theme) {
        const prevScenario = index > 0 ? arr[index - 1] : undefined
        const isNewGroup = index === 0 || scenario.theme !== prevScenario?.theme
        if (isNewGroup) {
          const ids = opts.themeIds.get(scenario.theme) ?? []
          if (ids.length > 0) {
            rows.push(
              <ThemeGroupHeader
                key={`theme-header-${scenario.scenarioId}`}
                themeKey={scenario.theme as ScenarioTheme}
                scenarioIds={ids}
                isFirst={opts.isFirstGroup && index === 0}
              />,
            )
          }
        }
      }

      rows.push(
        <HydroclimateGate
          key={scenario.scenarioId}
          scenarioId={scenario.scenarioId}
          variant="inline"
        >
          <StrategyGridRow
            scenario={scenario}
            isFirst={!themeSubheaderMode && opts.isFirstGroup && index === 0}
            tourListFirstItem={opts.registerTourFirstListItem && index === 0}
            isHighlighted={isHighlighted}
            isChosen={selectedScenarios.includes(scenario.scenarioId)}
            layoutMode={layoutMode}
            showOperations={showOperations}
            onToggleScenario={onToggleScenario}
            showThemeBadge={showThemeBadgeUnpinned}
            onThemeBadgeClick={onThemeBadgeClick}
            onIconClick={onIconClick}
            scenarioColor={scenarioColors?.[scenario.scenarioId]}
            isActive={activeScenarioIds?.has(scenario.scenarioId) ?? false}
            onRowHover={onRowHover}
          />
        </HydroclimateGate>,
      )

      if (shouldShowDivider) {
        rows.push(
          <Box
            key={`divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }
      if (shouldShowThemeDivider) {
        rows.push(
          <Box
            key={`theme-divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }
      if (shouldShowIconDivider) {
        rows.push(
          <Box
            key={`icon-divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }
      if (shouldShowThemeGroupDivider) {
        rows.push(
          <Box
            key={`theme-group-divider-${scenario.scenarioId}`}
            sx={{
              gridColumn: "1 / -1",
              my: theme.space.section.sm,
              height: "1px",
              backgroundColor: theme.palette.grey[300],
            }}
          />,
        )
      }

      return rows
    })

  if (displayScenarios.length === 0 && showOnlyChosen) {
    return (
      <PanelFeedback
        variant="empty"
        title="No scenarios chosen yet"
        message="Select scenarios using the checkboxes, then toggle &ldquo;chosen only&rdquo; to filter"
        sx={{ gridColumn: "1 / -1" }}
      />
    )
  }

  return (
    <>
      {renderScenarioRows(displayScenarios, {
        themeIds: themeScenarioIds,
        isFirstGroup: true,
        registerTourFirstListItem: displayScenarios.length > 0,
      })}
    </>
  )
}

export default StrategyGridContent
