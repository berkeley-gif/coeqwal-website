"use client"

/**
 * ResilienceControls — chart-controls bar for the resilience heatmap.
 *
 * Renders inside the ChartControlsBar slot of ScenarioExplorer. The panel
 * state lives in the parent (ScenarioExplorer.tsx) so that controls and
 * panel share a single source of truth without touching the Zustand store.
 *
 * Layout: two conceptual lines (wrapped as needed). Line 1 is the primary
 * shape of the chart (view, focus, hydroclimates). Line 2 is the
 * encoding / comparison / display options. Combinations that don't make
 * sense (e.g. density/glyph outside aggregate view) are hidden.
 *
 * Feature flag: SHOW_INSIGHT_MODES gates the unrefined insight-mode UI
 * (aggregate view, delta / density / glyph encodings, row clustering,
 * marginal strips). When false, only the pre-insight-mode controls are
 * visible. The underlying code and state remain wired, so flipping this
 * back to `true` restores the full toolbar without any other changes.
 */
const SHOW_INSIGHT_MODES = false

import React, { useCallback, useMemo } from "react"
import {
  Box,
  Divider,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { InlineToggleChip } from "../components/InlineToggleChip"
import type {
  CellEncoding,
  DeltaMode,
  ResilienceControlsState,
  ResilienceView,
} from "./ResiliencePanel"
import {
  type ResilienceHydroclimate,
  RESILIENCE_HYDROCLIMATES,
} from "../hooks/useResilienceMatrix"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  getOutcomeName,
  type OutcomeCode,
} from "../../../content/outcomes"
import {
  hydroclimateOptions,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../content/scenarios"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"

interface ResilienceControlsProps {
  controls: ResilienceControlsState
  onChange: (next: Partial<ResilienceControlsState>) => void
}

export default function ResilienceControls({
  controls,
  onChange,
}: ResilienceControlsProps) {
  const theme = useTheme()
  const { siblingGroups } = useScenarioList()

  const {
    view,
    cellEncoding,
    deltaMode,
    deltaBaselineScenarioId,
    aggregateScope,
    reorderBySimilarity,
    showMarginals,
    focusScenarioId,
    focusOutcomeCode,
    selectedHydroclimates,
    showRegionalSplit,
    showCellNumbers,
  } = controls

  const outcomeItems = useMemo(() => {
    const items: { code: string; label: string; indent?: boolean }[] = []
    for (const code of OUTCOME_CODE_ORDER) {
      items.push({ code, label: getOutcomeName(code) })
      if (showRegionalSplit) {
        const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
        if (variants) {
          items.push({
            code: variants[0],
            label: getOutcomeName(variants[0]),
            indent: true,
          })
          items.push({
            code: variants[1],
            label: getOutcomeName(variants[1]),
            indent: true,
          })
        }
      }
    }
    return items
  }, [showRegionalSplit])

  const scenarioItems = useMemo(() => {
    return siblingGroups.map((s) => ({
      id: s.scenarioId,
      label: s.shortLabel || s.label,
    }))
  }, [siblingGroups])

  const handleViewChange = useCallback(
    (next: ResilienceView) => {
      if (view === next) return
      // When leaving aggregate view, reset density/glyph encodings so we
      // don't render an invalid mode on the scenario/outcome views.
      const patch: Partial<ResilienceControlsState> = { view: next }
      if (
        next !== "aggregate" &&
        (cellEncoding === "density_risk" ||
          cellEncoding === "density_opp" ||
          cellEncoding === "glyph")
      ) {
        patch.cellEncoding = "tier"
      }
      onChange(patch)
    },
    [view, cellEncoding, onChange],
  )

  const handleFocusChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const value = e.target.value
      if (view === "scenario") onChange({ focusScenarioId: value })
      else if (view === "outcome") onChange({ focusOutcomeCode: value })
    },
    [view, onChange],
  )

  const toggleHydroclimate = useCallback(
    (hc: ResilienceHydroclimate) => {
      const next = new Set(selectedHydroclimates)
      if (next.has(hc)) {
        if (next.size === 1) return // always keep at least one selected
        next.delete(hc)
      } else {
        next.add(hc)
      }
      onChange({ selectedHydroclimates: next })
    },
    [selectedHydroclimates, onChange],
  )

  const toggleShowAllHcs = useCallback(() => {
    const allSelected =
      selectedHydroclimates.size === RESILIENCE_HYDROCLIMATES.length
    if (allSelected) {
      onChange({
        selectedHydroclimates: new Set<ResilienceHydroclimate>([
          "historical",
        ]),
      })
    } else {
      onChange({
        selectedHydroclimates: new Set<ResilienceHydroclimate>(
          RESILIENCE_HYDROCLIMATES,
        ),
      })
    }
  }, [selectedHydroclimates, onChange])

  const allHcsSelected =
    selectedHydroclimates.size === RESILIENCE_HYDROCLIMATES.length

  const focusValue =
    view === "scenario"
      ? focusScenarioId
      : view === "outcome"
        ? focusOutcomeCode
        : ""

  const handleEncodingChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ cellEncoding: e.target.value as CellEncoding })
    },
    [onChange],
  )

  const handleDeltaModeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ deltaMode: e.target.value as DeltaMode })
    },
    [onChange],
  )

  const handleDeltaBaselineChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ deltaBaselineScenarioId: e.target.value })
    },
    [onChange],
  )

  // Delta compare only composes cleanly with tier/mean encodings.
  // In density/glyph aggregate modes, hide the compare-to dropdown.
  const showDeltaControls =
    SHOW_INSIGHT_MODES &&
    (view !== "aggregate" ||
      cellEncoding === "tier" ||
      cellEncoding === "delta")

  const showFocusSelect = view !== "aggregate"
  const showEncodingSelect = SHOW_INSIGHT_MODES && view === "aggregate"
  const showAggregateScope = SHOW_INSIGHT_MODES && view === "aggregate"
  const showReorderChip = SHOW_INSIGHT_MODES
  const showMarginalsChip = SHOW_INSIGHT_MODES
  // The second-line divider is only useful when at least one of the
  // insight-mode controls (encoding / delta) is visible.
  const showInsightDivider = showEncodingSelect || showDeltaControls
  // The divider before reorder/marginals is only useful when those chips render.
  const showReorderDivider = showReorderChip || showMarginalsChip

  const captionSx = {
    fontWeight: 500,
    color: theme.palette.text.primary,
    mr: 0.5,
  } as const

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      {/* View toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="compactCaption" sx={captionSx}>
          View:
        </Typography>
        <InlineToggleChip
          label="by scenario"
          active={view === "scenario"}
          onClick={() => handleViewChange("scenario")}
        />
        <InlineToggleChip
          label="by outcome"
          active={view === "outcome"}
          onClick={() => handleViewChange("outcome")}
        />
        {SHOW_INSIGHT_MODES && (
          <InlineToggleChip
            label="aggregate"
            active={view === "aggregate"}
            onClick={() => handleViewChange("aggregate")}
          />
        )}
      </Box>

      {/* Focus picker (hidden in aggregate view) */}
      {showFocusSelect && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="compactCaption" sx={captionSx}>
            {view === "outcome" ? "Outcome:" : "Scenario:"}
          </Typography>
          <Select
            size="small"
            value={focusValue}
            onChange={handleFocusChange}
            sx={{
              minWidth: 200,
              maxWidth: 320,
              fontSize: "0.8125rem",
              ".MuiSelect-select": { py: 0.5 },
            }}
          >
            {view === "scenario"
              ? scenarioItems.map((s) => (
                  <MenuItem
                    key={s.id}
                    value={s.id}
                    sx={{ fontSize: "0.8125rem" }}
                  >
                    {s.label}
                  </MenuItem>
                ))
              : outcomeItems.map((o) => (
                  <MenuItem
                    key={o.code}
                    value={o.code}
                    sx={{
                      fontSize: "0.8125rem",
                      pl: o.indent ? 4 : 2,
                    }}
                  >
                    {o.label}
                  </MenuItem>
                ))}
          </Select>
        </Box>
      )}

      {/* Aggregate-scope toggle (aggregate view only) */}
      {showAggregateScope && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="compactCaption" sx={captionSx}>
            Aggregate:
          </Typography>
          <InlineToggleChip
            label="all"
            active={aggregateScope === "all"}
            onClick={() => onChange({ aggregateScope: "all" })}
          />
          <InlineToggleChip
            label="selected only"
            active={aggregateScope === "selected"}
            onClick={() => onChange({ aggregateScope: "selected" })}
          />
        </Box>
      )}

      {/* Hydroclimate multi-select */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="compactCaption" sx={captionSx}>
          Hydroclimates:
        </Typography>
        <InlineToggleChip
          label="all"
          active={allHcsSelected}
          onClick={toggleShowAllHcs}
        />
        {hydroclimateOptions.map((opt) => {
          const hc = opt.value as ResilienceHydroclimate
          return (
            <InlineToggleChip
              key={opt.value}
              label={HYDROCLIMATE_SHORT_LABELS[hc] ?? opt.label}
              active={selectedHydroclimates.has(hc)}
              onClick={() => toggleHydroclimate(hc)}
            />
          )
        })}
      </Box>

      {showInsightDivider && (
        <Divider
          orientation="vertical"
          flexItem
          sx={{ mx: 0.5, borderColor: theme.palette.divider }}
        />
      )}

      {/* Cell encoding (aggregate view only) */}
      {showEncodingSelect && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="compactCaption" sx={captionSx}>
            Cell:
          </Typography>
          <Select
            size="small"
            value={cellEncoding === "delta" ? "tier" : cellEncoding}
            onChange={handleEncodingChange}
            sx={{
              minWidth: 160,
              fontSize: "0.8125rem",
              ".MuiSelect-select": { py: 0.5 },
            }}
          >
            <MenuItem value="tier" sx={{ fontSize: "0.8125rem" }}>
              mean tier
            </MenuItem>
            <MenuItem value="density_risk" sx={{ fontSize: "0.8125rem" }}>
              risk density
            </MenuItem>
            <MenuItem value="density_opp" sx={{ fontSize: "0.8125rem" }}>
              opportunity density
            </MenuItem>
            <MenuItem value="glyph" sx={{ fontSize: "0.8125rem" }}>
              distribution
            </MenuItem>
          </Select>
        </Box>
      )}

      {/* Compare-to (delta) controls */}
      {showDeltaControls && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography variant="compactCaption" sx={captionSx}>
            Compare to:
          </Typography>
          <Select
            size="small"
            value={deltaMode}
            onChange={handleDeltaModeChange}
            sx={{
              minWidth: 150,
              fontSize: "0.8125rem",
              ".MuiSelect-select": { py: 0.5 },
            }}
          >
            <MenuItem value="none" sx={{ fontSize: "0.8125rem" }}>
              none
            </MenuItem>
            <MenuItem value="vs_historical" sx={{ fontSize: "0.8125rem" }}>
              historical HC
            </MenuItem>
            <MenuItem value="vs_baseline" sx={{ fontSize: "0.8125rem" }}>
              baseline scenario
            </MenuItem>
          </Select>
          {deltaMode === "vs_baseline" && (
            <Select
              size="small"
              value={deltaBaselineScenarioId}
              onChange={handleDeltaBaselineChange}
              sx={{
                minWidth: 180,
                maxWidth: 260,
                fontSize: "0.8125rem",
                ".MuiSelect-select": { py: 0.5 },
              }}
            >
              {scenarioItems.map((s) => (
                <MenuItem
                  key={s.id}
                  value={s.id}
                  sx={{ fontSize: "0.8125rem" }}
                >
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      )}

      {showReorderDivider && (
        <Divider
          orientation="vertical"
          flexItem
          sx={{ mx: 0.5, borderColor: theme.palette.divider }}
        />
      )}

      {/* Reorder by similarity */}
      {showReorderChip && (
        <InlineToggleChip
          label="reorder rows"
          active={reorderBySimilarity}
          onClick={() =>
            onChange({ reorderBySimilarity: !reorderBySimilarity })
          }
        />
      )}

      {/* Marginal strips */}
      {showMarginalsChip && (
        <InlineToggleChip
          label="marginals"
          active={showMarginals}
          onClick={() => onChange({ showMarginals: !showMarginals })}
        />
      )}

      {/* NOD/SOD toggle */}
      <InlineToggleChip
        label="NOD/SOD rows"
        active={showRegionalSplit}
        onClick={() => onChange({ showRegionalSplit: !showRegionalSplit })}
      />

      {/* Cell-number toggle */}
      <InlineToggleChip
        label="cell values"
        active={showCellNumbers}
        onClick={() => onChange({ showCellNumbers: !showCellNumbers })}
      />
    </Box>
  )
}
