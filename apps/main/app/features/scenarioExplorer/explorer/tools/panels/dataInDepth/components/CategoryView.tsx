"use client"

/**
 * CategoryView - Outcome categories accordion view
 *
 * Thin orchestrator for the Data in depth tool. Responsibilities:
 *   - read selectedScenarios from the workspace slice
 *   - run the single useBatchStatistics fetch and re-key it by group id
 *   - render one accordion per outcome category, lazy-mounting each
 *     section's body the first time it is opened
 *
 * Each category routes to a bespoke section component (reservoir storage,
 * CWS, AG, env flow, refuge, delta) or falls back to the generic MetricCard
 * for tier-only categories (groundwater, salmon).
 */

import React, { useMemo } from "react"
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  ExpandMoreIcon,
} from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../../../store"
import { useBatchStatistics } from "@repo/data/coeqwal/hooks"
import type { BatchStatisticsResponse } from "@repo/data/coeqwal"
import {
  getMetricsByCategory,
  getOutcomeCategoryColor,
} from "../config/outcomeDefinitions"
import { outcomeCategories } from "../config/outcomeCategories"
import { useResolvedSelectedScenarios } from "../hooks/useResolvedSelectedScenarios"
import { MAX_DATA_IN_DEPTH_SCENARIOS } from "../config/scenarioLimit"
import { useScenarioList } from "../../../../../../scenarios/hooks"
import CwsSection from "./sections/CwsSection"
import AgSection from "./sections/AgSection"
import EnvFlowSection from "./sections/EnvFlowSection"
import RefugeSection from "./sections/RefugeSection"
import DeltaSection from "./sections/DeltaSection"
import ReservoirStorageSection from "./sections/ReservoirStorageSection"
import { MetricCard } from "./sections/MetricCard"
import type { BatchSectionProps } from "./shared/sectionTypes"
import {
  getAccordionStyles,
  getSummaryStyles,
  getIconChipStyles,
} from "./shared/categoryAccordionStyles"

/**
 * Maps an outcome-category id to its bespoke section component. Categories
 * absent from this map (groundwater, salmon) have no custom section and fall
 * back to the generic tier MetricCard list below.
 *
 * Every section accepts BatchSectionProps. Sections backed by the batch fetch
 * (CWS, AG, env flow, delta, reservoir storage) read batchData. Fan-out
 * sections (refuge) only need scenarios + scenarioNames and ignore the rest.
 */
const SECTION_COMPONENTS: Partial<
  Record<string, React.ComponentType<BatchSectionProps>>
> = {
  "reservoir-storage": ReservoirStorageSection,
  "community-water": CwsSection,
  "agricultural-water": AgSection,
  "env-flow-statistics": EnvFlowSection,
  "environmental-water": RefugeSection,
  "delta-salinity": DeltaSection,
}

/**
 * Rewrite a batch slice keyed by API short_code to one keyed by
 * sibling-group id. If an entry carries an inner `scenario_id` (only
 * `BatchStorageData` does today), it's rewritten too so downstream code
 * can use either key interchangeably.
 *
 * Used inside `CategoryView` to translate `useBatchStatistics` responses
 * back into the group-id space the section components expect.
 */
function rekeyByGroup<T>(
  slice: Record<string, T> | undefined,
  resolvedToGroup: Map<string, string>,
): Record<string, T> | undefined {
  if (!slice) return slice
  const out: Record<string, T> = {}
  for (const [shortCode, entry] of Object.entries(slice)) {
    const groupId = resolvedToGroup.get(shortCode)
    if (!groupId) continue
    if (entry && typeof entry === "object" && "scenario_id" in entry) {
      out[groupId] = { ...entry, scenario_id: groupId } as T
    } else {
      out[groupId] = entry
    }
  }
  return out
}

/**
 * CategoryView: Outcomes organized by category with collapsible sections
 */
