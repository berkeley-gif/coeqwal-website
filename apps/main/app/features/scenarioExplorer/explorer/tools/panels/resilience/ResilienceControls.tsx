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
 * colored by average tier. That trailing clause is static text.
 *
 * Writes go through controls/ (read → plan → write). See controls/index.ts.
 * Presentational primitives (PhraseButton, PopoverShell, RadioRow) live
 * in ./ResilienceControlsParts.
 *
 * CONTENTS (in source order)
 * --------------------------
 *  1. Store + writer reads   slice fields via useResilienceControlsWriter.
 *  2. Derived items          scenario/outcome option lists, pivot + axes.
 *  3. Handlers               pivot / X / Y / hydroclimate / outcome changes.
 *  4. Popover anchor state   one anchor per sentence phrase.
 *  5. Render                 the sentence + per-phrase PopoverShell popovers.
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
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { HoverTip } from "@repo/ui"
import { SaveSnapshotButton } from "../../chrome/actions/SaveSnapshotButton"
import { InlineToggleChip } from "../../chrome/chips/InlineToggleChip"
import { PhraseButton, PopoverShell, RadioRow } from "./ResilienceControlsParts"
import { RESILIENCE_SALIENT_PRESETS } from "./resiliencePresetDefs"
import { useWorkspaceSlice, useResilienceSlice } from "../../../store"
import { useResilienceControlsWriter } from "./useResilienceControlsWriter"
import {
  ALL_PIVOT_DIMS,
  CANONICAL_X_FOR_PIVOT,
  derivePivotFromStore,
  deriveSentenceAxes,
  planPivotPatch,
  PIVOT_DIM_LABEL_PLURAL,
  PIVOT_DIM_LABEL_SINGULAR,
  type PivotDim,
  type PivotMode,
} from "./controls"
import type { ResilienceControlsState } from "../../../store"
import {
  type ResilienceHydroclimate,
  RESILIENCE_HYDROCLIMATES,
} from "./useResilienceMatrix"
import {
  ALL_RADAR_AXES_ORDER,
  OUTCOME_CODE_ORDER,
  getOutcomeName,
} from "../../../../../../content/outcomes"
import {
  hydroclimateOptions,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../../content/scenarios"
import { useScenarioList } from "../../../../../scenarios/hooks/useScenarioList"

interface ResilienceControlsProps {
  /** Called when the user clicks the Save snapshot button in the
   *  Rows row. When omitted the button is not rendered. */
  onSaveSnapshot?: () => void
}

// The sentence used to end with a "read as" phrase button that let the
// user swap between average tier, climate shift, spread of results,
// and leverage encodings. That chooser was removed in favor of a
// single, static "average tier" clause. The tool is now focused on
// the tier story end-to-end. The CellEncoding / DeltaMode fields
// remain in state (see `ResiliencePanel`) so presets and the viz
// layer keep working, but there is no longer any UI that sets them
// to anything other than `tier` / `none`. A migration effect below
// coerces legacy or imported state back to those defaults.

// --------------------------------------------------------------------
// ResilienceControls
// --------------------------------------------------------------------

export default function ResilienceControls({
  onSaveSnapshot,
}: ResilienceControlsProps) {
  const theme = useTheme()
  const { siblingGroups } = useScenarioList()

  const {
    view,
    cellEncoding,
    deltaMode,
    selectedHydroclimates,
    primaryOutcomeCode,
    compareOutcomeCodes,
    aggregateOver,
    transposed,
    reorderBySimilarity,
    showCellNumbers,
    controlsSnapshot,
    writeChange,
  } = useResilienceControlsWriter()

  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)

  // Pin the sentence to "average tier" end-to-end: any non-tier
  // encoding (legacy density modes, distribution, leverage, glyph)
  // or any non-none delta mode is coerced back to the default. This
  // replaces the old chooser migrations and covers URL / preset /
  // import paths that predate the simplification.
  useEffect(() => {
    const enc = cellEncoding as string
    const needsReset = enc !== "tier" || deltaMode !== "none"
    if (needsReset) {
      writeChange({ cellEncoding: "tier", deltaMode: "none" })
    }
  }, [cellEncoding, deltaMode, writeChange])

  const {
    showResilienceOutcomeSelector,
    setShowResilienceOutcomeSelector,
    resilienceVisibleOutcomes,
  } = useResilienceSlice()

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

  // PLAN: derive sentence axis roles from stored (view, aggregateOver, transposed).
  const { pivotDim, pivotMode } = useMemo(
    () => derivePivotFromStore(view, aggregateOver),
    [view, aggregateOver],
  )
  const { xDim, yDim } = useMemo(
    () => deriveSentenceAxes(pivotDim, transposed),
    [pivotDim, transposed],
  )

  // Pivot handlers. planPivotPatch → writeChange (see controls/planPivotChange.ts).
  const handlePivotPick = useCallback(
    (nextDim: PivotDim, nextMode?: PivotMode) => {
      const mode = nextMode ?? pivotMode
      if (nextDim === pivotDim && mode === pivotMode) return
      const extra: Partial<ResilienceControlsState> =
        nextDim === pivotDim ? {} : { transposed: false }
      writeChange(planPivotPatch(nextDim, mode, controlsSnapshot, extra))
    },
    [controlsSnapshot, writeChange, pivotDim, pivotMode],
  )

  const handlePivotModeChange = useCallback(
    (nextMode: PivotMode) => {
      if (nextMode === pivotMode) return
      writeChange(planPivotPatch(pivotDim, nextMode, controlsSnapshot))
    },
    [controlsSnapshot, writeChange, pivotDim, pivotMode],
  )

  // Clicking a dim in the X pill has three meaningful outcomes:
  //   - picking the current X: no-op
  //   - picking the current Y: transpose (swap X and Y)
  //   - picking the current pivot: promote pivot into X, demote X into pivot,
  //     preserving Y. `transposed` is set so that canonical(newPivotDim)
  //     lands the user's picked dim on X and the current Y on Y.
  const handleXPick = useCallback(
    (nextDim: PivotDim) => {
      if (nextDim === xDim) return
      if (nextDim === yDim) {
        writeChange({ transposed: !transposed })
        return
      }
      const newPivotDim = xDim
      const needsTranspose = CANONICAL_X_FOR_PIVOT[newPivotDim] !== nextDim
      writeChange(
        planPivotPatch(newPivotDim, pivotMode, controlsSnapshot, {
          transposed: needsTranspose,
        }),
      )
    },
    [controlsSnapshot, writeChange, xDim, yDim, pivotMode, transposed],
  )

  // Mirror of handleXPick for the Y pill.
  const handleYPick = useCallback(
    (nextDim: PivotDim) => {
      if (nextDim === yDim) return
      if (nextDim === xDim) {
        writeChange({ transposed: !transposed })
        return
      }
      const newPivotDim = yDim
      const needsTranspose = CANONICAL_X_FOR_PIVOT[newPivotDim] !== xDim
      writeChange(
        planPivotPatch(newPivotDim, pivotMode, controlsSnapshot, {
          transposed: needsTranspose,
        }),
      )
    },
    [controlsSnapshot, writeChange, xDim, yDim, pivotMode, transposed],
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
      writeChange({ selectedHydroclimates: next })
    },
    [selectedHydroclimates, writeChange],
  )

  const toggleShowAllHcs = useCallback(() => {
    const allSelected =
      selectedHydroclimates.size === RESILIENCE_HYDROCLIMATES.length
    if (allSelected) {
      writeChange({
        selectedHydroclimates: new Set<ResilienceHydroclimate>(["historical"]),
      })
    } else {
      writeChange({
        selectedHydroclimates: new Set<ResilienceHydroclimate>(
          RESILIENCE_HYDROCLIMATES,
        ),
      })
    }
  }, [selectedHydroclimates, writeChange])

  const allHcsSelected =
    selectedHydroclimates.size === RESILIENCE_HYDROCLIMATES.length

  const handlePrimaryOutcomeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const next = e.target.value || null
      writeChange({ primaryOutcomeCode: next })
    },
    [writeChange],
  )

  const toggleCompareOutcome = useCallback(
    (code: string) => {
      const next = [...compareOutcomeCodes]
      const idx = next.indexOf(code)
      if (idx >= 0) next.splice(idx, 1)
      else next.push(code)
      writeChange({ compareOutcomeCodes: next })
    },
    [compareOutcomeCodes, writeChange],
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
  const [pivotAnchor, setPivotAnchor] = useState<HTMLElement | null>(null)

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
  // mirror that effective behavior in the sentence label and pivot
  // popover so the user sees the chart they're actually getting
  // rather than the literal stored (pivotMode = facet) state.
  const pivotEffectivelyAggregate =
    pivotMode === "facet" && pivotDim === "scenario" && scenarioCount === 0
  const pivotDisplayMode: PivotMode = pivotEffectivelyAggregate
    ? "aggregate"
    : pivotMode

  const xDimLabel = PIVOT_DIM_LABEL_PLURAL[xDim]
  const yDimLabel = PIVOT_DIM_LABEL_PLURAL[yDim]
  const pivotPhraseLabel =
    pivotDisplayMode === "facet"
      ? `for each ${PIVOT_DIM_LABEL_SINGULAR[pivotDim]}`
      : `averaged over ${PIVOT_DIM_LABEL_PLURAL[pivotDim]}`
  // The pivot phrase leads the sentence now, so render it with a
  // capitalized first letter. Keep `pivotPhraseLabel` itself lowercase
  // because aria-labels, tooltips, and tour copy use it mid-sentence.
  const pivotPhraseLabelLeading =
    pivotPhraseLabel.length > 0
      ? pivotPhraseLabel.charAt(0).toUpperCase() + pivotPhraseLabel.slice(1)
      : pivotPhraseLabel

  const cellSize = { fontSize: "0.8125rem" } as const

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
            label={pivotPhraseLabelLeading}
            active={Boolean(pivotAnchor)}
            onClick={(e) => setPivotAnchor(e.currentTarget)}
            ariaLabel={`Chart pivot: ${pivotPhraseLabel}. This is the biggest lever on the chart. Click to change the dimension the chart is built around and whether it shows small multiples or a single averaged chart.`}
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
          <HoverTip
            key={preset.id}
            content={preset.description}
            density="compact"
            placement="top"
          >
            <Button
              type="button"
              size="small"
              variant="outlined"
              onClick={() => writeChange(preset.getPatch(controlsSnapshot))}
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
          </HoverTip>
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
            writeChange({ reorderBySimilarity: !reorderBySimilarity })
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
          onClick={() => writeChange({ showCellNumbers: !showCellNumbers })}
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
          onClick={() => writeChange({ transposed: !transposed })}
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
          <SaveSnapshotButton onClick={onSaveSnapshot} sx={{ ml: 2 }} />
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
            {ALL_PIVOT_DIMS.map((dim) => (
              <RadioRow
                key={dim}
                active={xDim === dim}
                label={PIVOT_DIM_LABEL_PLURAL[dim]}
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
            {ALL_PIVOT_DIMS.map((dim) => (
              <RadioRow
                key={dim}
                active={yDim === dim}
                label={PIVOT_DIM_LABEL_PLURAL[dim]}
                onClick={() => {
                  handleYPick(dim)
                  setYAnchor(null)
                }}
              />
            ))}
          </Box>
        </PopoverShell>
      </Popover>

      {/* Popover: pivot dim + mode (the "third" sentence role) */}
      <Popover
        open={Boolean(pivotAnchor)}
        anchorEl={pivotAnchor}
        onClose={() => setPivotAnchor(null)}
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
            {ALL_PIVOT_DIMS.map((dim) => (
              <RadioRow
                key={dim}
                active={pivotDim === dim}
                label={PIVOT_DIM_LABEL_PLURAL[dim]}
                onClick={() => handlePivotPick(dim)}
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
              active={pivotDisplayMode === "facet"}
              label={`small multiples, one chart per ${PIVOT_DIM_LABEL_SINGULAR[pivotDim]}`}
              onClick={() => handlePivotModeChange("facet")}
            />
            <RadioRow
              active={pivotDisplayMode === "aggregate"}
              label={`a single chart, averaged across ${PIVOT_DIM_LABEL_PLURAL[pivotDim]}`}
              onClick={() => handlePivotModeChange("aggregate")}
            />
          </Box>
          {pivotEffectivelyAggregate && (
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
