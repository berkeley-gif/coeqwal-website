/**
 * Journey config. Ties each ExploreMode to:
 *   - a plain-language purpose line shown above the chart
 *   - a suggested next tool with a rationale (used by the "Now try..." nudge)
 *
 * This exists to make the four tools feel like stages of one curation
 * loop without forcing a linear path: users can still click any tab in
 * the sub-nav. The suggestions are opinionated but never gated.
 */

import type { ExploreMode } from "./store"

export interface JourneyStageConfig {
  mode: ExploreMode
  purpose: string
  nextMode: ExploreMode | null
  nextLabel: string
  nextRationale: string
}

export const JOURNEY: Record<ExploreMode, JourneyStageConfig> = {
  list: {
    mode: "list",
    purpose:
      "Browse the full library and narrow down a shortlist of scenarios that you want to study more closely.",
    nextMode: "radar",
    nextLabel: "Compare chosen scenarios on Radar chart",
    nextRationale: "See your shortlist scenarios side by side.",
  },
  radar: {
    mode: "radar",
    purpose:
      "Compare the scenarios you selected across all the outcomes in one view.",
    nextMode: "equity",
    nextLabel: "Inspect by location",
    nextRationale:
      "Look at how one scenario's results are spread across locations.",
  },
  equity: {
    mode: "equity",
    purpose:
      "Look inside a single scenario: how consistently does it serve different locations?",
    nextMode: "resilience",
    nextLabel: "Stress test by climate",
    nextRationale:
      "Check whether the same scenarios hold up under other climate futures.",
  },
  resilience: {
    mode: "resilience",
    purpose: "Stress-test scenarios across climate futures",
    nextMode: null,
    nextLabel: "Open Share",
    nextRationale: "Review everything you've saved and build your water story.",
  },
  comparison: {
    mode: "comparison",
    purpose:
      "Side-by-side view for comparing a small set of scenarios in detail.",
    nextMode: null,
    nextLabel: "",
    nextRationale: "",
  },
  data: {
    mode: "data",
    purpose: "Dig into the underlying data for the selected scenarios.",
    nextMode: null,
    nextLabel: "",
    nextRationale: "",
  },
}

export function getJourneyStage(mode: ExploreMode): JourneyStageConfig {
  return JOURNEY[mode]
}

/**
 * Human-readable display name for each explore mode. Used as the
 * chart title in the ToolJourneyStrip top row.
 */
export const EXPLORE_MODE_VIEW_NAME: Record<ExploreMode, string> = {
  list: "List view",
  radar: "Radar chart",
  equity: "Distribution",
  resilience: "Resilience heatmap",
  comparison: "Comparison",
  data: "Data explorer",
}

export function getExploreModeViewName(mode: ExploreMode): string {
  return EXPLORE_MODE_VIEW_NAME[mode]
}
