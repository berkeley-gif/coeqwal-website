"use client"

/**
 * ResilienceControls - sentence-style header for the resilience heatmap.
 *
 * The control surface is a single one-line sentence:
 *
 *   "{Pivot}, comparing {axes}, covering {scenarios}, {outcomes}, and
 *    {climates}, as average tier."   [Options]
 *
 * The leading phrase is the pivot (biggest lever on chart shape). The
 * following phrases narrow down the axes and scope. Cells are always
 * colored by average tier. That trailing clause is static text rather
 * than a chooser
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
import { InlineToggleChip } from "../../chrome/chips/InlineToggleChip"
import { RESILIENCE_SALIENT_PRESETS } from "./resiliencePresetDefs"
import { useScenarioExplorerStore } from "../../../store"
import type {
  AggregateOver,
  QuadrantUnit,
  ResilienceControlsState,
  ResilienceView,
} from "./ResiliencePanel"
import {
  type ResilienceHydroclimate,
  RESILIENCE_HYDROCLIMATES,
} from "./useResilienceMatrix"
import {
  ALL_RADAR_AXES_ORDER,
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  getOutcomeName,
  type OutcomeCode,
} from "../../../../../content/outcomes"
import {
  hydroclimateOptions,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../content/scenarios"
import { useScenarioList } from "../../../../scenarios/hooks/useScenarioList"

interface ResilienceControlsProps {
  controls: ResilienceControlsState
  onChange: (next: Partial<ResilienceControlsState>) => void
  /** Called when the user clicks the Save snapshot button in the
   *  Rows row. When omitted the button is not rendered. */
  onSaveSnapshot?: () => void
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

// The sentence used to end with a "read as" phrase button that let the
// user swap between average tier, climate shift, spread of results,
// and leverage encodings. That chooser was removed in favor of a
// single, static "average tier" clause. The tool is now focused on
// the tier story end-to-end. The CellEncoding / DeltaMode fields
// remain in state (see `ResiliencePanel`) so presets and the viz
// layer keep working, but there is no longer any UI that sets them
// to anything other than `tier` / `none`. A migration effect below
// coerces legacy or imported state back to those defaults.

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
// Stored state still uses (view, aggregateOver, transposed). The
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

