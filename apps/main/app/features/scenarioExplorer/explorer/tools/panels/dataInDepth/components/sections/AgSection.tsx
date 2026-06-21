"use client"

/**
 * AgSection - Agricultural Water section for the Data Explorer
 *
 * Displays agricultural delivery and productivity data:
 * - Revenue tier distribution (AG_REV)
 * - Monthly delivery percentile charts for AG aggregates and demand units
 *
 * Uses the same CSS Grid layout patterns as CwsSection and ReservoirStorageSection.
 */

import React, { useState, useMemo, useEffect } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { CompactSelect } from "@repo/ui"
import { PercentileMatrix } from "@repo/viz"
import type { ReservoirData, VolumeScaleMode } from "@repo/viz"
import { TierGlyphWithTooltip } from "../../../../../../../tooltips/TierGlyphWithTooltip"
import type { ChartDataPoint } from "../../../../../../../scenarios/components/shared"
import { ChartGridProvider } from "../shared/ChartGridContext"
import { PercentileMatrixSkeleton } from "../shared/PercentileMatrixSkeleton"
import { ExpandableSection } from "../shared/ExpandableSection"
import { useAgDemandUnitsList } from "@repo/data/coeqwal/hooks"
import type { AgDemandUnitListItem, BatchAgData } from "@repo/data/coeqwal"
import { useMultiScenarioAgData } from "../../hooks/useAgData"
import {
  getMetricsByCategory,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../../hooks/useMetricData"
import { useHydroclimateAvailability } from "../../../../../../../scenarios/hooks"
import { HydroclimateUnavailablePlaceholder } from "../../../../../../../scenarios/components/HydroclimateUnavailablePlaceholder"
import { SectionHeader } from "../shared/SectionHeader"
import { TIER_CHART_SIZE } from "../shared/chartConstants"
import { DELIVERY_BAND_COLORS } from "../../config/bandColors"
import type { BatchSectionProps } from "../shared/sectionTypes"
import { AddedEntityChips } from "../shared/AddedEntityChips"
import { OverlappingBandsLegend } from "../shared/OverlappingBandsLegend"
import { AddEntityPicker } from "../shared/AddEntityPicker"

// ============================================================================
// Constants
// ============================================================================

// Get the agricultural tier metric (constant, safe to call outside component)
const AG_TIER_METRIC = getMetricsByCategory("agricultural-water").find(
  (m) => m.isTier,
)

const AG_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

/** Human-readable label for each hydrologic region code */
const AG_REGION_LABELS: Record<string, string> = {
  SAC: "Sacramento",
  SJR: "San Joaquin",
  TULARE: "Tulare",
}

// ============================================================================
// Ag Tier Row Component
// ============================================================================

interface AgTierChartsProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Sibling-group ids with no variant for the active hydroclimate */
  missingSet: Set<string>
  /** Active hydroclimate value, used to label the missing-variant placeholder */
  hydroclimate: string
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function AgTierCharts({
  scenarios,
  scenarioNames,
  missingSet,
  hydroclimate,
  isModal = false,
}: AgTierChartsProps) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    AG_TIER_METRIC as OutcomeMetric,
  )

  if (!AG_TIER_METRIC) return null

  return (
    <>
      {scenarios.map((scenarioId, index) => {
        if (missingSet.has(scenarioId)) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: TIER_CHART_SIZE,
              }}
            >
              <HydroclimateUnavailablePlaceholder
                hydroclimate={hydroclimate}
                groupId={scenarioId}
                variant="inline"
              />
            </Box>
          )
        }

        if (isLoading) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )
        }

        // Special case: s0011 is the baseline scenario
        if (scenarioId === "s0011") {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.sm,
                  border: theme.border.medium,
                  width: TIER_CHART_SIZE,
                  height: TIER_CHART_SIZE,
                  px: theme.space.component.xs,
                }}
              >
                <Typography
                  variant="compactMicro"
                  sx={{
                    color: theme.palette.grey[500],
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Baseline
                </Typography>
              </Box>
            </Box>
          )
        }

        const scenarioData = data?.find((d) => d.scenarioId === scenarioId)
        if (!scenarioData?.tierData) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.grey[400] }}
              >
                -
              </Typography>
            </Box>
          )
        }

        // Convert tier data to ChartDataPoint format
        const chartData: ChartDataPoint[] = scenarioData.tierData.map(
          (tier) => ({
            label: tier.label,
            color: tier.color,
            value: tier.value,
            tierType: tier.tierType,
          }),
        )

        return (
          <Box
            key={scenarioId}
            sx={{
              gridColumn: index + 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TierGlyphWithTooltip
              outcomeCode="AG_REV"
              chartData={chartData}
              scenarioLabel={scenarioNames[scenarioId] || scenarioId}
              size={TIER_CHART_SIZE}
              zIndex={isModal ? theme.zIndex.tooltipAboveModal : undefined}
            />
          </Box>
        )
      })}
    </>
  )
}

