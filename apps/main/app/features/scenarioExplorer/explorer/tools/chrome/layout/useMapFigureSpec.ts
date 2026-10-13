"use client"

/**
 * useMapFigureSpec - reads what the Explore map currently shows and returns
 * its figure-template spec, or null when nothing is mapped. Bar, Radar and
 * Heatmap set activeOutcomeVisualization; Distribution publishes a snapshot
 * of its painted markers. getMapFigureInput (pure) turns that state into the
 * caption. Read-only; no side effects.
 */

import {
  useActiveOutcomeVisualization,
  useDistributionMapSnapshot,
} from "../../../../../map/store"
import { useWorkspaceSlice } from "../../../store"
import type { FigureTemplateSpec } from "../../../share/figureTemplate"
import { useScenarioList } from "../../../../../scenarios/hooks"
import { getMapFigureInput, mapFigureSpec } from "./mapFigureSpec"

export function useMapFigureSpec(): FigureTemplateSpec | null {
  const mode = useWorkspaceSlice((s) => s.exploreMode)
  const workspaceHydroclimate = useWorkspaceSlice((s) => s.hydroclimate)
  const active = useActiveOutcomeVisualization()
  const distribution = useDistributionMapSnapshot()
  const { scenarios } = useScenarioList()

  return mapFigureSpec(
    getMapFigureInput({
      mode,
      active,
      distribution,
      workspaceHydroclimate,
      scenarios,
    }),
  )
}