export default function CategoryView() {
  const theme = useTheme()
  const { selectedScenarios: allSelectedScenarios } = useWorkspaceSlice()
  // Data in Depth compares at most MAX_DATA_IN_DEPTH_SCENARIOS. Cap once here so
  // the column rendering matches the capped batch fetch in
  // useResolvedSelectedScenarios. Other tools use the full selection.
  const selectedScenarios = useMemo(
    () => allSelectedScenarios.slice(0, MAX_DATA_IN_DEPTH_SCENARIOS),
    [allSelectedScenarios],
  )
  const [expanded, setExpanded] = React.useState<string[]>([])
  const [hasBeenExpanded, setHasBeenExpanded] = React.useState<Set<string>>(
    new Set(),
  )

  const { getDisplayName } = useScenarioList()

  // Resolve the user's selected sibling-group ids to short_codes for the
  // active hydroclimate. The batch endpoint speaks short_codes. The rest
  // of the UI (and all section components) speaks sibling-group ids, so
  // we re-key the response below before forwarding.
  const resolved = useResolvedSelectedScenarios()

  // Single batch fetch covering storage, CWS, AG, and env_flow for every
  // resolved scenario. `rawBatchData` is keyed by short_code from the API.
  // The `batchData` memo below re-keys it by sibling-group id so sections
  // can keep using `batchData?.<type>?.[scenarioId]` against group ids.
  // Sections backed by endpoints not in the batch (refuge, delta monthly,
  // M&I contractors, demand units, spill) still use `useMultiScenarioSlots`.
  const { data: rawBatchData, isLoading: isBatchLoading } = useBatchStatistics(
    resolved.resolvedIds,
    { types: ["storage", "cws", "ag", "env_flow"] },
  )

  const batchData = useMemo<BatchStatisticsResponse | undefined>(() => {
    if (!rawBatchData) return rawBatchData
    const map = resolved.resolvedToGroup
    return {
      scenarios: resolved.selectedGroupIds.filter(
        (id) => resolved.groupToResolved[id] != null,
      ),
      storage: rekeyByGroup(rawBatchData.storage, map),
      cws: rekeyByGroup(rawBatchData.cws, map),
      ag: rekeyByGroup(rawBatchData.ag, map),
      env_flow: rekeyByGroup(rawBatchData.env_flow, map),
    }
  }, [rawBatchData, resolved])

  // Build scenario ID to display name mapping for selected scenarios
  const scenarioNames = useMemo(() => {
    const names: Record<string, string> = {}
    selectedScenarios.forEach((id) => {
      names[id] = getDisplayName(id)
    })
    return names
  }, [selectedScenarios, getDisplayName])

  const handleAccordionChange = (categoryId: string) => {
    setExpanded((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
    setHasBeenExpanded((prev) => {
      if (prev.has(categoryId)) return prev
      const next = new Set(prev)
      next.add(categoryId)
      return next
    })
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
      }}
    >
      {outcomeCategories.map((category) => {
        const metrics = getMetricsByCategory(category.id)
        const tierMetrics = metrics.filter((m) => m.isTier)
        const nonTierMetrics = metrics.filter((m) => !m.isTier)
        const isExpanded = expanded.includes(category.id)
        const categoryColor = getOutcomeCategoryColor(theme, category.id)
        const SectionComponent = SECTION_COMPONENTS[category.id]

        return (
          <Accordion
            key={category.id}
            expanded={isExpanded}
            onChange={() => handleAccordionChange(category.id)}
            sx={getAccordionStyles(theme, isExpanded)}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ color: theme.palette.grey[400] }} />
              }
              sx={getSummaryStyles(theme, categoryColor, isExpanded)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.space.gap.lg,
                  width: "100%",
                }}
              >
                <Box sx={getIconChipStyles(theme, categoryColor)}>
                  {category.icon}
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    flex: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                pt: theme.space.component.lg,
                px: theme.space.component.xl,
                pb: theme.space.component.xl,
                backgroundColor: theme.palette.background.toolPanel,
              }}
            >
              {/* Lazy-mount the section body the first time it is opened. */}
              {!hasBeenExpanded.has(category.id) ? null : SectionComponent ? (
                <SectionComponent
                  scenarios={selectedScenarios}
                  scenarioNames={scenarioNames}
                  batchData={batchData}
                  isBatchLoading={isBatchLoading}
                />
              ) : (
                <>
                  {/* Tier-only categories (groundwater, salmon) */}
                  {tierMetrics.length > 0 && (
                    <Box sx={{ mb: theme.space.section.sm }}>
                      <Typography
                        variant="compactCaptionMedium"
                        sx={{
                          display: "block",
                          mb: theme.space.component.lg,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Outcome Tiers
                      </Typography>
                      {tierMetrics.map((metric) => (
                        <MetricCard
                          key={metric.id}
                          metric={metric}
                          scenarios={selectedScenarios}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}

              {/* Additional non-tier metrics, only for categories that have
                  neither a custom section nor a tier-only fallback. */}
              {nonTierMetrics.length > 0 &&
                !SectionComponent &&
                category.id !== "groundwater-storage" &&
                category.id !== "salmon-abundance" && (
                  <Box>
                    {tierMetrics.length > 0 && (
                      <Typography
                        variant="compactCaptionMedium"
                        sx={{
                          display: "block",
                          mb: theme.space.component.lg,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Additional Metrics
                      </Typography>
                    )}
                    {nonTierMetrics.map((metric) => (
                      <MetricCard
                        key={metric.id}
                        metric={metric}
                        scenarios={selectedScenarios}
                      />
                    ))}
                  </Box>
                )}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}