// ============================================================================
// Monthly Ag Section Component
// ============================================================================

interface MonthlyAgSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** AG slice of the batched response (keyed by scenario id) */
  agBatch: Record<string, BatchAgData> | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
  isModal?: boolean
}

function MonthlyAgSection({
  scenarios,
  scenarioNames,
  agBatch,
  isBatchLoading,
  isModal = false,
}: MonthlyAgSectionProps) {
  const theme = useTheme()
  const [scaleMode, setScaleMode] = useState<VolumeScaleMode>("absolute")
  const [selectedDemandUnit, setSelectedDemandUnit] = useState<string>("")
  const [additionalDemandUnits, setAdditionalDemandUnits] = useState<string[]>(
    [],
  )

  const { demandUnits: demandUnitsList, isLoading: demandUnitsLoading } =
    useAgDemandUnitsList()

  const { entities, matrixData, cellStats, error, loadingScenarios } =
    useMultiScenarioAgData(
      scenarios,
      agBatch,
      isBatchLoading,
      additionalDemandUnits,
      demandUnitsList,
    )

  // Track when data arrives. We flip false once entities are empty so the
  // skeleton can re-appear if scenarios change
  const [hasReceivedData, setHasReceivedData] = useState(false)
  useEffect(() => {
    if (entities.length > 0) {
      setHasReceivedData(true)
    } else {
      setHasReceivedData(false)
    }
  }, [entities.length])

  // Group options for the "Add a demand unit" CompactSelect: by hydrologic
  // region (Sacramento / San Joaquin / Tulare / Other), with already-added
  // ids removed. Label format is "Agency (du_id)" to disambiguate
  const demandUnitGroups = useMemo(() => {
    if (demandUnitsList.length === 0) return []
    const excludedIds = new Set(additionalDemandUnits)

    const groupedByRegion: Record<string, AgDemandUnitListItem[]> = {}
    demandUnitsList.forEach((du) => {
      if (!du || !du.du_id) return
      const regionLabel = du.hydrologic_region
        ? (AG_REGION_LABELS[du.hydrologic_region] ?? du.hydrologic_region)
        : "Other"
      if (!groupedByRegion[regionLabel]) {
        groupedByRegion[regionLabel] = []
      }
      groupedByRegion[regionLabel].push(du)
    })

    return Object.entries(groupedByRegion)
      .map(([regionLabel, units]) => ({
        label: regionLabel,
        options: units
          .filter((du) => !excludedIds.has(du.du_id))
          .map((du) => ({
            value: du.du_id,
            // Agency strings can already contain "(X% of total)" to mark
            // entities split across multiple model DUs by acreage. No need
            // to append the du_id, which would produce two parentheticals
            label: du.agency ?? du.du_id,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .filter((g) => g.options.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [demandUnitsList, additionalDemandUnits])

  const handleAddDemandUnit = () => {
    if (
      selectedDemandUnit &&
      !additionalDemandUnits.includes(selectedDemandUnit)
    ) {
      setAdditionalDemandUnits((prev) => [...prev, selectedDemandUnit])
      setSelectedDemandUnit("")
    }
  }

  const handleRemoveDemandUnit = (duId: string) => {
    setAdditionalDemandUnits((prev) => prev.filter((id) => id !== duId))
  }

  const reservoirData: ReservoirData[] = useMemo(
    () =>
      entities.map((entity) => ({
        reservoirId: entity.shortCode,
        reservoirName: entity.label,
        capacityTaf: 0,
        deadPoolTaf: 0,
      })),
    [entities],
  )

  return (
    <>
      {/* Header row: title/legend on the left, "add a demand unit" controls on the right */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.space.component.sm,
        }}
      >
        <SectionHeader
          title="Monthly deliveries"
          titleAdornment={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.space.gap.sm,
              }}
            >
              <Typography
                variant="compactCaption"
                sx={{ color: theme.palette.grey[500] }}
              >
                shown on
              </Typography>
              <CompactSelect
                value={scaleMode}
                onChange={setScaleMode}
                options={AG_SCALE_OPTIONS}
                aria-label="Scale mode"
                menuZIndex={isModal ? 9999 : undefined}
              />
            </Box>
          }
          description={
            <>
              Water year (Oct-Sep) · {scenarios.length} scenario
              {scenarios.length !== 1 ? "s" : ""}
              <OverlappingBandsLegend
                colors={DELIVERY_BAND_COLORS}
                caption="Upper chart region = wetter-year delivery · Lower chart region = drier-year delivery"
              />
            </>
          }
        />

        {/* Add demand unit controls */}
        <AddEntityPicker
          value={selectedDemandUnit}
          onChange={setSelectedDemandUnit}
          groups={demandUnitGroups}
          onAdd={handleAddDemandUnit}
          placeholder="add a demand unit"
          disabled={demandUnitsLoading}
          selectAriaLabel="Select demand unit to add"
          isModal={isModal}
        />
      </Box>

      {/* Added demand-unit chips */}
      <AddedEntityChips
        items={additionalDemandUnits.map((id) => ({
          id,
          label: demandUnitsList.find((d) => d.du_id === id)?.agency ?? id,
        }))}
        onRemove={handleRemoveDemandUnit}
      />

      {/* Loading state with skeleton. Five aggregate rows plus any added DUs */}
      {!hasReceivedData && !error && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrixSkeleton
            scenarios={scenarios}
            rowCount={5 + additionalDemandUnits.length}
            message="Loading AG data..."
            labelColumnWidth={140}
          />
        </Box>
      )}

      {/* Error state, only when there's nothing to show */}
      {error && entities.length === 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            py: theme.space.component.lg,
            px: theme.space.component.md,
            backgroundColor: theme.palette.grey[50],
            borderRadius: theme.borderRadius.sm,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.grey[500] }}
          >
            Could not load AG data: {error}
          </Typography>
        </Box>
      )}

      {/* Matrix */}
      {hasReceivedData && entities.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrix
            reservoirs={reservoirData}
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            data={matrixData}
            responsive
            labelColumnWidth={140}
            showScenarioHeaders={false}
            displayMode="volume"
            volumeScaleMode={scaleMode}
            colorScheme="delivery"
            cellStats={cellStats}
            loadingScenarios={loadingScenarios}
          />
        </Box>
      )}
    </>
  )
}

