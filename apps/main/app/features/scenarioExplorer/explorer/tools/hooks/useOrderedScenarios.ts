/**
 * useOrderedScenarios - Shared scenario ordering for ListView and ScenarioSelectionSidebar.
 *
 * Sort, search, theme, and icon filters live in the explorer store and
 * persist across tool switches. Tier scores for column sort are passed
 * in by the caller (`useResolvedScenarioTiers` in ListView,
 * `useScenarioSortScores` in the sidebar when sort is active).
 *
 */

import { useMemo } from "react"
import { useExplorerStore, useListSlice } from "../../store"
import { useScenarioList } from "../../../../scenarios/hooks/useScenarioList"
import {
  useMultipleScenarioTiers,
  useResolvedIdMapping,
} from "../../../../scenarios/hooks"
import type { Scenario } from "../../../../scenarios/hooks/useScenarioList"
import type { OutcomeScoreData } from "../../../../scenarios/hooks"
import type { ScenarioTheme } from "../../../../../content/scenarios"
import { getScenariosWithIcon } from "../../../../scenarios/components/shared/opsIcons"
import {
  PRIMARY_SCENARIO_BASELINE_ID,
  compareScenarioIdsForThemeSubgroupOrder,
} from "../../../utils/scenarioIdSort"
import { areThemeGroupsContiguous } from "../../../utils/scenarioThemeOrder"

const PRIMARY_BASELINE_ID = PRIMARY_SCENARIO_BASELINE_ID

const THEME_ORDER: Record<ScenarioTheme, number> = {
  baseline: 0,
  ag_gw: 1,
  eco: 2,
  delta: 3,
  cws: 4,
  unthemed: 5,
}

export interface OrderedScenariosResult {
  orderedScenarios: Scenario[]
  matchingScenarioIds: Set<string>
  hasSearchResults: boolean
  themeMatchingScenarioIds: Set<string>
  showThemeDivider: boolean
  showAllThemeDividers: boolean
  iconMatchingScenarioIds: Set<string>
  showIconDivider: boolean
  /** False when theme blocks are interleaved (e.g. after search or sort). Hide subheaders and use row badges */
  scenariosInContiguousThemeOrder: boolean
  isLoading: boolean
  error: string | null
}

export type ComputeOrderedScenariosInput = {
  siblingGroups: Scenario[]
  sortBy: string | null
  sortDirection: "asc" | "desc"
  searchQuery: string
  selectedTheme: ScenarioTheme | null
  showOnlyTheme: boolean
  selectedIconId: string | null
  showOnlyChosen: boolean
  showAlternativeBaselines: boolean
  selectedScenarios: string[]
  allScoreData?: Record<string, Record<string, OutcomeScoreData>>
}

/** Ordering pipeline shared by the hook */
export function computeOrderedScenarios({
  siblingGroups,
  sortBy,
  sortDirection,
  searchQuery,
  selectedTheme,
  showOnlyTheme,
  selectedIconId,
  showOnlyChosen,
  showAlternativeBaselines,
  selectedScenarios,
  allScoreData,
}: ComputeOrderedScenariosInput): Omit<
  OrderedScenariosResult,
  "isLoading" | "error"
