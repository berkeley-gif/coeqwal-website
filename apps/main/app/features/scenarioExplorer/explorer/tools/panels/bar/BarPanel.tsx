"use client"

/**
 * BarPanel - full-width bar-chart comparison of selected scenarios
 *
 * One shared outcome header (label + info + sort, same as List view's
 * column headers) sits above every card, sticky at the top. Cards stack
 * vertically below it, grouped by theme, each showing only its bar
 * glyphs (no per-card header). All of this - header and every card's
 * chart row - lives inside a single scroll container, so scrolling
 * right/left moves the header and every card's columns together in
 * lockstep, the same way List view's sticky header stays column-aligned
 * with its rows.
 */

import React, { Fragment, useCallback, useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton, ToggleSortButton } from "@repo/ui"
import { useWorkspaceSlice, useListSlice } from "../../../store"
import { useOutcomeMapAction } from "../../../../../map/hooks"
import { InlineTourAnchor } from "../../tour/anchors/InlineTourAnchor"
import { useTourAnchor } from "../../tour/anchors/TourAnchorContext"
import {
  StrategyHeader,
  OutcomeGlyphItem,
  formatOutcomeLabel,
} from "../../../../../scenarios/components/shared"
import { useResolvedScenarioTiers } from "../../hooks/useResolvedScenarioTiers"
import { useOrderedScenarios } from "../../hooks/useOrderedScenarios"
import { useTierTooltipState } from "../../../../../tooltips/useTierTooltipState"
import { TierTooltipPortal } from "../../../../../tooltips/TierTooltipPortal"
import { THEME_LABEL_CONFIG } from "../../../../../../content/themes"
import type { ScenarioTheme } from "../../../../../../content/scenarios"
import { captureBarChartRow } from "../list/grid/captureBarChartRow"
import { InlineRowActions } from "../list/grid/InlineRowActions"
import { stageShareItem } from "../../../share/stage"

/** Fixed column width so header cells and every card's glyph cells line up. */
const OUTCOME_COLUMN_WIDTH = 90

/** Glyph size forwarded to the off-screen share capture. List derives this from container width; Bar's columns are fixed-width, so one constant is enough. */
const SHARE_GLYPH_SIZE = 60

function ThemeGroupLabel({ themeKey }: { themeKey: ScenarioTheme }) {
  const theme = useTheme()
  const config = THEME_LABEL_CONFIG[themeKey]
  const colors = theme.palette.waterThemes[themeKey]
  if (!config || !colors) return null

  return (
    <Box
      component="span"
      sx={{
        alignSelf: "flex-start",
        display: "inline-block",
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: colors.text,
        backgroundColor: colors.background,
        px: "6px",
        py: "2px",
        borderRadius: "2px",
      }}
    >
      {config.label}
    </Box>
  )
}

interface BarOutcomeHeaderCellProps {
  shortCode: string
  displayName: string
  isSorted: boolean
  sortDirection: "asc" | "desc"
  activeTooltip: string | null
  onTooltipToggle: (name: string, anchor: HTMLElement) => void
  onSortChange: (outcomeCode: string | null, direction: "asc" | "desc") => void
  isFirstColumn: boolean
}