// ============================================================================
// Main Ag Section Export
// ============================================================================

interface AgContentProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** AG slice of the batched response (keyed by scenario id). */
  agBatch: Record<string, BatchAgData> | undefined
  isBatchLoading: boolean
  /** Sibling-group ids with no variant for the active hydroclimate. */
  missing: string[]
  missingSet: Set<string>
  hydroclimate: string
  /** Whether this is rendered inside the expand modal. */
  isModal?: boolean
}

/**
 * AgContent - the section body: revenue tier distribution plus the monthly
 * delivery charts. Rendered both inline and inside the expand MobileModal so
 * the two views stay in sync. Callers supply the outer spacing wrapper.
 */
function AgContent({
  scenarios,
  scenarioNames,
  agBatch,
  isBatchLoading,
  missing,
  missingSet,
  hydroclimate,
  isModal = false,
}: AgContentProps) {
  const theme = useTheme()
  return (
    <>
      {/* Revenue tier section */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.md,
          border: theme.border.light,
          boxShadow: theme.shadow.subtle,
          p: theme.space.component.lg,
          mb: theme.space.component.lg,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          {/* Title in column 1, charts in scenario columns - all on same row */}
          <Box sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}>
            <SectionHeader
              title="Revenue distribution"
              description="134 agricultural demand units"
            />
          </Box>
          <AgTierCharts
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            missingSet={missingSet}
            hydroclimate={hydroclimate}
            isModal={isModal}
          />
        </ChartGridProvider>
      </Box>

      {/* Monthly delivery section */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.md,
          border: theme.border.light,
          boxShadow: theme.shadow.subtle,
          p: theme.space.component.lg,
        }}
      >
        {missing.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: theme.space.gap.sm,
              mb: theme.space.component.sm,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.grey[600] }}
            >
              Unavailable in this hydroclimate:
            </Typography>
            {missing.map((groupId) => (
              <HydroclimateUnavailablePlaceholder
                key={groupId}
                hydroclimate={hydroclimate}
                groupId={groupId}
                variant="inline"
              />
            ))}
          </Box>
        )}
        <ChartGridProvider scenarios={scenarios}>
          <MonthlyAgSection
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            agBatch={agBatch}
            isBatchLoading={isBatchLoading}
            isModal={isModal}
          />
        </ChartGridProvider>
      </Box>
    </>
  )
}

export default function AgSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: BatchSectionProps) {
  const agBatch = batchData?.ag

  // Columns whose sibling-group id has no scenario variant for the active
  // hydroclimate. Used to swap the per-column tier glyph for the inline
  // placeholder, and to surface a small "Unavailable" strip above the
  // monthly-deliveries block. Stays empty in production today since every
  // group has all three variants
  const { missing, hydroclimate } = useHydroclimateAvailability(scenarios)
  const missingSet = useMemo(() => new Set(missing), [missing])

  return (
    <ExpandableSection
      scenarios={scenarios}
      scenarioNames={scenarioNames}
      categoryId="agricultural-water"
      title="Agricultural water"
      contentAriaLabel="Agricultural water data visualization"
      renderBody={(isModal) => (
        <AgContent
          scenarios={scenarios}
          scenarioNames={scenarioNames}
          agBatch={agBatch}
          isBatchLoading={isBatchLoading}
          missing={missing}
          missingSet={missingSet}
          hydroclimate={hydroclimate}
          isModal={isModal}
        />
      )}
    />
  )
}