function deriveXY(zDim: ZDim, transposed: boolean): { xDim: ZDim; yDim: ZDim } {
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
}: PhraseButtonProps) {
  const theme = useTheme()
  return (
    <Box
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
  onSaveSnapshot,
}: ResilienceControlsProps) {
  const theme = useTheme()
  const { siblingGroups } = useScenarioList()

  const {
    view,
    cellEncoding,
    deltaMode,
    selectedHydroclimates,
    quadrantUnit,
    quadrantOutcome,
    primaryOutcomeCode,
    compareOutcomeCodes,
    aggregateOver,
    transposed,
    reorderBySimilarity,
    showCellNumbers,
  } = controls

  const selectedScenarios = useScenarioExplorerStore((s) => s.selectedScenarios)

  // Pin the sentence to "average tier" end-to-end: any non-tier
  // encoding (legacy density modes, distribution, leverage, glyph)
  // or any non-none delta mode is coerced back to the default. This
  // replaces the old chooser migrations and covers URL / preset /
  // import paths that predate the simplification.
  useEffect(() => {
    const enc = cellEncoding as string
    const needsReset = enc !== "tier" || deltaMode !== "none"
    if (needsReset) {
      onChange({ cellEncoding: "tier", deltaMode: "none" })
    }
  }, [cellEncoding, deltaMode, onChange])

  const showResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.showResilienceOutcomeSelector,
  )
  const setShowResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.setShowResilienceOutcomeSelector,
  )
  const resilienceVisibleOutcomes = useScenarioExplorerStore(
    (s) => s.resilienceVisibleOutcomes,
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
      onChange({ view: next })
    },
    [view, onChange],
  )

  // Derive the current (xDim, yDim, zDim, zMode) from stored state.
  // Only meaningful for the heatmap views. The quadrant branch
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
      // already match our desired X? If yes, no transpose. If no,
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

  const [scenariosAnchor, setScenariosAnchor] = useState<HTMLElement | null>(
    null,
  )
  const [outcomesAnchor, setOutcomesAnchor] = useState<HTMLElement | null>(null)
  const [climatesAnchor, setClimatesAnchor] = useState<HTMLElement | null>(null)
  const [xAnchor, setXAnchor] = useState<HTMLElement | null>(null)
  const [yAnchor, setYAnchor] = useState<HTMLElement | null>(null)
  const [zAnchor, setZAnchor] = useState<HTMLElement | null>(null)

  const isQuadrant = view === "quadrant"

  // --------------------------------------------------------------
  // Sentence phrase labels
  // --------------------------------------------------------------

  const scenarioCount = selectedScenarios.length
  const scenarioTotal = scenarioItems.length
  const scenariosLabel =
    scenarioCount === 0
      ? `all ${scenarioTotal} scenarios`
      : scenarioCount === 1
        ? "1 scenario"
        : `${scenarioCount} of ${scenarioTotal} scenarios`
  const outcomeCount = resilienceVisibleOutcomes.length
  const outcomeTotal = ALL_RADAR_AXES_ORDER.length
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
          />
          <Box
            component="span"
            sx={{ color: theme.palette.grey[700], mx: 0.25 }}
          >
            comparing
          </Box>
          <PhraseButton
            label={xDimLabel}
            active={Boolean(xAnchor)}
            onClick={(e) => setXAnchor(e.currentTarget)}
            ariaLabel={`Across axis: ${xDimLabel}. Click to change which dimension reads across each chart.`}
          />
          <Box
            component="span"
            sx={{ color: theme.palette.grey[700], mx: 0.25 }}
          >
            across
          </Box>
          <PhraseButton
            label={yDimLabel}
            active={Boolean(yAnchor)}
            onClick={(e) => setYAnchor(e.currentTarget)}
            ariaLabel={`Down axis: ${yDimLabel}. Click to change which dimension reads down each chart.`}
          />
          <Box
            component="span"
            sx={{ color: theme.palette.grey[700], mx: 0.25 }}
          >
            covering
          </Box>
          <PhraseButton
            label={scenariosLabel}
            active={Boolean(scenariosAnchor)}
            onClick={(e) => setScenariosAnchor(e.currentTarget)}
            ariaLabel={`Scenarios on the chart: ${scenariosLabel}. Click for details.`}
          />
          <Box
            component="span"
            sx={{ color: theme.palette.grey[500], mx: 0.25 }}
          ></Box>
          <PhraseButton
            label={outcomesLabel}
            active={Boolean(outcomesAnchor)}
            onClick={(e) => setOutcomesAnchor(e.currentTarget)}
            ariaLabel={`Outcomes on the chart: ${outcomesLabel}. Click to change.`}
          />
          <Box
            component="span"
            sx={{ color: theme.palette.grey[700], mx: 0.25 }}
          >
            and
          </Box>
          <PhraseButton
            label={climatesLabel}
            active={Boolean(climatesAnchor)}
            onClick={(e) => setClimatesAnchor(e.currentTarget)}
            ariaLabel={`Hydroclimates on the chart: ${climatesLabel}. Click to change.`}
          />
          <Box component="span" sx={{ color: theme.palette.grey[700] }}>
            as average tier.
          </Box>
        </Typography>
      </Box>

      <Box
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
          onClick={() =>
            onChange({ reorderBySimilarity: !reorderBySimilarity })
          }
          ariaLabel={
            reorderBySimilarity
              ? "Row order: similar scenarios grouped. Click to use default order."
              : "Row order: default. Click to group similar scenarios together."
          }
        />
        <InlineToggleChip
          label="Show cell values"
          active={showCellNumbers}
          onClick={() => onChange({ showCellNumbers: !showCellNumbers })}
          ariaLabel={
            showCellNumbers
              ? "Cell values: shown. Click to hide the tier numbers inside cells."
              : "Cell values: hidden. Click to show the tier number inside each cell."
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
        {onSaveSnapshot && (
          <Box
            component="button"
            type="button"
            onClick={onSaveSnapshot}
            aria-label="save snapshot"
            sx={{
              ml: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              px: 1.25,
              py: 0.5,
              border: "none",
              borderRadius: "12px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              color: theme.palette.grey[800],
              background: theme.palette.grey[200],
              cursor: "pointer",
              transition: "all 150ms ease",
              "&:hover": {
                background: theme.palette.interaction.selectedBackground,
                color: theme.palette.blue.bright,
              },
            }}
          >
            <icons.IosShare sx={{ fontSize: "1.25rem", flexShrink: 0 }} />
            save snapshot
          </Box>
        )}
      </Box>

      {/* Popover: Scenarios (read-only summary. Sidebar is the source) */}
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
          subtitle="Pick the dimension that reads across each chart. Picking the down-axis dimension swaps the two axes. Picking the pivot dimension rotates it into the across role."
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
          subtitle="Pick the dimension that reads down each chart. Picking the across-axis dimension swaps the two axes. Picking the pivot dimension rotates it into the down role."
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
              the aggregate across the whole library. Pick a scenario to see one
              chart per scenario.
            </Typography>
          )}
        </PopoverShell>
      </Popover>
    </Box>
  )
}
