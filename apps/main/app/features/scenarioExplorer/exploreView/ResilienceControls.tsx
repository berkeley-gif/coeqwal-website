"use client"

/**
 * ResilienceControls - sentence-style header for the resilience heatmap.
 *
 * The control surface is a single one-line sentence:
 *
 *   "Comparing {axes}, {pivot}, covering {scenarios}, {outcomes}, and
 *    {climates} as {encoding}."   [Options]
 *
 * The phrases run from broad (what the chart pivots on) to narrow
 * (what cell colors mean), so a new user reads the sentence in the
 * same order they would make decisions. Wording avoids data jargon
 * (no "aggregate", "mean", "read as", "x" / cross-product); terms of
 * art that the project already defines in its glossary (scenario,
 * outcome, hydroclimate, tier) are kept as-is.
 *
 * Layout is not a user choice: non-aggregate pivots always render as
 * small multiples, and the aggregate pivot is always a single
 * averaged chart. This was a deliberate simplification - "combine
 * into one chart" was visually indistinguishable from small multiples
 * placed side-by-side once you accounted for the shared row axis, so
 * we removed it as a choice.
 *
 * Each bold phrase is a click-target that opens a focused popover for
 * that dimension. Under the sentence: Presets, then Rows (group similar
 * and flip axes). The chart corner toolbar only has display options
 * (see `ResiliencePanel`).
 *
 * Quadrant / Leverage retains its own compact two-card control set
 * because its mental model differs from the 3-axis cube.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Popover,
  Select,
  type SelectChangeEvent,
  Tooltip,
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import type { Theme } from "@repo/ui/mui"
import { InlineToggleChip } from "../components/InlineToggleChip"
import { RESILIENCE_SALIENT_PRESETS } from "./resiliencePresetDefs"
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

// Labels for the quadrant toolbar's tab row, which still lets the
// user switch between the four top-level modes (the three heatmap
// pivots and the aggregate). The sentence header for the heatmap
// branch uses the X / Y / Z pills instead.
const PIVOT_LABEL: Record<ResilienceView, string> = {
  scenario: "one chart per scenario",
  outcome: "one chart per outcome",
  hydroclimate: "one chart per hydroclimate",
  aggregate: "a single aggregate chart",
  quadrant: "leverage",
}

const PIVOT_ORDER: readonly ResilienceView[] = [
  "scenario",
  "outcome",
  "hydroclimate",
  "aggregate",
]

/**
 * Virtual "Read as" enum. Combines cellEncoding + deltaMode into a
 * single user-facing read mode.
 */
type ReadAs =
  | "mean_tier"
  | "climate_shift"
  | "distribution"
  | "operational_leverage"

const READ_AS_LABEL: Record<ReadAs, string> = {
  mean_tier: "average tier",
  climate_shift: "change vs. historical",
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
  if (enc === "density_opp") return "mean_tier"
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
  "operational_leverage",
]

/**
 * Gate options that don't compose with the current pivot /
 * aggregation. Leverage needs the underlying scenario by hydroclimate
 * cube; it is only coherent in aggregate. Climate shift
 * needs a historical HC column, so it's disabled when aggregating over
 * hydroclimates.
 */
