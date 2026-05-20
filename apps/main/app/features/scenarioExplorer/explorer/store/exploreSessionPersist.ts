/**
 * sessionStorage persistence for the Explore tab session.
 *
 * What survives a page reload within the same tab
 * ------------------------------------------------
 * - Shell routing (`mainView`: get-started vs Tools) via `store.ts`
 * - Workspace cross-tool state (`workspaceStoreSlice.ts`): selected scenarios,
 *   hydroclimate, active tool tab, toolbar chrome, chart cosmetics, highlighted
 *   scenario, share drawer open, in-progress tool tour
 * - Tool store slices (`listStoreSlice`, `radarStoreSlice`, `equityStoreSlice`,
 *   `resilienceStoreSlice`): filters, axes, resilience controls, etc.
 *
 * Closing the tab clears sessionStorage.
 *
 * What uses localStorage instead
 * ------------------------------
 * Share tray (`shareItems`, `storyItemIds`) via `share/persist.ts`. Those survive
 * browser restarts and are merged into workspace initial state from localStorage,
 * never from sessionStorage.
 *
 * Load / save flow
 * ----------------
 * - `loadExploreSessionState()` runs at store creation (`storeInstance.ts`,
 *   `store.ts`) and merges validated fields into each slice's initial state.
 * - `saveExploreSessionState(partial)` read-modify-writes the envelope so the
 *   shell store and explorer store can subscribe independently without clobbering
 *   each other.
 *
 * Persist key lists live in `pickSlices.ts`.
 */

import { HYDROCLIMATE_ID_MAP } from "../../../../content/scenarios"
import type { ListState } from "./listStoreSlice"
import { listInitialState } from "./listStoreSlice"
import type { RadarState } from "./radarStoreSlice"
import { radarInitialState } from "./radarStoreSlice"
import type { EquityState } from "./equityStoreSlice"
import { equityInitialState } from "./equityStoreSlice"
import type { ResilienceState } from "./resilienceStoreSlice"
import { resilienceInitialState } from "./resilienceStoreSlice"
import type { WorkspaceState } from "./workspaceStoreSlice"
import { workspaceInitialState } from "./workspaceStoreSlice"
import {
  pickExplorerPersistedSession,
  pickShellPersistedState,
  pickWorkspacePersistedState,
  type ResilienceHydroclimatePersisted,
  type ShellMainView,
  type ShellPersistedState,
} from "./pickSlices"
import type { WorkspaceSlice } from "./workspaceStoreSlice"
import type { ListSlice } from "./listStoreSlice"
import type { RadarSlice } from "./radarStoreSlice"
import type { EquitySlice } from "./equityStoreSlice"
import type { ResilienceSlice } from "./resilienceStoreSlice"
import type { ExploreMode, OutcomeDisplayMode } from "./types"
import { hasTourFor, type TourTool } from "../tools/tour/registry"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "../tools/panels/resilience/resilienceHydroclimates"

export const EXPLORE_SESSION_STORAGE_KEY = "coeqwal-explorer-tool-sessions-v2"
export const EXPLORE_SESSION_STORAGE_VERSION = 2

/** @deprecated Use EXPLORE_SESSION_STORAGE_KEY */
export const TOOL_SESSION_STORAGE_KEY = EXPLORE_SESSION_STORAGE_KEY

type ExplorerStore = WorkspaceSlice &
  ListSlice &
  RadarSlice &
  EquitySlice &
  ResilienceSlice

export interface PersistedExploreSession {
  version: number
  shell: Partial<ShellPersistedState>
  workspace: Partial<
    Pick<WorkspaceState, keyof ReturnType<typeof pickWorkspacePersistedState>>
  >
  list: Partial<ListState>
  radar: Partial<RadarState>
  equity: Partial<EquityState>
  resilience: Partial<
    Omit<ResilienceState, "resilienceSelectedHydroclimates">
  > & {
    resilienceSelectedHydroclimates?: ResilienceHydroclimatePersisted
  }
}

export interface ExploreSessionHydration {
  shell: ShellPersistedState
  workspace: Partial<WorkspaceState>
  list: Partial<ListState>
  radar: Partial<RadarState>
  equity: Partial<EquityState>
  resilience: Partial<ResilienceState>
}

const DEFAULT_SHELL: ShellPersistedState = { mainView: "get-started" }

const EMPTY_HYDRATION: ExploreSessionHydration = {
  shell: DEFAULT_SHELL,
  workspace: {},
  list: {},
  radar: {},
  equity: {},
  resilience: {},
}

const EXPLORE_MODES = new Set<ExploreMode>([
  "list",
  "radar",
  "equity",
  "resilience",
  "data",
])