function BarOutcomeHeaderCell({
  shortCode,
  displayName,
  isSorted,
  sortDirection,
  activeTooltip,
  onTooltipToggle,
  onSortChange,
  isFirstColumn
}: BarOutcomeHeaderCellProps) {
  const theme = useTheme()

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <Typography
        component="div"
        sx={{
          fontFamily: theme.fontFamily.display,
          fontSize: "0.8125rem",
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "0.01em",
          color: theme.palette.text.primary,
          textAlign: "center",
        }}
      >
        {formatOutcomeLabel(displayName)}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        {isFirstColumn ? (
          <InlineTourAnchor anchorId="bar.outcome.infoButton">
            <InfoIconButton
              isActive={activeTooltip === shortCode}
              onClick={(e) => onTooltipToggle(shortCode, e.currentTarget)}
              title="Click for outcome details"
            />
          </InlineTourAnchor>
        ) : (
          <InfoIconButton
            isActive={activeTooltip === shortCode}
            onClick={(e) => onTooltipToggle(shortCode, e.currentTarget)}
            title="Click for outcome details"
          />
        )}
        {isFirstColumn ? (
          <InlineTourAnchor anchorId="bar.outcome.sortButton">
            <ToggleSortButton
              sortState={isSorted ? sortDirection : null}
              onToggle={(newState) =>
                onSortChange(newState === null ? null : shortCode, newState ?? "asc")
              }
              title="Sort by this outcome"
            />
          </InlineTourAnchor>
        ) : (
          <ToggleSortButton
            sortState={isSorted ? sortDirection : null}
            onToggle={(newState) =>
              onSortChange(newState === null ? null : shortCode, newState ?? "asc")
            }
            title="Sort by this outcome"
          />
        )}
      </Box>
    </Box>
  )
}

