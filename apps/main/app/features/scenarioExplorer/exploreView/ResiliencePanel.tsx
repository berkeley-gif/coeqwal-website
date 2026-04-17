"use client"

/**
 * ResiliencePanel — resilience heatmap.
 *
 * Hydroclimates run along the X axis; rows are either outcomes (scenario
 * view) or scenarios (outcome view). Cells are colored by rounded tier
 * (1-4) and display the continuous arithmetic-mean value inside.
 *
 * Controls live in the toolbar (rendered by ScenarioExplorer.tsx). This
 * panel owns no toolbar UI itself. It only reads the control state
 * and hover/click callbacks via props.
 *
 * Data comes from useResilienceMatrix(), which composes three
 * useMultipleScenarioTiers calls (one per hydroclimate, all pre-cached
 * by usePrefetchTiers) and merges in precomputed NOD/SOD means for the
 * historical hydroclimate.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  startTransition,
} from "react"
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import {
  ResilienceHeatmap,
  type ResilienceAxisItem,
  type ResilienceHeatmapCell,
  type ResilienceHeatmapPalette,
} from "@repo/viz"
import { useScenarioExplorerStore } from "../store"
import {
  useResilienceMatrix,
  type ResilienceHydroclimate,
} from "../hooks/useResilienceMatrix"
import { useOutcomeMapAction } from "../../map/hooks"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  NOD_SOD_OUTCOME_CODES,
  getOutcomeName,
  getOutcomeDefinition,
  type OutcomeCode,
} from "../../../content/outcomes"
import { hydroclimateOptions } from "../../../content/scenarios"
import { TIER_LABELS } from "../../../content/tiers"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../utils/scenarioIdSort"

export type ResilienceView = "scenario" | "outcome"

export interface ResilienceControlsState {
  view: ResilienceView
  focusScenarioId: string
  focusOutcomeCode: string
  selectedHydroclimates: ReadonlySet<ResilienceHydroclimate>
  showRegionalSplit: boolean
  showCellNumbers: boolean
}

interface ResiliencePanelProps {
  controls: ResilienceControlsState
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
}

const HYDROCLIMATE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  hydroclimateOptions.map((h) => [h.value, h.description]),
)

const HYDROCLIMATE_LABELS: Record<string, string> = Object.fromEntries(
  hydroclimateOptions.map((h) => [h.value, h.label]),
)

export default function ResiliencePanel({
  controls,
  highlightedIds = null,
  onScenarioHover,
}: ResiliencePanelProps) {
  const theme = useTheme()
  const {
    view,
    focusScenarioId,
    focusOutcomeCode,
    selectedHydroclimates,
    showRegionalSplit,
    showCellNumbers,
  } = controls

  const { selectedScenarios } = useScenarioExplorerStore()
  const setHighlightedScenario = useScenarioExplorerStore(
    (s) => s.setHighlightedScenario,
  )

  const {
    scenarioIds,
    scenarios,
    cells: matrixCells,
    getCell,
    hydroclimates,
    getDisplayName,
    isLoading,
    error,
  } = useResilienceMatrix()

  const { showOutcomeOnMap, isMapVisible } = useOutcomeMapAction()

  const { showAlternativeBaselines } = useScenarioExplorerStore()

  // Tier colors from the theme (primitive-only for stable memo)
  const tier1 = theme.palette.tiers.tier1
  const tier2 = theme.palette.tiers.tier2
  const tier3 = theme.palette.tiers.tier3
  const tier4 = theme.palette.tiers.tier4
  const tierColors = useMemo(
    () => [tier1, tier2, tier3, tier4] as const,
    [tier1, tier2, tier3, tier4],
  )

  const tierLabels = useMemo(
    () =>
      [
        TIER_LABELS[1],
        TIER_LABELS[2],
        TIER_LABELS[3],
        TIER_LABELS[4],
      ] as const,
    [],
  )

  // Chrome / neutral colors for the heatmap pulled from the app theme so
  // the viz component stays theme-agnostic.
  const textPrimary = theme.palette.text.primary
  const commonWhite = theme.palette.common.white
  const grey100 = theme.palette.grey[100]
  const grey300 = theme.palette.grey[300]
  const grey400 = theme.palette.grey[400]
  const grey600 = theme.palette.grey[600]
  const grey700 = theme.palette.grey[700]
  const heatmapPalette = useMemo<ResilienceHeatmapPalette>(
    () => ({
      text: textPrimary,
      textMuted: grey700,
      hoverStroke: textPrimary,
      onDarkTier: commonWhite,
      onLightTier: textPrimary,
      unavailableFill: grey100,
      unavailableStroke: grey400,
      unavailableHatch: grey300,
      axisHintUnderline: grey400,
      tooltipBg: commonWhite,
      tooltipBorder: grey300,
      tooltipShadow: `0 2px 8px ${grey600}1F`,
    }),
    [
      textPrimary,
      commonWhite,
      grey100,
      grey300,
      grey400,
      grey600,
      grey700,
    ],
  )

  // Column (X axis) items: filtered hydroclimates
  const columns: ResilienceAxisItem[] = useMemo(() => {
    return hydroclimates
      .filter((hc) => selectedHydroclimates.has(hc))
      .map((hc) => ({
        key: hc,
        label: HYDROCLIMATE_LABELS[hc] ?? hc,
        definitionTooltip: HYDROCLIMATE_DESCRIPTIONS[hc],
      }))
  }, [hydroclimates, selectedHydroclimates])

  // Row ordering helpers

  // Outcome-row order (aggregate + optional NOD/SOD interleaved)
  const scenarioViewRowCodes = useMemo(() => {
    if (!showRegionalSplit) return OUTCOME_CODE_ORDER as readonly string[]
    return OUTCOME_CODE_ORDER.flatMap<string>((code) => {
      const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
      return variants ? [code, variants[0], variants[1]] : [code]
    })
  }, [showRegionalSplit])

  // Scenario-row order (for outcome view): primary baseline first, then
  // the 24 sibling-group order (already sorted by useScenarioList).
  const outcomeViewRowIds = useMemo(() => {
    const ids = [...scenarioIds]
    if (!showAlternativeBaselines) {
      // Still include alt baselines — they show their own row; this was
      // intentional in the plan so every HC row count stays stable (24).
    }
    // Move primary baseline to top; leave the rest in their existing order.
    const primary = ids.indexOf(PRIMARY_SCENARIO_BASELINE_ID)
    if (primary > 0) {
      ids.splice(primary, 1)
      ids.unshift(PRIMARY_SCENARIO_BASELINE_ID)
    }
    return ids
  }, [scenarioIds, showAlternativeBaselines])

  // Build rows + cells for the heatmap based on view
  const { rows, cells, focusSubjectLabel } = useMemo(() => {
    const out: ResilienceHeatmapCell[] = []

    if (view === "scenario") {
      const focusName = getDisplayName(focusScenarioId)
      const rowItems: ResilienceAxisItem[] = scenarioViewRowCodes.map(
        (code) => ({
          key: code,
          label: getOutcomeName(code),
          definitionTooltip: getOutcomeDefinition(code),
        }),
      )

      for (const code of scenarioViewRowCodes) {
        const outcomeName = getOutcomeName(code)
        for (const col of columns) {
          const hc = col.key as ResilienceHydroclimate
          const cell = getCell(focusScenarioId, code, hc)
          if (!cell) continue
          out.push({
            rowKey: code,
            colKey: hc,
            continuousValue: cell.continuousValue,
            tierLevel: cell.tierLevel,
            available: cell.available,
            unavailableReason: cell.unavailableReason,
            rowLabel: outcomeName,
            colLabel: col.label,
            subjectLabel: focusName,
            scenarioId: focusScenarioId,
            outcomeCode: code,
            type: cell.type,
          })
        }
      }

      return {
        rows: rowItems,
        cells: out,
        focusSubjectLabel: focusName,
      }
    }

    // outcome view: rows = scenarios, one fixed outcome
    const outcomeName = getOutcomeName(focusOutcomeCode)
    const outcomeDef = getOutcomeDefinition(focusOutcomeCode)
    const rowItems: ResilienceAxisItem[] = outcomeViewRowIds.map((sid) => ({
      key: sid,
      label: getDisplayName(sid),
      definitionTooltip:
        scenarios.find((s) => s.scenarioId === sid)?.description ||
        getDisplayName(sid),
    }))

    for (const sid of outcomeViewRowIds) {
      for (const col of columns) {
        const hc = col.key as ResilienceHydroclimate
        const cell = getCell(sid, focusOutcomeCode, hc)
        if (!cell) continue
        out.push({
          rowKey: sid,
          colKey: hc,
          continuousValue: cell.continuousValue,
          tierLevel: cell.tierLevel,
          available: cell.available,
          unavailableReason: cell.unavailableReason,
          rowLabel: getDisplayName(sid),
          colLabel: col.label,
          subjectLabel: outcomeName,
          scenarioId: sid,
          outcomeCode: focusOutcomeCode,
          type: cell.type,
        })
      }
    }

    return {
      rows: rowItems,
      cells: out,
      focusSubjectLabel: outcomeDef ?? outcomeName,
    }
  }, [
    view,
    focusScenarioId,
    focusOutcomeCode,
    columns,
    scenarioViewRowCodes,
    outcomeViewRowIds,
    scenarios,
    getCell,
    getDisplayName,
  ])

  // Hover coordination with the sidebar (debounced)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHoveredIdRef = useRef<string | null>(null)

  const notifyHover = useCallback(
    (scenarioId: string | null) => {
      if (lastHoveredIdRef.current === scenarioId) return
      lastHoveredIdRef.current = scenarioId
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (scenarioId != null) {
        startTransition(() => {
          setHighlightedScenario(scenarioId)
          onScenarioHover?.(scenarioId)
        })
      } else {
        hoverTimerRef.current = setTimeout(() => {
          startTransition(() => {
            setHighlightedScenario(null)
            onScenarioHover?.(null)
          })
        }, 150)
      }
    },
    [setHighlightedScenario, onScenarioHover],
  )

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  // In scenario view, rows are outcomes — hover always implies the focus
  // scenario. In outcome view, rows are scenarios — hover implies that row.
  const handleCellHover = useCallback(
    (cell: ResilienceHeatmapCell | null) => {
      if (!cell) {
        notifyHover(null)
        return
      }
      const sid =
        view === "scenario" ? focusScenarioId : cell.scenarioId ?? null
      notifyHover(sid)
    },
    [view, focusScenarioId, notifyHover],
  )

  const handleCellClick = useCallback(
    (cell: ResilienceHeatmapCell) => {
      if (!isMapVisible) return
      const outcomeCode = cell.outcomeCode ?? focusOutcomeCode
      const sid = cell.scenarioId ?? focusScenarioId
      if (!outcomeCode || !sid) return
      showOutcomeOnMap(outcomeCode, sid)
    },
    [isMapVisible, focusOutcomeCode, focusScenarioId, showOutcomeOnMap],
  )

  // Highlighted rows (sidebar hover sync). In scenario view, rows are
  // outcomes, so we don't highlight anything by scenario. Just dim the
  // entire heatmap when the hovered scenario differs from the focus.
  const highlightedRowKeys = useMemo<Set<string> | null>(() => {
    if (!highlightedIds || highlightedIds.size === 0) return null
    if (view === "outcome") return new Set(highlightedIds)
    return null
  }, [highlightedIds, view])

  // Chosen-row emphasis for outcome view: dim rows that aren't in
  // selectedScenarios when at least one is selected. Merge with highlights.
  const dimRowKeys = useMemo<Set<string> | null>(() => {
    if (view !== "outcome") return null
    if (selectedScenarios.length === 0) return null
    return new Set(selectedScenarios)
  }, [view, selectedScenarios])

  const effectiveRowHighlight = useMemo<Set<string> | null>(() => {
    if (highlightedRowKeys && highlightedRowKeys.size > 0)
      return highlightedRowKeys
    return dimRowKeys
  }, [highlightedRowKeys, dimRowKeys])

  const formatRowTick = useCallback(
    (row: ResilienceAxisItem) => {
      if (view !== "scenario") return row.label
      // Indent NOD/SOD rows under their aggregate outcome parent.
      if ((NOD_SOD_OUTCOME_CODES as readonly string[]).includes(row.key)) {
        return `  ${row.label}`
      }
      return row.label
    },
    [view],
  )

  // Render states

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 2,
          p: 3,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    )
  }

  const hasData =
    !!matrixCells &&
    Object.keys(matrixCells).length > 0 &&
    columns.length > 0

  if (isLoading && !hasData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 2,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading resilience data...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      <Box
        sx={{
          px: theme.space.component.lg,
          py: theme.space.component.sm,
          display: "flex",
          alignItems: "baseline",
          gap: 2,
        }}
      >
        <Typography
          variant="dashboard"
          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
        >
          {view === "scenario" ? "Outcomes by hydroclimate" : "Scenarios by hydroclimate"}
        </Typography>
        <Typography
          variant="compactCaption"
          sx={{ color: theme.palette.text.secondary }}
        >
          {focusSubjectLabel}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          px: theme.space.component.lg,
          pb: theme.space.component.md,
        }}
      >
        {columns.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Select at least one hydroclimate in the chart controls.
            </Typography>
          </Box>
        ) : (
          <ResilienceHeatmap
            rows={rows}
            columns={columns}
            cells={cells}
            tierColors={tierColors}
            tierLabels={tierLabels}
            palette={heatmapPalette}
            showCellNumbers={showCellNumbers}
            onCellHover={handleCellHover}
            onCellClick={isMapVisible ? handleCellClick : undefined}
            highlightedRowKeys={effectiveRowHighlight}
            formatRowTick={formatRowTick}
          />
        )}
      </Box>

      {isLoading && hasData && (
        <CircularProgress
          size={18}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            opacity: 0.5,
          }}
        />
      )}
    </Box>
  )
}