const OUTCOME_DISPLAY_MODES = new Set<OutcomeDisplayMode>([
  "average",
  "bar",
  "distribution",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  if (!value.every((item) => typeof item === "string")) return null
  return value
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function asStringOrNull(value: unknown): string | null | undefined {
  if (value === null) return null
  return typeof value === "string" ? value : undefined
}

function validateMainView(value: unknown): ShellMainView | undefined {
  if (value === "get-started" || value === "explorer") return value
  return undefined
}

function validateExploreMode(value: unknown): ExploreMode | undefined {
  if (typeof value !== "string") return undefined
  return EXPLORE_MODES.has(value as ExploreMode)
    ? (value as ExploreMode)
    : undefined
}

function validateHydroclimate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  return value in HYDROCLIMATE_ID_MAP ? value : undefined
}

function validateOutcomeDisplayMode(
  value: unknown,
): OutcomeDisplayMode | undefined {
  if (typeof value !== "string") return undefined
  return OUTCOME_DISPLAY_MODES.has(value as OutcomeDisplayMode)
    ? (value as OutcomeDisplayMode)
    : undefined
}

function validateTour(value: unknown): WorkspaceState["tour"] | undefined {
  if (!isRecord(value)) return undefined
  const toolRaw = value.tool
  let tool: TourTool | null | undefined
  if (toolRaw === null) {
    tool = null
  } else if (typeof toolRaw === "string" && hasTourFor(toolRaw)) {
    tool = toolRaw
  } else {
    tool = undefined
  }
  if (tool === undefined) return undefined
  const step =
    typeof value.step === "number" && value.step >= 0
      ? Math.floor(value.step)
      : 0
  return { tool, step }
}

function hydrateResilienceSelectedHydroclimates(
  value: unknown,
): ReadonlySet<ResilienceHydroclimate> | undefined {
  const climates = asStringArray(value)
  if (!climates) return undefined
  const allowed = new Set<string>(RESILIENCE_HYDROCLIMATES)
  const filtered = climates.filter(
    (climate): climate is ResilienceHydroclimate => allowed.has(climate),
  )
  return filtered.length > 0 ? new Set(filtered) : undefined
}

function validateWorkspaceSection(raw: unknown): Partial<WorkspaceState> {
  if (!isRecord(raw)) return {}

  const workspace: Partial<WorkspaceState> = {}

  const selectedScenarios = asStringArray(raw.selectedScenarios)
  if (selectedScenarios) workspace.selectedScenarios = selectedScenarios

  const equityFocusScenario = asStringOrNull(raw.equityFocusScenario)
  if (equityFocusScenario !== undefined) {
    workspace.equityFocusScenario = equityFocusScenario
  }

  const exploreMode = validateExploreMode(raw.exploreMode)
  if (exploreMode) workspace.exploreMode = exploreMode

  const hydroclimate = validateHydroclimate(raw.hydroclimate)
  if (hydroclimate) workspace.hydroclimate = hydroclimate

  const showMap = asBoolean(raw.showMap)
  if (showMap !== undefined) workspace.showMap = showMap

  const showDefinitions = asBoolean(raw.showDefinitions)
  if (showDefinitions !== undefined) workspace.showDefinitions = showDefinitions

  const showKeyOperations = asBoolean(raw.showKeyOperations)
  if (showKeyOperations !== undefined) {
    workspace.showKeyOperations = showKeyOperations
  }

  const showAlternativeBaselines = asBoolean(raw.showAlternativeBaselines)
  if (showAlternativeBaselines !== undefined) {
    workspace.showAlternativeBaselines = showAlternativeBaselines
  }

  const outcomeDisplayMode = validateOutcomeDisplayMode(raw.outcomeDisplayMode)
  if (outcomeDisplayMode) workspace.outcomeDisplayMode = outcomeDisplayMode

  const relativeToBaseline = asBoolean(raw.relativeToBaseline)
  if (relativeToBaseline !== undefined) {
    workspace.relativeToBaseline = relativeToBaseline
  }

  const highlightBaseline = asBoolean(raw.highlightBaseline)
  if (highlightBaseline !== undefined) {
    workspace.highlightBaseline = highlightBaseline
  }

  const overlayTiers = asBoolean(raw.overlayTiers)
  if (overlayTiers !== undefined) workspace.overlayTiers = overlayTiers

  const defineOutcome = asBoolean(raw.defineOutcome)
  if (defineOutcome !== undefined) workspace.defineOutcome = defineOutcome

  const showTierZones = asBoolean(raw.showTierZones)
  if (showTierZones !== undefined) workspace.showTierZones = showTierZones

  const highlightedScenario = asStringOrNull(raw.highlightedScenario)
  if (highlightedScenario !== undefined) {
    workspace.highlightedScenario = highlightedScenario
  }

  const showShareDrawer = asBoolean(raw.showShareDrawer)
  if (showShareDrawer !== undefined) workspace.showShareDrawer = showShareDrawer

  const tour = validateTour(raw.tour)
  if (tour) workspace.tour = tour

  return workspace
}

function validateResilienceHydration(raw: unknown): Partial<ResilienceState> {
  if (!isRecord(raw)) return {}

  const {
    resilienceSelectedHydroclimates: persistedClimates,
    ...restResilienceHydration
  } = raw

  const resilience: Partial<ResilienceState> = {
    ...(restResilienceHydration as Partial<ResilienceState>),
  }

  const climates = hydrateResilienceSelectedHydroclimates(persistedClimates)
  if (climates) resilience.resilienceSelectedHydroclimates = climates

  return resilience
}

function validateResiliencePersistedSection(
  raw: unknown,
): PersistedExploreSession["resilience"] {
  const hydrated = validateResilienceHydration(raw)
  const { resilienceSelectedHydroclimates, ...rest } = hydrated

  return {
    ...rest,
    ...(resilienceSelectedHydroclimates
      ? {
          resilienceSelectedHydroclimates: [...resilienceSelectedHydroclimates],
        }
      : {}),
  }
}

function migrateEnvelope(
  env: Record<string, unknown>,
): PersistedExploreSession {
  const version = typeof env.version === "number" ? env.version : 1

  const shellRaw = isRecord(env.shell) ? env.shell : {}
  const mainView = validateMainView(shellRaw.mainView) ?? DEFAULT_SHELL.mainView

  return {
    version: EXPLORE_SESSION_STORAGE_VERSION,
    shell: version >= 2 ? { mainView } : { mainView: DEFAULT_SHELL.mainView },
    workspace: version >= 2 ? validateWorkspaceSection(env.workspace) : {},
    list: isRecord(env.list) ? (env.list as Partial<ListState>) : {},
    radar: isRecord(env.radar) ? (env.radar as Partial<RadarState>) : {},
    equity: isRecord(env.equity) ? (env.equity as Partial<EquityState>) : {},
    resilience: validateResiliencePersistedSection(env.resilience),
  }
}

function readRawEnvelope(): unknown {
  if (typeof window === "undefined") return null
  const raw =
    sessionStorage.getItem(EXPLORE_SESSION_STORAGE_KEY) ??
    sessionStorage.getItem("coeqwal-explorer-tool-sessions-v1")
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function readPersistedEnvelope(): PersistedExploreSession {
  const parsed = readRawEnvelope()
  if (!isRecord(parsed)) {
    return {
      version: EXPLORE_SESSION_STORAGE_VERSION,
      shell: DEFAULT_SHELL,
      workspace: {},
      list: {},
      radar: {},
      equity: {},
      resilience: {},
    }
  }
  return migrateEnvelope(parsed)
}

export function loadExploreSessionState(): ExploreSessionHydration {
  try {
    const envelope = readPersistedEnvelope()
    const mainView =
      validateMainView(envelope.shell.mainView) ?? DEFAULT_SHELL.mainView

    return {
      shell: { mainView },
      workspace: validateWorkspaceSection(envelope.workspace),
      list: envelope.list,
      radar: envelope.radar,
      equity: envelope.equity,
      resilience: validateResilienceHydration(envelope.resilience),
    }
  } catch {
    return EMPTY_HYDRATION
  }
}

export function pickPersistedExploreSession(
  explorerState: ExplorerStore,
  shellState: ShellPersistedState,
): PersistedExploreSession {
  return {
    version: EXPLORE_SESSION_STORAGE_VERSION,
    shell: pickShellPersistedState(shellState),
    ...pickExplorerPersistedSession(explorerState),
  }
}

export function saveExploreSessionState(
  partial: Partial<PersistedExploreSession>,
): void {
  try {
    if (typeof window === "undefined") return
    const current = readPersistedEnvelope()
    const merged: PersistedExploreSession = {
      version: EXPLORE_SESSION_STORAGE_VERSION,
      shell: { ...current.shell, ...partial.shell },
      workspace: { ...current.workspace, ...partial.workspace },
      list: { ...current.list, ...partial.list },
      radar: { ...current.radar, ...partial.radar },
      equity: { ...current.equity, ...partial.equity },
      resilience: { ...current.resilience, ...partial.resilience },
    }
    sessionStorage.setItem(EXPLORE_SESSION_STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // sessionStorage full or unavailable
  }
}

export function mergeWorkspaceInitialState(
  hydration: Partial<WorkspaceState>,
): WorkspaceState {
  const validated = validateWorkspaceSection(hydration)
  return {
    ...workspaceInitialState,
    ...validated,
    shareItems: workspaceInitialState.shareItems,
    storyItemIds: workspaceInitialState.storyItemIds,
  }
}

export function mergeListInitialState(
  hydration: Partial<ListState>,
): ListState {
  return { ...listInitialState, ...hydration }
}

export function mergeRadarInitialState(
  hydration: Partial<RadarState>,
): RadarState {
  return { ...radarInitialState, ...hydration }
}

export function mergeEquityInitialState(
  hydration: Partial<EquityState>,
): EquityState {
  return { ...equityInitialState, ...hydration }
}

export function mergeResilienceInitialState(
  hydration: Partial<ResilienceState>,
): ResilienceState {
  return { ...resilienceInitialState, ...hydration }
}
