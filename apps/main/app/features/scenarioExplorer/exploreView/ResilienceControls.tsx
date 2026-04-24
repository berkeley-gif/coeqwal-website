"use client"

/**
 * ResilienceControls - sentence-style header for the resilience heatmap.
 *
 * The control surface is a single one-line sentence:
 *
 *   "Showing {pivot}, covering {scenarios}, {outcomes}, and
 *    {climates}. Each cell is colored by its {encoding}."   [Options]
 *
 * The phrases run from broad (what the chart pivots on) to narrow
 * (what cell colors mean), so a new user reads the sentence in the
 * same order they would make decisions. Wording avoids data jargon
 * (no "aggregate", "mean", "read as", "x" / cross-product); terms of
 * art that the project already defines in its glossary (scenario,
 * outcome, climate future / hydroclimate, tier) are kept as-is.
 *
 * Layout is not a user choice: non-aggregate pivots always render as
 * small multiples, and the aggregate pivot is always a single
 * averaged chart. This was a deliberate simplification - "combine
 * into one chart" was visually indistinguishable from small multiples
 * placed side-by-side once you accounted for the shared row axis, so
 * we removed it as a choice.
 *
 * Each bold phrase is a click-target that opens a focused popover for
 * that dimension. Transpose and display-overflow live as a floating
 * toolbar on the chart itself (see `ResiliencePanel`); the Configure
 * button opens the existing `ResilienceChartTuner` overlay for
 * presets, walkthrough, reset, and snapshot.
 *
 * Quadrant / Leverage retains its own compact two-card control set
 * because its mental model differs from the 3-axis cube.
 */

