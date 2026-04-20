"use client"

/**
 * ResilienceChartTuner - the "TUNE CHART" entry point for the Resilience
 * heatmap. Wraps the generic `ChartTuner` shell with resilience-specific
 * presets and walkthrough steps, and surfaces the existing
 * `ResilienceControls` toolbar as the "Controls" slot so beginners and
 * power users share a single source of truth.
 *
 * The chart-controls bar above the heatmap still renders the same
 * `ResilienceControls` component - this tuner is additive, not a
 * replacement, so existing workflows keep working.
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
  focusOutcomeCode: "CWS_DEL",
  selectedHydroclimates: new Set(RESILIENCE_HYDROCLIMATES),
  showCellNumbers: true,
  quadrantUnit: "outcome",
  quadrantOutcome: "CWS_DEL",
}

export default function ResilienceChartTuner({
  controls,
  onChange,
}: ResilienceChartTunerProps) {
  const presets = useMemo<TunerPreset[]>(
    () => [
      {
        id: "overview-mean-tiers",
        label: "Overview",
        description: "Aggregate view · mean tier across all scenarios.",
        apply: () =>
          onChange({
            view: "aggregate",
            cellEncoding: "tier",
            deltaMode: "none",
            aggregateScope: "all",
            showCellNumbers: true,
          }),
      },
      {
        id: "by-scenario-distribution",
        label: "By scenario",
        description:
          "Scenario small-multiples · distribution cells for each outcome.",
        apply: () =>
          onChange({
            view: "scenario",
            cellEncoding: "distribution",
            deltaMode: "none",
            showAllScenarios: true,
            showCellNumbers: false,
          }),
      },
      {
        id: "climate-sensitivity",
        label: "Climate shift",
        description:
          "Aggregate view showing change vs the historical hydroclimate.",
        apply: () =>
          onChange({
            view: "aggregate",
            cellEncoding: "tier",
            deltaMode: "vs_historical",
            aggregateScope: "all",
          }),
      },
    ],
    [onChange],
  )

  const walkthrough = useMemo<WalkthroughStep[]>(
    () => [
      {
        title: "What this chart shows",
        body: (
          <>
            Each cell summarises how a <strong>scenario</strong> performs on a
            particular <strong>outcome</strong> under a particular{" "}
            <strong>hydroclimate</strong>. Tiers run from 1 (best) to 4 (worst)
            and are coloured so that riskier outcomes stand out.
          </>
        ),
      },
      {
        title: "Rows and columns",
        body: (
          <>
            Columns are <strong>hydroclimates</strong> - the climate conditions
            the model ran under. Rows are either <strong>outcomes</strong>{" "}
            (when you&apos;re reading one scenario at a time) or{" "}
            <strong>scenarios</strong> (when you&apos;re focused on a single
            outcome). Use the <em>View</em> toggle to pivot between them.
          </>
        ),
        apply: () =>
          onChange({
            view: "scenario",
            cellEncoding: "tier",
            deltaMode: "none",
          }),
      },
      {
        title: "Try a preset",
        body: (
          <>
            The fastest way to learn the chart is to jump between preset
            views. Try <strong>Overview</strong> for a bird&apos;s-eye take,
            then <strong>By scenario</strong> to see how individual scenarios
            distribute, and finally <strong>Climate shift</strong> to see how
            performance moves with the hydroclimate.
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
      description="Guided tour, preset views, and chart controls."
      walkthrough={walkthrough}
      presets={presets}
      controls={<ResilienceControls controls={controls} onChange={onChange} />}
      onReset={handleReset}
      getSnapshot={getSnapshot}
    />
  )
}
