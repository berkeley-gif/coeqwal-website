"use client"

/**
 * ResilienceControls — chart-controls bar for the resilience heatmap.
 *
 * Renders inside the ChartControlsBar slot of ScenarioExplorer. The panel
 * state lives in the parent (ScenarioExplorer.tsx) so that controls and
 * panel share a single source of truth without touching the Zustand store.
 */

import React, { useCallback, useMemo } from "react"
import {
  Box,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { InlineToggleChip } from "../components/InlineToggleChip"
import type {
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
      onChange({ view: next })
    },
    [view, onChange],
  )

  const handleFocusChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const value = e.target.value
      if (view === "scenario") onChange({ focusScenarioId: value })
      else onChange({ focusOutcomeCode: value })
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

  const focusValue = view === "scenario" ? focusScenarioId : focusOutcomeCode

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
        <Typography
          variant="compactCaption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
            mr: 0.5,
          }}
        >
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
      </Box>

      {/* Focus picker */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="compactCaption"
          sx={{ fontWeight: 500, color: theme.palette.text.secondary }}
        >
          Focus:
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

      {/* Hydroclimate multi-select */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="compactCaption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
            mr: 0.5,
          }}
        >
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
