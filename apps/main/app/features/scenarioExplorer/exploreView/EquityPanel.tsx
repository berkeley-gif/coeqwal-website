"use client"

/**
 * EquityPanel - Tier Grid.
 *
 * Displays water tier allocations across different categories and scenarios
 * using an interactive tier-based grid visualization.
 */

import { useMemo, useState, useCallback, useEffect } from "react"
import { Box, useTheme, CircularProgress } from "@repo/ui/mui"
import { TierGrid, type TierGridProps } from "@repo/viz"
import { useTiers } from "@repo/data/coeqwal/hooks"
import { useTierLocationAssignments } from "@repo/data/coeqwal/hooks"
import { useScenarioExplorerStore } from "../store"
import { mapActions, useMapStore } from "../../map/store"
import { TIER_LABELS } from "../../../content/tiers"
import { getOutcomeLocationCoordinates } from "../../map/config/outcomeLocations"

const TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

export default function EquityPanel() {
  const theme = useTheme()

  // Get currently selected scenarios and comparison mode from the store
  const { selectedScenarios, showEquityComparison, showMap } =
    useScenarioExplorerStore()

  // Use the first selected scenario, or fallback to baseline
  const currentScenario = selectedScenarios[0] || "s0020"
  const baselineScenario = "s0020"

  // Fetch all tier metadata
  const { tiers: allTiers, isLoading: tiersLoading } = useTiers()

  // Get active tier codes for fetching location assignments
  const activeTierCodes = useMemo(() => {
    return allTiers?.filter((t) => t.is_active).map((t) => t.short_code) || []
  }, [allTiers])

  // Fetch location assignments for current scenario
  const tierLocationResults = activeTierCodes.map((tierCode) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTierLocationAssignments(currentScenario, tierCode),
  )

  // Fetch baseline location assignments when comparison mode is ON
  const baselineTierLocationResults = activeTierCodes.map((tierCode) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTierLocationAssignments(
      showEquityComparison ? baselineScenario : currentScenario,
      tierCode,
    ),
  )

  // Check if any tier location data is still loading
  const tierLocationsLoading = tierLocationResults.some((r) => r.isLoading)
  const baselineLocationsLoading = baselineTierLocationResults.some(
    (r) => r.isLoading,
  )
  const isLoading =
    tiersLoading || tierLocationsLoading || baselineLocationsLoading

  const [selectedObjectives, setSelectedObjectives] = useState<
    TierGridProps["objectives"]
  >([])

  // Watch for map location highlights being cleared to deselect all objectives
  const locationHighlights = useMapStore((state) => state.locationHighlights)

  useEffect(() => {
    // When location highlights are cleared (empty array), clear selections
    if (locationHighlights.length === 0) {
      setSelectedObjectives([])
    }
  }, [locationHighlights])

  // Transform tier location data to tier grid format
  const { objectives, categories } = useMemo(() => {
    if (!allTiers) {
      return { objectives: [], categories: [] }
    }

    // Return empty data only if we've never loaded anything yet
    if (tierLocationsLoading && tierLocationResults.every((r) => !r.data)) {
      return { objectives: [], categories: [] }
    }

    const result: TierGridProps["objectives"] = []
    const categorySet = new Set<string>()
    let globalId = 0

    // Build a map of baseline tier levels by location ID
    const baselineTierMap = new Map<string, number>()
    if (showEquityComparison) {
      baselineTierLocationResults.forEach((baselineResult) => {
        if (baselineResult.data) {
          baselineResult.data.locations.forEach((location) => {
            baselineTierMap.set(location.location_id, location.tier_level)
          })
        }
      })
    }

    // Process each tier's location assignments
    tierLocationResults.forEach((tierResult, idx) => {
      const tierCode = activeTierCodes[idx]
      const tierMetadata = allTiers.find((t) => t.short_code === tierCode)

      if (!tierResult.data || !tierMetadata) {
        return
      }

      const categoryName = tierMetadata.name
      categorySet.add(categoryName)

      // Create objectives for each location
      tierResult.data.locations.forEach((location) => {
        const currentTierLevel = location.tier_level
        const baselineTierLevel = showEquityComparison
          ? (baselineTierMap.get(location.location_id) ?? currentTierLevel)
          : currentTierLevel

        result.push({
          id: globalId++,
          tier: `Tier ${currentTierLevel}`,
          baselineTier: `Tier ${baselineTierLevel}`,
          category: categoryName,
          locationId: location.location_id,
          locationName: location.location_name,
          tierLevel: currentTierLevel,
          tierCode: tierCode, // Store tier code for coordinate lookup
        })
      })
    })

    return {
      objectives: result,
      categories: Array.from(categorySet),
    }
  }, [
    allTiers,
    tierLocationResults,
    baselineTierLocationResults,
    tierLocationsLoading,
    activeTierCodes,
    showEquityComparison,
  ])

  const handleObjectiveClick = (objective: TierGridProps["objectives"][0]) => {
    setSelectedObjectives((prev) => {
      const isSelected = prev.some(
        (obj) => obj.locationId === objective.locationId,
      )
      // console.log("Selected Objective:", objective)
      if (isSelected) {
        return prev.filter((obj) => obj.locationId !== objective.locationId)
      } else {
        return [...prev, objective]
      }
    })
  }

  const handleCategoryClick = (categoryName: string) => {
    const categoryObjectives = objectives.filter(
      (obj) => obj.category === categoryName,
    )
    setSelectedObjectives(categoryObjectives)
  }

  const handleShowOnMap = useCallback(
    (locationIds: string[]) => {
      console.log("Show on map:", locationIds)

      // Create location highlights from selected objectives
      const highlights = selectedObjectives
        .filter((obj) => locationIds.includes(obj.locationId))
        .map((obj) => {
          // Get tier color based on comparison mode
          let tierColor = "#999"
          if (showEquityComparison) {
            const currentTierNum = parseInt(obj.tier.replace("Tier ", ""))
            const baselineTierNum = parseInt(
              obj.baselineTier.replace("Tier ", ""),
            )
            if (currentTierNum === baselineTierNum) {
              tierColor = "#90caf9" // Light blue - no change
            } else if (currentTierNum < baselineTierNum) {
              tierColor = "#2196f3" // Blue - improved
            } else {
              tierColor = "#f44336" // Red - worsened
            }
          }

          console.log(obj.tierCode, obj.locationId)

          // Get coordinates from tier code and location ID
          const coords = obj.tierCode
            ? getOutcomeLocationCoordinates(obj.tierCode, obj.locationId)
            : null

          return {
            key: obj.locationId,
            longitude: coords?.[0] ?? -121, // TODO: FIX Need real locations
            latitude: coords?.[1] ?? 38.5,
            name: obj.locationName,
            tierLevel: obj.tierLevel,
            tierLabel: TIER_LABELS[obj.tierLevel as 1 | 2 | 3 | 4] || "Unknown",
            tierColor,
            pinned: true,
          }
        })

      // Set location highlights on the map
      mapActions.setLocationHighlights(highlights)

      // Switch to explore mode to show the map
      mapActions.setMapMode("explore")
    },
    [selectedObjectives, showEquityComparison],
  )

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
        height: "100%",
        width: "100%",
        p: theme.space.component.lg,
        position: "relative",
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: 0,
        }}
      >
        <TierGrid
          objectives={objectives}
          categories={categories}
          tiers={TIERS}
          colorMode="tier"
          showComparison={showEquityComparison}
          selectedObjectives={selectedObjectives}
          onObjectiveClick={handleObjectiveClick}
          onCategoryClick={handleCategoryClick}
          onShowOnMap={handleShowOnMap}
          showMapView={showMap}
        />
      </Box>

      {/* Show loading overlay when updating scenario data */}
      {isLoading && objectives.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}
    </Box>
  )
}
