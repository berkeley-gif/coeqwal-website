/**
 * Shared hook that produces a single ordered scenario list consumed by both
 * the ScenarioSelectionSidebar and ListView. Keeps both panels coordinated.
 *
 * Fetches data via useMultipleScenarioTiers (SWR-cached, so
 * multiple callers share the same request).
 *
 * Sort/filter state lives in the Zustand store and persists across tool
 * switches (list to radar to equity, etc.).
 */

import { useMemo } from "react"
import { useScenarioExplorerStore } from "../../store"
import { useScenarioList } from "../../../scenarios/hooks/useScenarioList"
import {
  useMultipleScenarioTiers,
  useResolvedIdMapping,
} from "../../../scenarios/hooks"
import type { Scenario } from "../../../scenarios/hooks/useScenarioList"
import type { OutcomeScoreData } from "../../../scenarios/hooks"
import type { OutcomeName } from "../../../scenarios/components/shared"
import type { ScenarioTheme } from "../../../../content/scenarios"
import { getScenariosWithIcon } from "../../../scenarios/components/shared/opsIcons"
import {
  PRIMARY_SCENARIO_BASELINE_ID,
  compareScenarioIdsForThemeSubgroupOrder,
} from "../../utils/scenarioIdSort"
import { areThemeGroupsContiguous } from "../../utils/scenarioThemeOrder"

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
  themeBoundaryIndices: number[]
  /** False when theme blocks are interleaved (e.g. after search or sort). Hide subheaders and use row badges */
  scenariosInContiguousThemeOrder: boolean
  allScoreData: Record<string, Record<string, OutcomeScoreData>> | undefined
  allChartData: Record<string, Record<string, unknown>>
  outcomeNames: OutcomeName[]
  isLoading: boolean
  error: string | null
}

export function useOrderedScenarios(): OrderedScenariosResult {
  const {
    sortBy,
    sortDirection,
    pinnedScenarioIds,
    searchQuery,
    selectedTheme,
    showOnlyTheme,
    selectedIconId,
    showOnlyChosen,
    showAlternativeBaselines,
    selectedScenarios,
  } = useScenarioExplorerStore()

  const {
    siblingGroups,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useScenarioList()

  const { idMapping } = useResolvedIdMapping()

  const {
    allChartData,
    outcomeNames,
    allScoreData,
    isLoading: dataLoading,
    error: dataError,
  } = useMultipleScenarioTiers(idMapping)

  const result = useMemo(() => {
    let baseScenarios = [...siblingGroups]

    // Visibility filters (chosen-only, baselines)
    if (showOnlyChosen) {
      baseScenarios = baseScenarios.filter((s) =>
        selectedScenarios.includes(s.scenarioId),
      )
    } else if (!showAlternativeBaselines) {
      baseScenarios = baseScenarios.filter(
        (s) => s.theme !== "baseline" || s.scenarioId === PRIMARY_BASELINE_ID,
      )
    }

    // Primary sort: by score if active, else by theme group
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
        const delta =
          sortDirection === "asc" ? aScore - bScore : bScore - aScore
        if (delta !== 0) return delta
        return compareScenarioIdsForThemeSubgroupOrder(
          a.scenarioId,
          b.scenarioId,
        )
      })
    } else {
      baseScenarios.sort((a, b) => {
        const aOrder = a.theme ? (THEME_ORDER[a.theme] ?? 99) : 99
        const bOrder = b.theme ? (THEME_ORDER[b.theme] ?? 99) : 99
        if (aOrder !== bOrder) return aOrder - bOrder
        return compareScenarioIdsForThemeSubgroupOrder(
          a.scenarioId,
          b.scenarioId,
        )
      })
    }

    // Pinning: float pinned scenarios to top
    const applyPinning = (list: Scenario[]) => {
      if (pinnedScenarioIds.length === 0) return list
      const pinnedSet = new Set(pinnedScenarioIds)
      const pinned = list.filter((s) => pinnedSet.has(s.scenarioId))
      if (pinned.length === 0) return list
      const rest = list.filter((s) => !pinnedSet.has(s.scenarioId))
      return [...pinned, ...rest]
    }

    // Theme grouping: float theme-matching scenarios to top
    const applyThemeGrouping = (list: Scenario[]) => {
      if (!selectedTheme) return { list, themeIds: new Set<string>() }
      const matches = list.filter((s) => s.theme === selectedTheme)
      const rest = list.filter((s) => s.theme !== selectedTheme)
      const themeIds = new Set(matches.map((s) => s.scenarioId))
      return { list: showOnlyTheme ? matches : [...matches, ...rest], themeIds }
    }

    // Icon grouping: float icon-matching scenarios to top
    const iconScenarioIdSet = selectedIconId
      ? new Set(getScenariosWithIcon(selectedIconId))
      : new Set<string>()
    const applyIconGrouping = (list: Scenario[]) => {
      if (!selectedIconId) return { list, iconIds: new Set<string>() }
      const matches = list.filter((s) => iconScenarioIdSet.has(s.scenarioId))
      const rest = list.filter((s) => !iconScenarioIdSet.has(s.scenarioId))
      return { list: [...matches, ...rest], iconIds: iconScenarioIdSet }
    }

    // Search: highlight + float (keep all scenarios, matches first)
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

    const pinned = applyPinning(baseScenarios)
    const { list: themeList, themeIds } = applyThemeGrouping(pinned)
    const { list: finalList, iconIds } = applyIconGrouping(themeList)

    // Compute theme boundary indices for divider alignment
    const boundaries: number[] = []
    for (let i = 1; i < finalList.length; i++) {
      if (finalList[i]?.theme !== finalList[i - 1]?.theme) {
        boundaries.push(i)
      }
    }

    return {
      orderedScenarios: finalList,
      matchingScenarioIds: matchingIds,
      hasSearchResults,
      themeMatchingScenarioIds: themeIds,
      showThemeDivider: selectedTheme !== null && !showOnlyTheme,
      showAllThemeDividers: !sortBy,
      iconMatchingScenarioIds: iconIds,
      showIconDivider: selectedIconId !== null,
      themeBoundaryIndices: boundaries,
      scenariosInContiguousThemeOrder: areThemeGroupsContiguous(finalList),
    }
  }, [
    siblingGroups,
    sortBy,
    sortDirection,
    allScoreData,
    pinnedScenarioIds,
    searchQuery,
    selectedTheme,
    showOnlyTheme,
    selectedIconId,
    showOnlyChosen,
    showAlternativeBaselines,
    selectedScenarios,
  ])

  return {
    ...result,
    allScoreData,
    allChartData: allChartData ?? {},
    outcomeNames: outcomeNames ?? [],
    isLoading: scenariosLoading || dataLoading,
    error: scenariosError ?? dataError ?? null,
  }
}
