"use client"

/**
 * useMapFigureSpec - reads what the Explore map currently shows (Bar,
 * Radar and Heatmap set activeOutcomeVisualization; Distribution publishes
 * mappedOutcomeCodes) and returns its figure-template spec, or null when
 * nothing is mapped. Read-only; no side effects.
 */

import {
  useActiveOutcomeVisualization,
  useMappedOutcomeCodes,
} from "../../../../../map/store"
import { getOutcomeName } from "../../../../../../content/outcomes"
import {
  getScenarioShortLabel,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../../content/scenarios"
import { useEquitySlice, useWorkspaceSlice } from "../../../store"
import type { FigureTemplateSpec } from "../../../share/figureTemplate"
import {
  useResolvedIdMapping,
  useScenarioList,
} from "../../../../../scenarios/hooks"
import { BASELINE_SCENARIO_ID } from "../../../../constants"
import { mapFigureSpec } from "./mapFigureSpec"

export function useMapFigureSpec(): FigureTemplateSpec | null {
  const exploreMode = useWorkspaceSlice((s) => s.exploreMode)
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)
  const equityFocusScenario = useWorkspaceSlice((s) => s.equityFocusScenario)
  const showEquityComparison = useEquitySlice((s) => s.showEquityComparison)
  const active = useActiveOutcomeVisualization()
  const mappedCodes = useMappedOutcomeCodes()
  const { idMapping } = useResolvedIdMapping()
  const { scenarios } = useScenarioList()

  const isEquity = exploreMode === "equity"
  const outcomeCodes = isEquity
    ? mappedCodes
    : active
      ? [active.outcomeCode]
      : []
  // Distribution paints current operations when no focus scenario is set.
  const scenarioId = isEquity
    ? (equityFocusScenario ?? BASELINE_SCENARIO_ID)
    : (active?.siblingGroupId ?? active?.scenarioId ?? null)
  // When the chosen hydroclimate has no variant of the mapped scenario
  // (the resolver maps it to null), the map keeps drawing the previous
  // variant. Do not label that map with the new climate. A mapping that is
  // still loading (undefined) is not a missing variant.
  const climateMissing =
    !isEquity &&
    !!active?.siblingGroupId &&
    idMapping[active.siblingGroupId] === null
  const climateLabel = HYDROCLIMATE_SHORT_LABELS[hydroclimate] ?? hydroclimate

  return mapFigureSpec({
    mode: exploreMode,
    outcomeNames: outcomeCodes.map(getOutcomeName),
    scenarioLabel: scenarioId
      ? (getScenarioShortLabel(scenarioId) ??
        scenarios.find((s) => s.scenarioId === scenarioId)?.shortLabel ??
        scenarioId)
      : null,
    hydroclimateLabel: climateMissing
      ? `Not available under ${climateLabel}`
      : climateLabel,
    comparedWithBaseline: isEquity && showEquityComparison,
  })
}