function isReadAsOptionDisabled(
  opt: ReadAs,
  view: ResilienceView,
  aggregateOver: AggregateOver,
): boolean {
  if (opt === "operational_leverage" && view !== "aggregate") {
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

// ------------------------------------------------------------------
// Z-role adapter
//
// The sentence header exposes the chart as a permutation of the
// three dimensions (scenario, outcome, hydroclimate) across three
// roles:
//
//   - Across (X)  the cell grid's horizontal axis
//   - Down   (Y)  the cell grid's vertical axis
//   - Third  (Z)  the dimension that is either faceted out into
//                 small multiples, or collapsed into a single
//                 averaged chart
//
// Stored state still uses (view, aggregateOver, transposed); the
// adapter translates between the two framings. X and Y are derived
// from Z via a canonical table plus the `transposed` flip.
//
// The mapping from (view, aggregateOver) to (zDim, zMode) is 1:1
// across every non-quadrant configuration, and the canonical X/Y
// assignment below matches today's rendering, so this is purely a
// relabeling at the control surface - no chart geometry changes.
// ------------------------------------------------------------------

type ZDim = "scenario" | "outcome" | "hydroclimate"
type ZMode = "facet" | "aggregate"

const ALL_DIMS: readonly ZDim[] = ["scenario", "outcome", "hydroclimate"]

const DIM_LABEL_SINGULAR: Record<ZDim, string> = {
  scenario: "scenario",
  outcome: "outcome",
  hydroclimate: "hydroclimate",
}
const DIM_LABEL_PLURAL: Record<ZDim, string> = {
  scenario: "scenarios",
  outcome: "outcomes",
  hydroclimate: "hydroclimates",
}

const AGGREGATE_OVER_TO_ZDIM: Record<AggregateOver, ZDim> = {
  scenarios: "scenario",
  outcomes: "outcome",
  hydroclimates: "hydroclimate",
}
const ZDIM_TO_AGGREGATE_OVER: Record<ZDim, AggregateOver> = {
  scenario: "scenarios",
  outcome: "outcomes",
  hydroclimate: "hydroclimates",
}

function deriveZ(
  view: ResilienceView,
  aggregateOver: AggregateOver,
): { zDim: ZDim; zMode: ZMode } {
  if (view === "aggregate") {
    return { zDim: AGGREGATE_OVER_TO_ZDIM[aggregateOver], zMode: "aggregate" }
  }
  // For heatmap views the view id itself is the Z dim. `quadrant`
  // is handled separately by the caller and never reaches here.
  return { zDim: view as ZDim, zMode: "facet" }
}

function writeZ(zDim: ZDim, zMode: ZMode): Partial<ResilienceControlsState> {
  if (zMode === "aggregate") {
    return {
      view: "aggregate",
      aggregateOver: ZDIM_TO_AGGREGATE_OVER[zDim],
    }
  }
  return { view: zDim }
}

// Canonical axis assignment for each choice of Z. Matches today's
// rendering across both facet and aggregate paths, so switching the
// sentence-model framing is a pure relabel. `transposed` flips X
// and Y at render time.
const CANONICAL_X_FOR_Z: Record<ZDim, ZDim> = {
  scenario: "hydroclimate",
  outcome: "hydroclimate",
  hydroclimate: "scenario",
}
const CANONICAL_Y_FOR_Z: Record<ZDim, ZDim> = {
  scenario: "outcome",
  outcome: "scenario",
  hydroclimate: "outcome",
}

function deriveXY(
  zDim: ZDim,
  transposed: boolean,
): { xDim: ZDim; yDim: ZDim } {
  const cx = CANONICAL_X_FOR_Z[zDim]
  const cy = CANONICAL_Y_FOR_Z[zDim]
  return transposed ? { xDim: cy, yDim: cx } : { xDim: cx, yDim: cy }
}

/**
 * Build a patch that sets (zDim, zMode) and applies the same
 * cross-field guards the pre-refactor `handleViewChange` /
 * `handleAggregateOverChange` enforced: demote aggregate-only
 * encodings when leaving aggregate, clear leverage when aggregating
 * over outcomes, and clear delta when aggregating over
 * hydroclimates (the historical column disappears).
 */
function applyZPatch(
  zDim: ZDim,
  zMode: ZMode,
  current: ResilienceControlsState,
  extra: Partial<ResilienceControlsState> = {},
): Partial<ResilienceControlsState> {
  const patch: Partial<ResilienceControlsState> = {
    ...writeZ(zDim, zMode),
    ...extra,
  }
  const nextView = patch.view ?? current.view
  const nextAgg = patch.aggregateOver ?? current.aggregateOver
  const enc = current.cellEncoding

  if (nextView !== "aggregate" && (enc === "glyph" || enc === "leverage")) {
    patch.cellEncoding = "tier"
  }
  if (nextAgg === "outcomes" && enc === "leverage") {
    patch.cellEncoding = "tier"
  }
  if (nextAgg === "hydroclimates" && current.deltaMode !== "none") {
    patch.deltaMode = "none"
  }
  return patch
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
// Radio-row option (shared by X / Y / Z popovers)
// --------------------------------------------------------------------

interface RadioRowProps {
  active: boolean
  disabled?: boolean
  label: React.ReactNode
  onClick: () => void
}

function RadioRow({ active, disabled = false, label, onClick }: RadioRowProps) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
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
          sx={{ fontSize: "1rem", color: theme.palette.blue.bright }}
        />
      ) : (
        <icons.RadioButtonUnchecked
          sx={{ fontSize: "1rem", color: theme.palette.grey[400] }}
        />
      )}
      {label}
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
    transposed,
    reorderBySimilarity,
  } = controls

  const selectedScenarios = useScenarioExplorerStore((s) => s.selectedScenarios)

  // Tour anchors for the sentence phrases. Each anchor attaches
  // directly to the phrase's <button>, so the tour highlight lands on
  // the clickable word rather than a wrapper.
  const pivotAnchorRef = useTourAnchor("resilience.pivot")
  const axesAnchorRef = useTourAnchor("resilience.axes")
  const outcomesAnchorRef = useTourAnchor("resilience.outcomes")
  const encodingAnchorRef = useTourAnchor("resilience.encoding")
  // The preset row and the row-options row each get their own tour
  // anchor so the walkthrough can point to them after the sentence.
  const presetsAnchorRef = useTourAnchor("resilience.presets")
  const rowsAnchorRef = useTourAnchor("resilience.rows")

  useEffect(() => {
    const enc = cellEncoding as string
    if (enc === "density_opp" || enc === "density_risk") {
      onChange({ cellEncoding: "tier", deltaMode: "none" })
    }
  }, [cellEncoding, onChange])

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
        (cellEncoding === "glyph" || cellEncoding === "leverage")
      ) {
        patch.cellEncoding = "tier"
      }
      onChange(patch)
    },
    [view, cellEncoding, onChange],
  )

  // Derive the current (xDim, yDim, zDim, zMode) from stored state.
  // Only meaningful for the heatmap views; the quadrant branch
  // returns early above the sentence header, so it never reads these.
  const { zDim, zMode } = useMemo(
    () => deriveZ(view, aggregateOver),
    [view, aggregateOver],
  )
  const { xDim, yDim } = useMemo(
    () => deriveXY(zDim, transposed),
    [zDim, transposed],
  )

  // Z-role handlers. Writes flow back via applyZPatch which keeps
  // the stored (view, aggregateOver) in sync with the user-facing
  // (zDim, zMode) model and applies the same cross-field encoding
  // guards as the pre-refactor view/aggregateOver setters.
  const handleZPick = useCallback(
    (nextDim: ZDim, nextMode?: ZMode) => {
      const mode = nextMode ?? zMode
      if (nextDim === zDim && mode === zMode) return
      // Only reset transposed when the Z dim actually changes, because
      // the canonical X/Y pair changes with it and the user's previous
      // transpose intent no longer refers to the same axes.
      const extra: Partial<ResilienceControlsState> =
        nextDim === zDim ? {} : { transposed: false }
      onChange(applyZPatch(nextDim, mode, controls, extra))
    },
    [controls, onChange, zDim, zMode],
  )

  const handleZModeChange = useCallback(
    (nextMode: ZMode) => {
      if (nextMode === zMode) return
      onChange(applyZPatch(zDim, nextMode, controls))
    },
    [controls, onChange, zDim, zMode],
  )

  // Clicking a dim in the X pill has three meaningful outcomes:
  //   - picking the current X: no-op
  //   - picking the current Y: transpose (swap X and Y)
  //   - picking the current Z: promote Z into X, demote X into Z,
  //     preserving Y. `transposed` is set so that canonical(newZ)
  //     lands the user's picked dim on X and the current Y on Y.
  const handleXPick = useCallback(
    (nextDim: ZDim) => {
      if (nextDim === xDim) return
      if (nextDim === yDim) {
        onChange({ transposed: !transposed })
        return
      }
      const newZ = xDim
      const needsTranspose = CANONICAL_X_FOR_Z[newZ] !== nextDim
      onChange(
        applyZPatch(newZ, zMode, controls, { transposed: needsTranspose }),
      )
    },
    [controls, onChange, xDim, yDim, zMode, transposed],
  )

  // Mirror of handleXPick for the Y pill.
  const handleYPick = useCallback(
    (nextDim: ZDim) => {
      if (nextDim === yDim) return
      if (nextDim === xDim) {
        onChange({ transposed: !transposed })
        return
      }
      const newZ = yDim
      // We want the current X to remain the X after rotation. The
      // needsTranspose test asks: does the canonical X for the new Z
      // already match our desired X? If yes, no transpose; if no,
      // transpose.
      const needsTranspose = CANONICAL_X_FOR_Z[newZ] !== xDim
      onChange(
        applyZPatch(newZ, zMode, controls, { transposed: needsTranspose }),
      )
    },
    [controls, onChange, xDim, yDim, zMode, transposed],
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
  const [xAnchor, setXAnchor] = useState<HTMLElement | null>(null)
  const [yAnchor, setYAnchor] = useState<HTMLElement | null>(null)
  const [zAnchor, setZAnchor] = useState<HTMLElement | null>(null)

  const isQuadrant = view === "quadrant"
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
    ? "all hydroclimates"
    : selectedHydroclimates.size === 1
      ? "1 hydroclimate"
      : `${selectedHydroclimates.size} of ${RESILIENCE_HYDROCLIMATES.length} hydroclimates`

  // When the user hasn't picked any scenarios and Z is set to facet
  // over scenarios, the panel silently falls back to an aggregate
  // across the library (otherwise there are no tiles to render). We
  // mirror that effective behavior in the sentence label and Z
  // popover so the user sees the chart they're actually getting
  // rather than the literal stored (zMode = facet) state.
  const zEffectivelyAggregate =
    zMode === "facet" && zDim === "scenario" && scenarioCount === 0
  const zDisplayMode: ZMode = zEffectivelyAggregate ? "aggregate" : zMode

  const xDimLabel = DIM_LABEL_PLURAL[xDim]
  const yDimLabel = DIM_LABEL_PLURAL[yDim]
  const zPhraseLabel =
    zDisplayMode === "facet"
      ? `for each ${DIM_LABEL_SINGULAR[zDim]}`
      : `averaged over ${DIM_LABEL_PLURAL[zDim]}`
  // The pivot phrase leads the sentence now, so render it with a
  // capitalized first letter. Keep `zPhraseLabel` itself lowercase
  // because aria-labels, tooltips, and tour copy use it mid-sentence.
  const zPhraseLabelLeading =
    zPhraseLabel.length > 0
      ? zPhraseLabel.charAt(0).toUpperCase() + zPhraseLabel.slice(1)
      : zPhraseLabel

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
        flexDirection: "column",
        gap: 0.75,
        py: 0.5,
        flex: 1,
        minWidth: 0,
        alignSelf: "stretch",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
          width: "100%",
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
        <PhraseButton
          label={zPhraseLabelLeading}
          active={Boolean(zAnchor)}
          onClick={(e) => setZAnchor(e.currentTarget)}
          ariaLabel={`Chart pivot: ${zPhraseLabel}. This is the biggest lever on the chart. Click to change the dimension the chart is built around and whether it shows small multiples or a single averaged chart.`}
          tourAnchorRef={pivotAnchorRef}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700], mx: 0.25 }}>
          , comparing
        </Box>
        <PhraseButton
          label={xDimLabel}
          active={Boolean(xAnchor)}
          onClick={(e) => setXAnchor(e.currentTarget)}
          ariaLabel={`Across axis: ${xDimLabel}. Click to change which dimension reads across each chart.`}
          tourAnchorRef={axesAnchorRef}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700], mx: 0.25 }}>
          across
        </Box>
        <PhraseButton
          label={yDimLabel}
          active={Boolean(yAnchor)}
          onClick={(e) => setYAnchor(e.currentTarget)}
          ariaLabel={`Down axis: ${yDimLabel}. Click to change which dimension reads down each chart.`}
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
          ariaLabel={`Hydroclimates on the chart: ${climatesLabel}. Click to change.`}
        />
        <Box component="span" sx={{ color: theme.palette.grey[700], mx: 0.25 }}>
          , as{" "}
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
      </Box>

      <Box
        ref={presetsAnchorRef}
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
          rowGap: 0.5,
          pl: 0,
        }}
      >
        <Typography
          variant="compactCaption"
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: theme.palette.grey[600],
            flexShrink: 0,
            mr: 0.25,
          }}
        >
          Presets
        </Typography>
        {RESILIENCE_SALIENT_PRESETS.map((preset) => (
          <Tooltip key={preset.id} title={preset.description} placement="top">
            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => onChange(preset.getPatch(controls))}
              aria-label={`${preset.label}. ${preset.description}`}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 500,
                lineHeight: 1.2,
                py: 0.35,
                px: 1,
                minHeight: 30,
                borderColor: theme.palette.grey[300],
                color: theme.palette.grey[800],
                backgroundColor: theme.palette.common.white,
                boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                "&:hover": {
                  borderColor: theme.palette.grey[400],
                  backgroundColor: theme.palette.grey[50],
                },
              }}
            >
              {preset.label}
            </Button>
          </Tooltip>
        ))}
      </Box>

      <Box
        ref={rowsAnchorRef}
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
        }}
      >
        <Typography
          variant="compactCaption"
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: theme.palette.grey[600],
            flexShrink: 0,
            mr: 0.25,
          }}
        >
          Rows
        </Typography>
        <InlineToggleChip
          label="Group similar rows"
          active={reorderBySimilarity}
          onClick={() => onChange({ reorderBySimilarity: !reorderBySimilarity })}
          ariaLabel={
            reorderBySimilarity
              ? "Row order: similar scenarios grouped. Click to use default order."
              : "Row order: default. Click to group similar scenarios together."
          }
        />
        <Button
          type="button"
          size="small"
          variant="outlined"
          onClick={() => onChange({ transposed: !transposed })}
          aria-pressed={transposed}
          aria-label={
            transposed
              ? "Rows and columns switched. Click to use the default row and column layout."
              : "Switch which dimension runs down the rows versus across the columns."
          }
          sx={{
            ml: 0.25,
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.2,
            py: 0.35,
            px: 1,
            minHeight: 30,
            borderColor: transposed
              ? theme.palette.blue.bright
              : theme.palette.grey[300],
            color: transposed
              ? theme.palette.blue.bright
              : theme.palette.grey[800],
            backgroundColor: transposed
              ? theme.palette.interaction.selectedBackground
              : theme.palette.common.white,
            boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
            "&:hover": {
              borderColor: transposed
                ? theme.palette.blue.dark
                : theme.palette.grey[400],
              backgroundColor: transposed
                ? theme.palette.interaction.selectedBackground
                : theme.palette.grey[50],
            },
          }}
        >
          Switch rows and columns
        </Button>
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
          title="Which hydroclimates?"
          subtitle={`${selectedHydroclimates.size} of ${RESILIENCE_HYDROCLIMATES.length} hydroclimates on the chart.`}
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

      {/* Popover: X dim (Across axis) */}
      <Popover
        open={Boolean(xAnchor)}
        anchorEl={xAnchor}
        onClose={() => setXAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="Across axis"
          subtitle="Pick the dimension that reads across each chart. Picking the down-axis dimension swaps the two axes; picking the pivot dimension rotates it into the across role."
          width={300}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {ALL_DIMS.map((dim) => (
              <RadioRow
                key={dim}
                active={xDim === dim}
                label={DIM_LABEL_PLURAL[dim]}
                onClick={() => {
                  handleXPick(dim)
                  setXAnchor(null)
                }}
              />
            ))}
          </Box>
        </PopoverShell>
      </Popover>

      {/* Popover: Y dim (Down axis) */}
      <Popover
        open={Boolean(yAnchor)}
        anchorEl={yAnchor}
        onClose={() => setYAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="Down axis"
          subtitle="Pick the dimension that reads down each chart. Picking the across-axis dimension swaps the two axes; picking the pivot dimension rotates it into the down role."
          width={300}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {ALL_DIMS.map((dim) => (
              <RadioRow
                key={dim}
                active={yDim === dim}
                label={DIM_LABEL_PLURAL[dim]}
                onClick={() => {
                  handleYPick(dim)
                  setYAnchor(null)
                }}
              />
            ))}
          </Box>
        </PopoverShell>
      </Popover>

      {/* Popover: Z dim + mode (the "third" role) */}
      <Popover
        open={Boolean(zAnchor)}
        anchorEl={zAnchor}
        onClose={() => setZAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <PopoverShell
          title="What the chart is built around"
          subtitle="Pick the dimension the chart is arranged around, and whether it shows one tile per item or a single averaged chart."
          width={340}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.7rem",
              color: theme.palette.grey[700],
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Arrange by
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {ALL_DIMS.map((dim) => (
              <RadioRow
                key={dim}
                active={zDim === dim}
                label={DIM_LABEL_PLURAL[dim]}
                onClick={() => handleZPick(dim)}
              />
            ))}
          </Box>
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
            Show as
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            <RadioRow
              active={zDisplayMode === "facet"}
              label={`small multiples, one chart per ${DIM_LABEL_SINGULAR[zDim]}`}
              onClick={() => handleZModeChange("facet")}
            />
            <RadioRow
              active={zDisplayMode === "aggregate"}
              label={`a single chart, averaged across ${DIM_LABEL_PLURAL[zDim]}`}
              onClick={() => handleZModeChange("aggregate")}
            />
          </Box>
          {zEffectivelyAggregate && (
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.72rem",
                color: theme.palette.grey[600],
                lineHeight: 1.35,
                mt: 0.25,
              }}
            >
              No scenarios are picked in the sidebar, so the chart is showing
              the aggregate across the whole library. Pick a scenario to see
              one chart per scenario.
            </Typography>
          )}
        </PopoverShell>
      </Popover>

    </Box>
  )
}