> {
  let baseScenarios = [...siblingGroups]

  if (showOnlyChosen) {
    baseScenarios = baseScenarios.filter((s) =>
      selectedScenarios.includes(s.scenarioId),
    )
  } else if (!showAlternativeBaselines) {
    baseScenarios = baseScenarios.filter(
      (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
    )
  }

  if (sortBy && allScoreData && Object.keys(allScoreData).length > 0) {
    baseScenarios.sort((a, b) => {
      const aScores = allScoreData[a.scenarioId]
      const bScores = allScoreData[b.scenarioId]
      if (!aScores?.[sortBy] && !bScores?.[sortBy]) {
        return compareScenarioIdsForThemeSubgroupOrder(
          a.scenarioId,
          b.scenarioId,
        )
      }
      if (!aScores?.[sortBy]) return 1
      if (!bScores?.[sortBy]) return -1
      const aScore = aScores[sortBy].weighted_score
      const bScore = bScores[sortBy].weighted_score
      const delta = sortDirection === "asc" ? aScore - bScore : bScore - aScore
      if (delta !== 0) return delta
      return compareScenarioIdsForThemeSubgroupOrder(a.scenarioId, b.scenarioId)
    })
  } else {
    baseScenarios.sort((a, b) => {
      const aOrder = a.theme ? (THEME_ORDER[a.theme] ?? 99) : 99
      const bOrder = b.theme ? (THEME_ORDER[b.theme] ?? 99) : 99
      if (aOrder !== bOrder) return aOrder - bOrder
      return compareScenarioIdsForThemeSubgroupOrder(a.scenarioId, b.scenarioId)
    })
  }

  const applyThemeGrouping = (list: Scenario[]) => {
    if (!selectedTheme) return { list, themeIds: new Set<string>() }
    const matches = list.filter((s) => s.theme === selectedTheme)
    const rest = list.filter((s) => s.theme !== selectedTheme)
    const themeIds = new Set(matches.map((s) => s.scenarioId))
    return { list: showOnlyTheme ? matches : [...matches, ...rest], themeIds }
  }

  const iconScenarioIdSet = selectedIconId
    ? new Set(getScenariosWithIcon(selectedIconId))
    : new Set<string>()
  const applyIconGrouping = (list: Scenario[]) => {
    if (!selectedIconId) return { list, iconIds: new Set<string>() }
    const matches = list.filter((s) => iconScenarioIdSet.has(s.scenarioId))
    const rest = list.filter((s) => !iconScenarioIdSet.has(s.scenarioId))
    return { list: [...matches, ...rest], iconIds: iconScenarioIdSet }
  }

  const matchingIds = new Set<string>()
  let hasSearchResults = false

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    const matches: Scenario[] = []
    const nonMatches: Scenario[] = []

    for (const s of baseScenarios) {
      const isMatch =
        s.shortLabel.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.scenarioId.toLowerCase().includes(q)
      if (isMatch) {
        matches.push(s)
        matchingIds.add(s.scenarioId)
      } else {
        nonMatches.push(s)
      }
    }

    hasSearchResults = matches.length > 0
    baseScenarios = [...matches, ...nonMatches]
  }

  const { list: themeList, themeIds } = applyThemeGrouping(baseScenarios)
  const { list: finalList, iconIds } = applyIconGrouping(themeList)

  return {
    orderedScenarios: finalList,
    matchingScenarioIds: matchingIds,
    hasSearchResults,
    themeMatchingScenarioIds: themeIds,
    showThemeDivider: selectedTheme !== null && !showOnlyTheme,
    showAllThemeDividers: !sortBy,
    iconMatchingScenarioIds: iconIds,
    showIconDivider: selectedIconId !== null,
    scenariosInContiguousThemeOrder: areThemeGroupsContiguous(finalList),
  }
}

/**
 * Tier scores for list column sort. Skips the network when sort is off
 * by passing an empty id mapping into `useMultipleScenarioTiers`.
 */
export function useScenarioSortScores():
  | Record<string, Record<string, OutcomeScoreData>>
  | undefined {
  const sortBy = useExplorerStore((s) => s.sortBy)
  const { idMapping } = useResolvedIdMapping()
  const { allScoreData } = useMultipleScenarioTiers(
    sortBy ? idMapping : ({} as Record<string, string | null>),
  )
  return sortBy ? allScoreData : undefined
}

export function useOrderedScenarios(
  allScoreData?: Record<string, Record<string, OutcomeScoreData>>,
): OrderedScenariosResult {
  const {
    sortBy,
    sortDirection,
    searchQuery,
    selectedTheme,
    showOnlyTheme,
    selectedIconId,
    showOnlyChosen,
  } = useListSlice()
  const { showAlternativeBaselines, selectedScenarios } = useExplorerStore()

  const {
    siblingGroups,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useScenarioList()

  const result = useMemo(
    () =>
      computeOrderedScenarios({
        siblingGroups,
        sortBy,
        sortDirection,
        searchQuery,
        selectedTheme,
        showOnlyTheme,
        selectedIconId,
        showOnlyChosen,
        showAlternativeBaselines,
        selectedScenarios,
        allScoreData,
      }),
    [
      siblingGroups,
      sortBy,
      sortDirection,
      allScoreData,
      searchQuery,
      selectedTheme,
      showOnlyTheme,
      selectedIconId,
      showOnlyChosen,
      showAlternativeBaselines,
      selectedScenarios,
    ],
  )

  return {
    ...result,
    isLoading: scenariosLoading,
    error: scenariosError ?? null,
  }
}