import React, { useCallback, useMemo, useState } from "react"
import {
  Box,
  Divider,
  MenuItem,
  Popover,
  Select,
  type SelectChangeEvent,
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import type { Theme } from "@repo/ui/mui"
import { InlineToggleChip } from "../components/InlineToggleChip"
import ResilienceChartTuner from "./ResilienceChartTuner"
import { useScenarioExplorerStore } from "../store"
import { useTourAnchor } from "../tour/TourAnchorContext"
import type {
  AggregateOver,
  CellEncoding,
  DeltaMode,
  QuadrantUnit,
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

// User-facing labels for the pivot (first phrase) in the sentence
// header. Non-aggregate pivots render as small multiples (one tile
// per item of the picked dimension); aggregate renders as a single
// averaged chart (see `AGGREGATE_OVER_LABEL`).
const PIVOT_LABEL: Record<ResilienceView, string> = {
  scenario: "one chart per scenario",
  outcome: "one chart per outcome",
  hydroclimate: "one chart per climate future",
  aggregate: "a single aggregate chart",
  quadrant: "leverage",
}

const PIVOT_ORDER: readonly ResilienceView[] = [
  "scenario",
  "outcome",
  "hydroclimate",
  "aggregate",
]

// Labels for the "averaged across X" chip row inside the pivot
// popover, and for the sentence header when in aggregate mode.
const AGGREGATE_OVER_LABEL: Record<AggregateOver, string> = {
  scenarios: "averaged across scenarios",
  outcomes: "averaged across outcomes",
  hydroclimates: "averaged across climate futures",
}

const AGGREGATE_OVER_ORDER: readonly AggregateOver[] = [
  "scenarios",
  "outcomes",
  "hydroclimates",
]

/**
 * Virtual "Read as" enum. Combines cellEncoding + deltaMode into a
 * single user-facing read mode.
 */
type ReadAs =
  | "mean_tier"
  | "climate_shift"
  | "risk_density"
  | "opportunity_density"
  | "distribution"
  | "operational_leverage"

const READ_AS_LABEL: Record<ReadAs, string> = {
  mean_tier: "average tier",
  climate_shift: "change vs. historical",
  risk_density: "share that are at-risk",
  opportunity_density: "share that are optimal",
  distribution: "spread of results",
  operational_leverage: "sensitivity to climate",
}

function deriveReadAs(
  view: ResilienceView,
  enc: CellEncoding,
  delta: DeltaMode,
): ReadAs {
  if (view === "quadrant") return "mean_tier"
  if (delta !== "none") return "climate_shift"
  if (enc === "density_risk") return "risk_density"
  if (enc === "density_opp") return "opportunity_density"
  if (enc === "distribution") return "distribution"
  if (enc === "leverage") return "operational_leverage"
  return "mean_tier"
}

function applyReadAs(
  next: ReadAs,
  prev: ResilienceControlsState,
): Partial<ResilienceControlsState> {
  switch (next) {
    case "mean_tier":
      return { cellEncoding: "tier", deltaMode: "none" }
    case "climate_shift":
      return {
        cellEncoding: "tier",
        deltaMode: prev.deltaMode !== "none" ? prev.deltaMode : "vs_historical",
      }
    case "risk_density":
      return { cellEncoding: "density_risk", deltaMode: "none" }
    case "opportunity_density":
      return { cellEncoding: "density_opp", deltaMode: "none" }
    case "distribution":
      return { cellEncoding: "distribution", deltaMode: "none" }
    case "operational_leverage":
      return { cellEncoding: "leverage", deltaMode: "none" }
  }
}

const READ_AS_OPTIONS: readonly ReadAs[] = [
  "mean_tier",
  "climate_shift",
  "distribution",
  "risk_density",
  "opportunity_density",
  "operational_leverage",
]

/**
 * Gate options that don't compose with the current pivot /
 * aggregation. Densities + leverage need the underlying scenario ×
 * hydroclimate cube; they're only coherent in aggregate. Climate shift
 * needs a historical HC column, so it's disabled when aggregating over
 * hydroclimates.
 */
function isReadAsOptionDisabled(
  opt: ReadAs,
  view: ResilienceView,
  aggregateOver: AggregateOver,
): boolean {
  if (
    (opt === "risk_density" ||
      opt === "opportunity_density" ||
      opt === "operational_leverage") &&
    view !== "aggregate"
  ) {
    return true
  }
  if (opt === "operational_leverage" && aggregateOver !== "scenarios") {
    return true
  }
  if (opt === "climate_shift" && aggregateOver === "hydroclimates") {
    return true
  }
  return false
}

// --------------------------------------------------------------------
// Sentence-phrase trigger
// --------------------------------------------------------------------

interface PhraseButtonProps {
  label: React.ReactNode
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  active?: boolean
  ariaLabel?: string
  /** Optional callback ref to forward onto the rendered button element.
   *  Used by the resilience tour system to anchor poppers on specific
   *  clickable phrases in the configuration sentence. */
  tourAnchorRef?: (el: HTMLElement | null) => void
}

function phraseButtonSx(theme: Theme, active: boolean) {
  return {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 0.25,
    px: 0.5,
    py: 0.25,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: 600,
    color: active ? theme.palette.blue.bright : theme.palette.text.primary,
    background: active
      ? theme.palette.interaction.selectedBackground
      : "transparent",
    textDecoration: "underline",
    textDecorationColor: theme.palette.grey[400],
    textUnderlineOffset: "3px",
    transition: "color 150ms ease, background 150ms ease",
    "&:hover, &:focus-visible": {
      color: theme.palette.blue.bright,
      background: theme.palette.action.hover,
      textDecorationColor: theme.palette.blue.bright,
      outline: "none",
    },
  } as const
}

function PhraseButton({
  label,
  onClick,
  active = false,
  ariaLabel,
  tourAnchorRef,
}: PhraseButtonProps) {
  const theme = useTheme()
  return (
    <Box
      ref={tourAnchorRef}
      component="button"
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={active}
      aria-label={ariaLabel}
      sx={phraseButtonSx(theme, active)}
    >
      {label}
      <icons.KeyboardArrowDown
        sx={{ fontSize: "0.9em", transform: "translateY(2px)" }}
      />
    </Box>
  )
}

// --------------------------------------------------------------------
// Reusable popover shell
// --------------------------------------------------------------------

interface PopoverShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  width?: number
}

function PopoverShell({
  title,
  subtitle,
  children,
  width = 280,
}: PopoverShellProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        width,
        maxWidth: "90vw",
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box>
        <Typography
          variant="compactCaption"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: theme.palette.grey[800],
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontSize: "0.72rem",
              color: theme.palette.grey[600],
              mt: 0.25,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {children}
      </Box>
    </Box>
  )
}