export default function BarPanel() {
  const theme = useTheme()
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)
  const {
    sortBy,
    sortDirection,
    setSortBy,
    setSortDirection,
    pinnedScenarioIds,
    togglePinnedScenario,
  } = useListSlice()
  const outcomeDisplayMode = useWorkspaceSlice((s) => s.outcomeDisplayMode)
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)
  const addShareItem = useWorkspaceSlice((s) => s.addShareItem)

  const { showOutcomeOnMap, isMapVisible } = useOutcomeMapAction()

  const { allChartData, outcomeNames, allScoreData, isLoading, error } =
    useResolvedScenarioTiers()
  const { orderedScenarios } = useOrderedScenarios(allScoreData)

  const barGlyphTourRef = useTourAnchor("bar.outcome.glyph")

  const {
    openTooltip: activeTooltip,
    anchor: tooltipAnchor,
    handleToggleWithAnchor,
    handleClose: closeTooltip,
    forceClose: forceCloseTooltip,
  } = useTierTooltipState()

  const handleSortChange = (
    outcome: string | null,
    direction: "asc" | "desc",
  ) => {
    setSortBy(outcome)
    setSortDirection(direction)
  }

  const handleShare = useCallback(
    (scenario: (typeof cardScenarios)[number]) => () =>
      stageShareItem({
        capture: () =>
          captureBarChartRow({
            outcomeNames,
            chartData: allChartData[scenario.scenarioId] ?? {},
            viewMode: outcomeDisplayMode,
            theme,
            glyphSize: SHARE_GLYPH_SIZE,
          }),
        buildItem: (captured) => ({
          id: crypto.randomUUID(),
          type: "barChart",
          scenarioId: scenario.scenarioId,
          viewMode: outcomeDisplayMode,
          hydroclimate,
          cachedChartData: (allChartData[scenario.scenarioId] ?? {}) as Record<
            string,
            unknown
          >,
          cachedSvg: captured?.svg,
          cachedImageDataUrl: captured?.dataUrl,
        }),
        addItem: addShareItem,
        errorLabel: "BarPanel.handleShare",
      }),
    [
      outcomeNames,
      allChartData,
      outcomeDisplayMode,
      theme,
      hydroclimate,
      addShareItem,
    ],
  )

  const selectedSet = useMemo(
    () => new Set(selectedScenarios),
    [selectedScenarios],
  )
  const pinnedSet = useMemo(
    () => new Set(pinnedScenarioIds),
    [pinnedScenarioIds],
  )
  const cardScenarios = useMemo(() => {
    const selected = orderedScenarios.filter((s) =>
      selectedSet.has(s.scenarioId),
    )
    const pinned = selected.filter((s) => pinnedSet.has(s.scenarioId))
    const unpinned = selected.filter((s) => !pinnedSet.has(s.scenarioId))
    return [...pinned, ...unpinned]
  }, [orderedScenarios, selectedSet, pinnedSet])

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography variant="body2">Loading scenarios...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: theme.spacing(3) }}>
        <Typography variant="body2" color="error">
          Error loading data: {error}
        </Typography>
      </Box>
    )
  }

  if (cardScenarios.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: theme.space.component.xl,
        }}
      >
        <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
          Select scenarios in the sidebar to compare their bar charts here.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        px: theme.space.tool.px,
        pb: theme.space.component.md,
        backgroundColor: theme.palette.grey[100],
      }}
    >
      <TierTooltipPortal
        outcomeCode={activeTooltip}
        anchorEl={tooltipAnchor}
        onClose={closeTooltip}
        onForceClose={forceCloseTooltip}
      />

      {/* Inner content: min-width 100% so cards/header fill the panel
          when there's little data, width max-content so the whole block
          (header + every card) grows past the panel and scrolls together
          once there are more outcomes than fit. */}
      <Box
        sx={{
          minWidth: "100%",
          width: "max-content",
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.md,
        }}
      >
        {/* Shared column header - sticky at the top of the scroll area */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            backgroundColor: theme.palette.grey[100],
            display: "flex",
            gap: theme.space.gap.sm,
            pl: theme.space.component.md,
            pt: theme.space.component.md,
            pb: theme.space.gap.sm,
          }}
        >
          {outcomeNames.map(({ shortCode, displayName }, index) => (
            <Box
              key={shortCode}
              sx={{ width: OUTCOME_COLUMN_WIDTH, flexShrink: 0 }}
            >
              <BarOutcomeHeaderCell
                shortCode={shortCode}
                displayName={displayName}
                isSorted={sortBy === shortCode}
                sortDirection={sortDirection}
                activeTooltip={activeTooltip}
                onTooltipToggle={handleToggleWithAnchor}
                onSortChange={handleSortChange}
                isFirstColumn={index === 0}
              />
            </Box>
          ))}
        </Box>

        {cardScenarios.map((scenario, index) => {
          const chartData = allChartData[scenario.scenarioId] ?? {}
          const previousTheme =
            index > 0 ? (cardScenarios[index - 1]?.theme ?? null) : null
          const showGroupLabel = scenario.theme !== previousTheme

          return (
            <Fragment key={scenario.scenarioId}>
              {showGroupLabel && scenario.theme && (
                <ThemeGroupLabel themeKey={scenario.theme as ScenarioTheme} />
              )}
              <Box
                sx={{
                  backgroundColor: theme.palette.common.white,
                  border: `1px solid ${theme.palette.grey[300]}`,
                  borderRadius: theme.borderRadius.sm,
                  p: theme.space.component.md,
                }}
              >
                <StrategyHeader
                  strategy={scenario}
                  titleVariant="body2"
                  showThemeBadge={false}
                  descriptionMaxWidth="80ch"
                  disableTruncation
                  inlineActions={
                    <InlineRowActions
                      scenarioId={scenario.scenarioId}
                      scenarioLabel={scenario.label}
                      displayMode={outcomeDisplayMode}
                      isPinned={pinnedScenarioIds.includes(scenario.scenarioId)}
                      accentColor={theme.palette.blue.bright}
                      onShare={handleShare(scenario)}
                      togglePinnedScenario={togglePinnedScenario}
                    />
                  }
                />
                <Box
                  sx={{
                    mt: theme.space.gap.md,
                    display: "flex",
                    gap: theme.space.gap.sm,
                  }}
                >
                  {outcomeNames.map(({ shortCode, displayName }, outcomeIndex) => (
                    <Box
                      key={shortCode}
                      ref={
                        index === 0 && outcomeIndex === 0
                          ? barGlyphTourRef
                          : undefined
                      }
                      sx={{
                        width: OUTCOME_COLUMN_WIDTH,
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <OutcomeGlyphItem
                        displayName={displayName}
                        name={shortCode}
                        outcomeCode={shortCode}
                        chartData={chartData[shortCode]}
                        isActive={!!chartData[shortCode]}
                        showLabel={true}
                        showInfoButton={false}
                        onGlyphClick={
                          isMapVisible
                            ? () =>
                              showOutcomeOnMap(shortCode, scenario.scenarioId)
                            : undefined
                        }
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Fragment>
          )
        })}
      </Box>
    </Box>
  )
}
