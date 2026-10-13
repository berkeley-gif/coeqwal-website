/**
 * mapFigureSpec - the figure-template spec for what the Explore map shows:
 * which outcome(s), under which strategy and hydroclimate. The map caption
 * renders it. Pure module.
 *
 * Exports: MapFigureInput, mapFigureSpec, MAP_TOOL_LABELS, MapFigureState,
 * MapScenarioInfo, getMapFigureInput, MapSaveRequest, getMapSaveRequest.
 */

import type { ExploreMode } from "../../../store/types"
import type { FigureTemplateSpec } from "../../../share/figureTemplate"
import { buildFigureTemplate } from "../../../share/figureTemplate"
import { titleCaseLabel } from "../../../share/figureTitle"
import {
  getDistributionPaintKey,
  mapPaintKey,
} from "../../../../../map/config/mapPaintKey"
import type {
  DistributionMapSnapshot,
  OutcomeVisualization,
} from "../../../../../map/store"
import { getOutcomeName } from "../../../../../../content/outcomes"
import {
  getScenarioShortLabel,
  HYDROCLIMATE_LABEL_MAP,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../../content/scenarios"

export const MAP_TOOL_LABELS: Partial<Record<ExploreMode, string>> = {
  bar: "Bar tool",
  radar: "Radar tool",
  equity: "Distribution tool",
  resilience: "Heatmap tool",
}

export interface MapFigureInput {
  mode: ExploreMode
  /** Display names of the outcomes painted on the map */
  outcomeNames: string[]
  /** Scenario short label, or null when unknown */
  scenarioLabel: string | null
  /** Hydroclimate short label, e.g. "Historical" */
  hydroclimateLabel: string | null
  /** Distribution comparison mode: markers compare with current operations */
  comparedWithBaseline: boolean
}

/** Template spec for the map, or null when nothing is mapped. Pure. */
export function mapFigureSpec(
  input: MapFigureInput,
): FigureTemplateSpec | null {
  if (input.outcomeNames.length === 0) return null
  const strategy = input.scenarioLabel
    ? `${titleCaseLabel(input.scenarioLabel)}${
        input.comparedWithBaseline ? ", Compared with Current Operations" : ""
      }`
    : undefined
  return {
    toolLabel: "Map",
    chartKindLabel: MAP_TOOL_LABELS[input.mode] ?? "Map",
    values: {
      outcome: input.outcomeNames.join(", "),
      strategy,
      hydroclimate: input.hydroclimateLabel ?? undefined,
    },
    legendHeading: "Tier",
  }
}

/** One API scenario variant, as the scenario list describes it */
export interface MapScenarioInfo {
  /** Variant short code, e.g. "s0020" */
  scenarioId: string
  /** API hydroclimate_id of the variant */
  hydroclimateId: number
  /** Display label (local metadata, else the API name) */
  shortLabel: string
}

/** Store state the map caption reads */
export interface MapFigureState {
  mode: ExploreMode
  /** Bar, Radar and Heatmap: the outcome and variant the map draws */
  active: OutcomeVisualization | null
  /** Distribution: what its painted markers show */
  distribution: DistributionMapSnapshot | null
  scenarios: readonly MapScenarioInfo[]
}

const hydroclimateLabel = (value: string) =>
  HYDROCLIMATE_SHORT_LABELS[value] ?? value

/**
 * Caption input for what the map draws, not for the current controls.
 * Distribution's snapshot was captured when its markers were painted.
 * Elsewhere the map draws `active.scenarioId`, a hydroclimate variant that
 * can lag the workspace hydroclimate (it is re-resolved in an effect after a
 * switch) or stay on the previous variant when the new hydroclimate has
 * none, so the label is the variant's own hydroclimate, and the row is left
 * out while that variant is not in the scenario list. Pure.
 */
export function getMapFigureInput(state: MapFigureState): MapFigureInput {
  const scenarioLabel = (id: string) =>
    getScenarioShortLabel(id) ??
    state.scenarios.find((s) => s.scenarioId === id)?.shortLabel ??
    id

  if (state.mode === "equity") {
    const d = state.distribution
    return {
      mode: state.mode,
      outcomeNames: (d?.outcomeCodes ?? []).map(getOutcomeName),
      scenarioLabel: d ? scenarioLabel(d.scenarioId) : null,
      hydroclimateLabel: d ? hydroclimateLabel(d.hydroclimate) : null,
      comparedWithBaseline: d?.comparedWithBaseline ?? false,
    }
  }

  const active = state.active
  const variant = active
    ? state.scenarios.find((s) => s.scenarioId === active.scenarioId)
    : undefined
  const mappedHydroclimate = variant
    ? HYDROCLIMATE_LABEL_MAP[variant.hydroclimateId]
    : undefined
  const groupId = active?.siblingGroupId ?? active?.scenarioId ?? null
  return {
    mode: state.mode,
    outcomeNames: active ? [getOutcomeName(active.outcomeCode)] : [],
    scenarioLabel: groupId ? scenarioLabel(groupId) : null,
    // Omitted while the drawn variant is unknown rather than guessed.
    hydroclimateLabel: mappedHydroclimate
      ? hydroclimateLabel(mappedHydroclimate)
      : null,
    comparedWithBaseline: false,
  }
}

/** What saving the map stores: the share item's description, the paint
 *  key the saved picture must match, and the one-line caption drawn into
 *  the image. Fields mirror the map caption, so the saved card and the
 *  caption cannot disagree. */
export interface MapSaveRequest {
  /** Paint key of what the map draws; "" when nothing is mapped */
  key: string
  tool: ExploreMode
  outcomeCodes: string[]
  /** Sibling-group id of the drawn scenario; "" when unknown */
  scenarioId: string
  /** Strategy label the caption shows; null when unknown */
  scenarioLabel: string | null
  /** Hydroclimate value of the drawn data; null when unknown (no save) */
  hydroclimate: string | null
  comparedWithBaseline: boolean
  captionText: string
}

/** Save request for what the map draws. Pure. */
export function getMapSaveRequest(state: MapFigureState): MapSaveRequest {
  const input = getMapFigureInput(state)
  const spec = mapFigureSpec(input)
  const captionText = spec
    ? buildFigureTemplate(spec)
        .rows.map((r) => r.value)
        .join(" | ")
    : ""
  if (state.mode === "equity") {
    const d = state.distribution
    return {
      key: getDistributionPaintKey(d),
      tool: state.mode,
      outcomeCodes: d?.outcomeCodes ?? [],
      scenarioId: d?.scenarioId ?? "",
      scenarioLabel: input.scenarioLabel,
      hydroclimate: d?.hydroclimate ?? null,
      comparedWithBaseline: d?.comparedWithBaseline ?? false,
      captionText,
    }
  }
  const active = state.active
  const variant = active
    ? state.scenarios.find((s) => s.scenarioId === active.scenarioId)
    : undefined
  return {
    key: mapPaintKey({
      mode: "tiers",
      outcomeCode: active?.outcomeCode ?? null,
      scenarioId: active?.scenarioId ?? null,
    }),
    tool: state.mode,
    outcomeCodes: active ? [active.outcomeCode] : [],
    scenarioId: active?.siblingGroupId ?? active?.scenarioId ?? "",
    scenarioLabel: input.scenarioLabel,
    hydroclimate: variant
      ? (HYDROCLIMATE_LABEL_MAP[variant.hydroclimateId] ?? null)
      : null,
    comparedWithBaseline: false,
    captionText,
  }
}
