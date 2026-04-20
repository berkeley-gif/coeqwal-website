"use client"

/**
 * ResilienceChartTuner - the "TUNE CHART" entry point for the Resilience
 * heatmap. Wraps the generic `ChartTuner` shell and now acts as the
 * spine of the user's Browse → Curate → Read journey through the
 * heatmap: each walkthrough step mirrors a stage of that path and each
 * preset group ("Start", "Browse", "Analyze") presents a
 * narrative-appropriate menu of one-click configurations.
 *
 * The tuner is controlled-open so the onboarding banner in the
 * resilience panel can pop it open with a link. The chart-controls bar
 * above the heatmap still renders the same `ResilienceControls`
 * component - this tuner is additive, not a replacement, so existing
 * workflows keep working.
 */

import { useMemo } from "react"
import { ChartTuner } from "@repo/ui"
import type { TunerPreset, WalkthroughStep } from "@repo/ui"
import { RESILIENCE_HYDROCLIMATES } from "../hooks/useResilienceMatrix"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../utils/scenarioIdSort"
import ResilienceControls from "./ResilienceControls"
import type { ResilienceControlsState } from "./ResiliencePanel"

interface ResilienceChartTunerProps {
  controls: ResilienceControlsState
  onChange: (next: Partial<ResilienceControlsState>) => void
  /**
   * Controlled open state for the tuner overlay. The resilience panel
   * owns this so the onboarding banner in the empty state can
   * imperatively pop it open (via "Open the walkthrough").
   */
  open?: boolean
  onOpenChange?: (next: boolean) => void
}

// Baseline "safe defaults" mirrored from ScenarioExplorer's initial
// state. Kept here as a single object so the Reset action below returns
// the chart to the same state a fresh session would have.
const DEFAULT_CONTROLS: ResilienceControlsState = {
  view: "scenario",
  cellEncoding: "tier",
  deltaMode: "none",
  deltaBaselineScenarioId: PRIMARY_SCENARIO_BASELINE_ID,
  aggregateScope: "all",
  reorderBySimilarity: false,
  showMarginals: false,
  showAllScenarios: false,
  expandedTileId: null,
  selectedHydroclimates: new Set(RESILIENCE_HYDROCLIMATES),
  showCellNumbers: true,
  quadrantUnit: "outcome",
  quadrantOutcome: "CWS_DEL",
}

export default function ResilienceChartTuner({
  controls,
  onChange,
  open,
  onOpenChange,
}: ResilienceChartTunerProps) {
  // Preset menu, grouped by stage of the Browse → Curate → Read path.
  // Each preset is a one-click mutation of the controls state; none of
  // them pin scenarios or outcomes themselves - curation is a user
  // gesture learned from the walkthrough.
  const presets = useMemo<TunerPreset[]>(
    () => [
      {
        id: "overview-mean-tiers",
        group: "Start",
        label: "Overview",
        description: "Aggregate view · mean tier across all scenarios.",
        apply: () =>
          onChange({
            view: "aggregate",
            cellEncoding: "tier",
            deltaMode: "none",
            aggregateScope: "all",
            showCellNumbers: true,
            expandedTileId: null,
          }),
      },
      {
        id: "browse-all-scenarios",
        group: "Browse",
        label: "All scenarios",
        description:
          "By-scenario small-multiples · pin a few tiles to compare.",
        apply: () =>
          onChange({
            view: "scenario",
            cellEncoding: "tier",
            deltaMode: "none",
            showAllScenarios: true,
            expandedTileId: null,
          }),
      },
      {
        id: "browse-all-outcomes",
        group: "Browse",
        label: "All outcomes",
        description: "By-outcome small-multiples · one tile per outcome row.",
        apply: () =>
          onChange({
            view: "outcome",
            cellEncoding: "tier",
            deltaMode: "none",
            expandedTileId: null,
          }),
      },
      {
        id: "analyze-scenario-distribution",
        group: "Analyze",
        label: "Scenario distribution",
        description: "Distribution cells across scenarios for each outcome.",
        apply: () =>
          onChange({
            view: "scenario",
            cellEncoding: "distribution",
            deltaMode: "none",
            showAllScenarios: true,
            showCellNumbers: false,
            expandedTileId: null,
          }),
      },
      {
        id: "analyze-climate-shift",
        group: "Analyze",
        label: "Climate shift",
        description:
          "Aggregate view showing change vs the historical hydroclimate.",
        apply: () =>
          onChange({
            view: "aggregate",
            cellEncoding: "tier",
            deltaMode: "vs_historical",
            aggregateScope: "all",
            expandedTileId: null,
          }),
      },
      {
        id: "analyze-risk-density",
        group: "Analyze",
        label: "Risk density",
        description: "Aggregate view encoded by fraction of tier-3/4 results.",
        apply: () =>
          onChange({
            view: "aggregate",
            cellEncoding: "density_risk",
            deltaMode: "none",
            aggregateScope: "all",
            expandedTileId: null,
          }),
      },
    ],
    [onChange],
  )

  // Walkthrough: Browse → Curate → Read. Each step's `apply` sets up a
  // chart state that matches the step's narrative, but does NOT pin
  // scenarios or outcomes on the user's behalf - we want the user to
  // feel the pin gesture themselves so the affordance sticks.
  const walkthrough = useMemo<WalkthroughStep[]>(
    () => [
      {
        title: "Browse",
        body: (
          <>
            Start with the whole picture. Columns are{" "}
            <strong>hydroclimates</strong> and cells summarise how{" "}
            <strong>scenarios</strong> perform on each <strong>outcome</strong>.
            The <em>Browse</em> presets below swap between the overview, all
            scenarios, and all outcomes so you can orient yourself before
            narrowing in.
          </>
        ),
        apply: () =>
          onChange({
            view: "scenario",
            cellEncoding: "tier",
            deltaMode: "none",
            showAllScenarios: true,
            expandedTileId: null,
          }),
      },
      {
        title: "Curate",
        body: (
          <>
            Found a few tiles worth comparing? Hover a tile and click the{" "}
            <strong>+</strong> icon to pin that scenario (or outcome) to your
            selection. A <em>Comparing N of M</em> chip appears once you&apos;ve
            pinned anything. Click it to focus the grid on just your
            picks.
          </>
        ),
      },
      {
        title: "Read",
        body: (
          <>
            Click the <strong>⤢</strong> icon on any tile to expand it to full
            size for a closer read. Press <kbd>Esc</kbd> or the <em>Back</em>{" "}
            button to return to the grid. Swap encodings (tier, distribution,
            climate shift) from the <em>Analyze</em> presets to keep the same
            curated set while changing what each cell tells you.
          </>
        ),
      },
    ],
    [onChange],
  )

  const handleReset = () => {
    onChange(DEFAULT_CONTROLS)
  }

  const getSnapshot = () => {
    // Sets aren't directly JSON-serializable; expand to an array of
    // strings so the copied snapshot round-trips cleanly.
    return {
      ...controls,
      selectedHydroclimates: Array.from(controls.selectedHydroclimates),
    }
  }

  return (
    <ChartTuner
      triggerLabel="TUNE CHART"
      description="Browse the whole grid, curate a focused subset, then read tiles up close. Each preset maps to a step of that path."
      walkthrough={walkthrough}
      presets={presets}
      controls={<ResilienceControls controls={controls} onChange={onChange} />}
      onReset={handleReset}
      getSnapshot={getSnapshot}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