// --------------------------------------------------------------------
// ResilienceControls
// --------------------------------------------------------------------

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
    selectedHydroclimates,
    quadrantUnit,
    quadrantOutcome,
    primaryOutcomeCode,
    compareOutcomeCodes,
    aggregateOver,
  } = controls

  const selectedScenarios = useScenarioExplorerStore((s) => s.selectedScenarios)

  // Tour anchors for the sentence phrases. Each anchor attaches
  // directly to the phrase's <button>, so the tour highlight lands on
  // the clickable word rather than a wrapper. ChartTuner's trigger is
  // threaded separately via its `triggerRef` prop.
  const pivotAnchorRef = useTourAnchor("resilience.pivot")
  const outcomesAnchorRef = useTourAnchor("resilience.outcomes")
  const encodingAnchorRef = useTourAnchor("resilience.encoding")
  const moreOptionsAnchorRef = useTourAnchor("resilience.moreOptions")
  const showResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.showResilienceOutcomeSelector,
  )
  const setShowResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.setShowResilienceOutcomeSelector,
  )
  const resilienceVisibleOutcomes = useScenarioExplorerStore(
    (s) => s.resilienceVisibleOutcomes,
  )
  const distributionMode = useScenarioExplorerStore(
    (s) => s.resilienceDistributionMode,
  )
  const setDistributionMode = useScenarioExplorerStore(
    (s) => s.setResilienceDistributionMode,
  )

  const outcomeItems = useMemo(() => {
    const items: { code: string; label: string; indent?: boolean }[] = []
    for (const code of OUTCOME_CODE_ORDER) {
      items.push({ code, label: getOutcomeName(code) })
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
    return items
  }, [])

  const scenarioItems = useMemo(() => {
    return siblingGroups.map((s) => ({
      id: s.scenarioId,
      label: s.shortLabel || s.label,
    }))
  }, [siblingGroups])

  // Aggregate-only outcomes (no regional variants) for the Compare sheet
  // and the per-outcome primary picker.
  const aggregateOutcomeItems = useMemo(
    () =>
      OUTCOME_CODE_ORDER.map((code) => ({
        code,
        label: getOutcomeName(code),
      })),
    [],
  )

  // --------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------

  const handleViewChange = useCallback(
    (next: ResilienceView) => {
      if (view === next) return
      const patch: Partial<ResilienceControlsState> = { view: next }
      if (
        next !== "aggregate" &&
        (cellEncoding === "density_risk" ||
          cellEncoding === "density_opp" ||
          cellEncoding === "glyph" ||
          cellEncoding === "leverage")
      ) {
        patch.cellEncoding = "tier"
      }
      onChange(patch)
    },
    [view, cellEncoding, onChange],
  )

  const handleAggregateOverChange = useCallback(
    (next: AggregateOver) => {
      if (aggregateOver === next) return
      const patch: Partial<ResilienceControlsState> = { aggregateOver: next }
      if (next === "outcomes" && cellEncoding === "leverage") {
        patch.cellEncoding = "tier"
      }
      if (next === "hydroclimates" && deltaMode !== "none") {
        patch.deltaMode = "none"
      }
      onChange(patch)
    },
    [aggregateOver, cellEncoding, deltaMode, onChange],
  )

  const toggleHydroclimate = useCallback(
    (hc: ResilienceHydroclimate) => {
      const next = new Set(selectedHydroclimates)
      if (next.has(hc)) {
        if (next.size === 1) return
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
        selectedHydroclimates: new Set<ResilienceHydroclimate>(["historical"]),
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

  const handleReadAsChange = useCallback(
    (next: ReadAs) => {
      if (isReadAsOptionDisabled(next, view, aggregateOver)) return
      onChange(applyReadAs(next, controls))
    },
    [controls, onChange, view, aggregateOver],
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

  const handlePrimaryOutcomeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const next = e.target.value || null
      onChange({ primaryOutcomeCode: next })
    },
    [onChange],
  )

  const handleQuadrantUnitChange = useCallback(
    (next: QuadrantUnit) => {
      if (quadrantUnit === next) return
      onChange({ quadrantUnit: next })
    },
    [quadrantUnit, onChange],
  )

  const handleQuadrantOutcomeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ quadrantOutcome: e.target.value })
    },
    [onChange],
  )

  const toggleCompareOutcome = useCallback(
    (code: string) => {
      const next = [...compareOutcomeCodes]
      const idx = next.indexOf(code)
      if (idx >= 0) next.splice(idx, 1)
      else next.push(code)
      onChange({ compareOutcomeCodes: next })
    },
    [compareOutcomeCodes, onChange],
  )

  // --------------------------------------------------------------
  // Popover anchors
  // --------------------------------------------------------------

  const [encodingAnchor, setEncodingAnchor] = useState<HTMLElement | null>(null)
  const [scenariosAnchor, setScenariosAnchor] = useState<HTMLElement | null>(
    null,
  )
  const [outcomesAnchor, setOutcomesAnchor] = useState<HTMLElement | null>(null)
  const [climatesAnchor, setClimatesAnchor] = useState<HTMLElement | null>(null)
  const [pivotAnchor, setPivotAnchor] = useState<HTMLElement | null>(null)

  const isQuadrant = view === "quadrant"
  const isAggregate = view === "aggregate"
  const readAs = deriveReadAs(view, cellEncoding, deltaMode)

  // --------------------------------------------------------------
  // Sentence phrase labels
  // --------------------------------------------------------------

  const encodingLabel = READ_AS_LABEL[readAs]
  const scenarioCount = selectedScenarios.length
  const scenarioTotal = scenarioItems.length
  const scenariosLabel =
    scenarioCount === 0
      ? `all ${scenarioTotal} scenarios`
      : scenarioCount === 1
        ? "1 scenario"
        : `${scenarioCount} of ${scenarioTotal} scenarios`
  const outcomeCount = resilienceVisibleOutcomes.length
  const outcomeTotal = OUTCOME_CODE_ORDER.length
  const outcomesLabel =
    outcomeCount === outcomeTotal
      ? `all ${outcomeTotal} outcomes`
      : `${outcomeCount} of ${outcomeTotal} outcomes`
  const climatesLabel = allHcsSelected
    ? "all climate futures"
    : selectedHydroclimates.size === 1
      ? "1 climate future"
      : `${selectedHydroclimates.size} of ${RESILIENCE_HYDROCLIMATES.length} climate futures`

  const pivotLabel = isAggregate
    ? AGGREGATE_OVER_LABEL[aggregateOver]
    : PIVOT_LABEL[view]

  const cellSize = { fontSize: "0.8125rem" } as const

  // --------------------------------------------------------------
  // Quadrant / Leverage: keep the compact two-card surface.
  // --------------------------------------------------------------

  if (isQuadrant) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
          py: 0.25,
          flex: 1,
          minWidth: 0,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography
          variant="compactCaption"
          sx={{ fontSize: "0.8125rem", color: theme.palette.grey[800] }}
        >
          Showing each point as
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <InlineToggleChip
            label="an outcome"
            active={quadrantUnit === "outcome"}
            onClick={() => handleQuadrantUnitChange("outcome")}
          />
          <InlineToggleChip
            label="a location"
            active={quadrantUnit === "loi"}
            onClick={() => handleQuadrantUnitChange("loi")}
          />
        </Box>
        {quadrantUnit === "loi" && (
          <Select
            size="small"
            value={quadrantOutcome ?? ""}
            onChange={handleQuadrantOutcomeChange}
            displayEmpty
            sx={{ ...cellSize, ".MuiSelect-select": { py: 0.5 } }}
          >
            <MenuItem value="" disabled sx={cellSize}>
              Pick an outcome
            </MenuItem>
            {outcomeItems.map((o) => (
              <MenuItem
                key={o.code}
                value={o.code}
                sx={{ ...cellSize, pl: o.indent ? 4 : 2 }}
              >
                {o.label}
              </MenuItem>
            ))}
          </Select>
        )}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {PIVOT_ORDER.map((mode) => (
            <InlineToggleChip
              key={mode}
              label={PIVOT_LABEL[mode]}
              active={view === mode}
              onClick={() => handleViewChange(mode)}
            />
          ))}
        </Box>
      </Box>
    )
  }

  // --------------------------------------------------------------
  // Sentence header
  // --------------------------------------------------------------

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 0.5,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Typography
        variant="compactCaption"
        component="div"
        sx={{
          fontSize: "0.875rem",
          lineHeight: 1.7,
          color: theme.palette.grey[800],
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.25,
          minWidth: 0,
          flex: 1,
        }}
      >
        <Box component="span" sx={{ color: theme.palette.grey[700], mr: 0.25 }}>
          Showing
        </Box>
        <PhraseButton
          label={pivotLabel}
          active={Boolean(pivotAnchor)}
          onClick={(e) => setPivotAnchor(e.currentTarget)}
          ariaLabel={`Chart pivot: ${pivotLabel}. Click to change what the chart is organized by.`}
          tourAnchorRef={pivotAnchorRef}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700], mx: 0.25 }}>
          , covering
        </Box>
        <PhraseButton
          label={scenariosLabel}
          active={Boolean(scenariosAnchor)}
          onClick={(e) => setScenariosAnchor(e.currentTarget)}
          ariaLabel={`Scenarios on the chart: ${scenariosLabel}. Click for details.`}
        />
        <Box component="span" sx={{ color: theme.palette.grey[500], mx: 0.25 }}>
          ,
        </Box>
        <PhraseButton
          label={outcomesLabel}
          active={Boolean(outcomesAnchor)}
          onClick={(e) => setOutcomesAnchor(e.currentTarget)}
          ariaLabel={`Outcomes on the chart: ${outcomesLabel}. Click to change.`}
          tourAnchorRef={outcomesAnchorRef}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700], mx: 0.25 }}>
          , and
        </Box>
        <PhraseButton
          label={climatesLabel}
          active={Boolean(climatesAnchor)}
          onClick={(e) => setClimatesAnchor(e.currentTarget)}
          ariaLabel={`Climate futures on the chart: ${climatesLabel}. Click to change.`}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700], mx: 0.25 }}>
          . Each cell is colored by its
        </Box>
        <PhraseButton
          label={encodingLabel}
          active={Boolean(encodingAnchor)}
          onClick={(e) => setEncodingAnchor(e.currentTarget)}
          ariaLabel={`Cell colors show: ${encodingLabel}. Click to change.`}
          tourAnchorRef={encodingAnchorRef}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700] }}>
          .
        </Box>
      </Typography>

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          flexShrink: 0,
          // Style the ResilienceChartTuner's pill trigger to read as a
          // "Configure" affordance without inventing a separate widget.
          // The tuner owns its own open state + overlay positioning.
          "& button[aria-haspopup='dialog']": {
            borderRadius: "8px !important",
            fontSize: "0.8125rem !important",
            letterSpacing: "0 !important",
            fontWeight: "500 !important",
            textTransform: "none !important",
          },
        }}
      >
        <ResilienceChartTuner
          controls={controls}
          onChange={onChange}
          triggerRef={moreOptionsAnchorRef}
        />
      </Box>

      {/* Popover: Encoding (Read as) */}
      <Popover
        open={Boolean(encodingAnchor)}
        anchorEl={encodingAnchor}
        onClose={() => setEncodingAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="What cell colors show"
          subtitle="Pick what each cell's color tells you."
          width={320}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {READ_AS_OPTIONS.map((opt) => {
              const disabled = isReadAsOptionDisabled(opt, view, aggregateOver)
              const active = readAs === opt
              return (
                <Box
                  key={opt}
                  component="button"
                  type="button"
                  disabled={disabled}
                  onClick={() => handleReadAsChange(opt)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 0.75,
                    py: 0.5,
                    border: "none",
                    borderRadius: "6px",
                    cursor: disabled ? "default" : "pointer",
                    textAlign: "left",
                    background: active
                      ? theme.palette.interaction.selectedBackground
                      : "transparent",
                    color: disabled
                      ? theme.palette.grey[400]
                      : active
                        ? theme.palette.blue.bright
                        : theme.palette.text.primary,
                    fontSize: "0.8125rem",
                    opacity: disabled ? 0.6 : 1,
                    "&:hover:not(:disabled)": {
                      background: theme.palette.action.hover,
                    },
                  }}
                >
                  {active ? (
                    <icons.RadioButtonChecked
                      sx={{
                        fontSize: "1rem",
                        color: theme.palette.blue.bright,
                      }}
                    />
                  ) : (
                    <icons.RadioButtonUnchecked
                      sx={{
                        fontSize: "1rem",
                        color: theme.palette.grey[400],
                      }}
                    />
                  )}
                  {READ_AS_LABEL[opt]}
                </Box>
              )
            })}
          </Box>
          {readAs === "climate_shift" && (
            <>
              <Divider sx={{ borderColor: theme.palette.divider }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  color: theme.palette.grey[700],
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Compared to
              </Typography>
              <Select
                size="small"
                value={deltaMode}
                onChange={handleDeltaModeChange}
                sx={{ ...cellSize, ".MuiSelect-select": { py: 0.5 } }}
              >
                <MenuItem value="vs_historical" sx={cellSize}>
                  historical climate
                </MenuItem>
                <MenuItem value="vs_baseline" sx={cellSize}>
                  a baseline scenario
                </MenuItem>
              </Select>
              {deltaMode === "vs_baseline" && (
                <Select
                  size="small"
                  value={deltaBaselineScenarioId}
                  onChange={handleDeltaBaselineChange}
                  sx={{ ...cellSize, ".MuiSelect-select": { py: 0.5 } }}
                >
                  {scenarioItems.map((s) => (
                    <MenuItem key={s.id} value={s.id} sx={cellSize}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </>
          )}
          {readAs === "distribution" && (
            <>
              <Divider sx={{ borderColor: theme.palette.divider }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  color: theme.palette.grey[700],
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Group dots by
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                <InlineToggleChip
                  label="by scenario"
                  active={distributionMode === "scenario"}
                  onClick={() => setDistributionMode("scenario")}
                />
                <InlineToggleChip
                  label="by location"
                  active={distributionMode === "location"}
                  onClick={() => setDistributionMode("location")}
                />
              </Box>
            </>
          )}
        </PopoverShell>
      </Popover>

      {/* Popover: Scenarios (read-only summary; sidebar is the source) */}
      <Popover
        open={Boolean(scenariosAnchor)}
        anchorEl={scenariosAnchor}
        onClose={() => setScenariosAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="Which scenarios?"
          subtitle={
            scenarioCount === 0
              ? `You haven't picked any in the sidebar, so the chart is showing all ${scenarioTotal}.`
              : `${scenarioCount} of ${scenarioTotal} picked from the sidebar.`
          }
          width={300}
        >
          <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
            Tick or untick scenarios in the sidebar to change what&apos;s on the
            chart. Leave none picked to see them all.
          </Typography>
          {scenarioCount > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                maxHeight: 200,
                overflowY: "auto",
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 0.75,
              }}
            >
              {scenarioItems
                .filter((s) => selectedScenarios.includes(s.id))
                .map((s) => (
                  <Typography
                    key={s.id}
                    variant="caption"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    · {s.label}
                  </Typography>
                ))}
            </Box>
          )}
        </PopoverShell>
      </Popover>

      {/* Popover: Outcomes */}
      <Popover
        open={Boolean(outcomesAnchor)}
        anchorEl={outcomesAnchor}
        onClose={() => setOutcomesAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="Which outcomes?"
          subtitle={`${outcomeCount} of ${outcomeTotal} outcomes are on the chart.`}
          width={320}
        >
          <InlineToggleChip
            label={
              showResilienceOutcomeSelector ? "hide picker" : "pick outcomes…"
            }
            active={showResilienceOutcomeSelector}
            onClick={() =>
              setShowResilienceOutcomeSelector(!showResilienceOutcomeSelector)
            }
          />
          {view === "outcome" && (
            <>
              <Divider sx={{ borderColor: theme.palette.divider }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  color: theme.palette.grey[700],
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Main outcome
              </Typography>
              <Select
                size="small"
                value={primaryOutcomeCode ?? ""}
                onChange={handlePrimaryOutcomeChange}
                displayEmpty
                sx={{ ...cellSize, ".MuiSelect-select": { py: 0.5 } }}
              >
                <MenuItem value="" sx={cellSize}>
                  Pick a main outcome
                </MenuItem>
                {aggregateOutcomeItems.map((o) => (
                  <MenuItem key={o.code} value={o.code} sx={cellSize}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
              {primaryOutcomeCode && (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.7rem",
                      color: theme.palette.grey[700],
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mt: 0.5,
                    }}
                  >
                    Compare with
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.25,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {aggregateOutcomeItems
                      .filter((o) => o.code !== primaryOutcomeCode)
                      .map((o) => {
                        const active = compareOutcomeCodes.includes(o.code)
                        return (
                          <Box
                            key={o.code}
                            component="button"
                            type="button"
                            onClick={() => toggleCompareOutcome(o.code)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              px: 0.5,
                              py: 0.375,
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              background: "transparent",
                              color: theme.palette.text.primary,
                              fontSize: "0.8125rem",
                              textAlign: "left",
                              "&:hover": {
                                background: theme.palette.action.hover,
                              },
                            }}
                          >
                            {active ? (
                              <icons.CheckCircle
                                sx={{
                                  fontSize: "1rem",
                                  color: theme.palette.blue.bright,
                                }}
                              />
                            ) : (
                              <icons.RadioButtonUnchecked
                                sx={{
                                  fontSize: "1rem",
                                  color: theme.palette.grey[400],
                                }}
                              />
                            )}
                            {o.label}
                          </Box>
                        )
                      })}
                  </Box>
                </>
              )}
            </>
          )}
        </PopoverShell>
      </Popover>

      {/* Popover: Climates (hydroclimates) */}
      <Popover
        open={Boolean(climatesAnchor)}
        anchorEl={climatesAnchor}
        onClose={() => setClimatesAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="Which climate futures?"
          subtitle={`${selectedHydroclimates.size} of ${RESILIENCE_HYDROCLIMATES.length} climate futures on the chart.`}
          width={280}
        >
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
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
        </PopoverShell>
      </Popover>

      {/* Popover: Pivot (heatmap layout) */}
      <Popover
        open={Boolean(pivotAnchor)}
        anchorEl={pivotAnchor}
        onClose={() => setPivotAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="What the chart is organized by"
          subtitle="Pick the dimension the chart pivots on. Each non-aggregate pivot renders as small multiples, one tile per item; aggregate collapses the dimension into a mean."
          width={320}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {PIVOT_ORDER.map((mode) => {
              const active = view === mode
              return (
                <Box
                  key={mode}
                  component="button"
                  type="button"
                  onClick={() => handleViewChange(mode)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 0.75,
                    py: 0.5,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    textAlign: "left",
                    background: active
                      ? theme.palette.interaction.selectedBackground
                      : "transparent",
                    color: active
                      ? theme.palette.blue.bright
                      : theme.palette.text.primary,
                    fontSize: "0.8125rem",
                    "&:hover": {
                      background: theme.palette.action.hover,
                    },
                  }}
                >
                  {active ? (
                    <icons.RadioButtonChecked
                      sx={{
                        fontSize: "1rem",
                        color: theme.palette.blue.bright,
                      }}
                    />
                  ) : (
                    <icons.RadioButtonUnchecked
                      sx={{
                        fontSize: "1rem",
                        color: theme.palette.grey[400],
                      }}
                    />
                  )}
                  {PIVOT_LABEL[mode]}
                </Box>
              )
            })}
          </Box>
          {isAggregate && (
            <>
              <Divider sx={{ borderColor: theme.palette.divider }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  color: theme.palette.grey[700],
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Average across
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {AGGREGATE_OVER_ORDER.map((axis) => (
                  <InlineToggleChip
                    key={axis}
                    label={AGGREGATE_OVER_LABEL[axis]}
                    active={aggregateOver === axis}
                    onClick={() => handleAggregateOverChange(axis)}
                  />
                ))}
              </Box>
            </>
          )}
        </PopoverShell>
      </Popover>

    </Box>
  )
}
