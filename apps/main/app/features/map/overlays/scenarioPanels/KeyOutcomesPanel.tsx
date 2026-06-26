"use client"

/**
 * KeyOutcomesPanel - Shows key outcomes glyphs
 *
 * Used in the Learn section scrollytelling.
 * Uses shared OutcomeGlyphItem components with ClickTooltip wrappers.
 */

import { useEffect } from "react"
import { preload } from "@repo/data/swr"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { ClickTooltip } from "@repo/ui"
import { fetchScenarioTiers } from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import {
  OUTCOME_CODE_ORDER,
  getOutcomeName,
  useResolvedIdMapping,
  useResolvedIdMappings,
  useScenarioTiers,
} from "../../../scenarios/hooks"
import { OutcomeGlyphItem } from "../../../scenarios/components/shared"
import { HydroclimateGate } from "../../../scenarios/components/HydroclimateGate"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"
import { useTierTooltipState } from "../../../tooltips/useTierTooltipState"
import { useMapVisualizationAction, useActiveMapOutcome } from "../../hooks"
import type { OutcomeCode } from "../../../../content/outcomes"

interface KeyOutcomesPanelProps {
  scenarioId?: string
  onTitleClick?: () => void
}

export function KeyOutcomesPanel({
  scenarioId = "s0020",
  onTitleClick,
}: KeyOutcomesPanelProps) {
  const theme = useTheme()

  // Responsive glyph size: 50px at sm, 60px at md+
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"))
  const glyphSize = isMdUp ? 60 : 50

  // Use unified tooltip state management
  const { openTooltip, handleToggle, handleClose } = useTierTooltipState()

  // Resolve the sibling-group scenarioId (e.g. "s0020") to the per-hydroclimate
  // variant short_code so the bar chart tiers reflect the user's hydroclimate
  // selection in the KeyOperationsPanel above. `null` means this sibling
  // group has no variant for the active hydroclimate, in which case
  // `useScenarioTiers` no-ops and `HydroclimateGate` renders a placeholder.
  const { idMapping } = useResolvedIdMapping()
  const resolvedScenarioId = idMapping[scenarioId] ?? null

  // Warm SWR for every hydroclimate variant so switching climates never
  // triggers a round-trip (and therefore never flashes "no data").
  const allMappings = useResolvedIdMappings()
  useEffect(() => {
    for (const { idMapping: hcMapping } of Object.values(allMappings)) {
      const variantId = hcMapping[scenarioId]
      if (!variantId) continue
      preload(CACHE_KEYS.scenarioTiers(variantId), () =>
        fetchScenarioTiers(variantId),
      )
    }
  }, [scenarioId, allMappings])

  // Fetch tier data for the scenario
  const { chartData, isLoading } = useScenarioTiers(resolvedScenarioId)

  // Shared map visualization action and active state. Use the
  // hydroclimate-aware variant so the map layer updates when the user
  // changes hydroclimate via the chooser in the KeyOperationsPanel.
  const { showOnMapForGroup } = useMapVisualizationAction()
  const activeVisualization = useActiveMapOutcome()
  const selectedOutcomeCode = activeVisualization?.outcomeCode ?? null

  const handleShowOnMap = (code: OutcomeCode) => {
    handleClose()
    showOnMapForGroup(code, scenarioId)
  }

  // Helper to check if outcome has valid data (by code)
  const hasData = (code: string): boolean => {
    const tierData = chartData[code]
    return (
      tierData !== undefined &&
      tierData.length > 0 &&
      tierData.some((tier) => tier.value > 0)
    )
  }

  // Shared outcome item renderer with tooltip wrapper (iterates over codes)
  const renderOutcomeItem = (code: OutcomeCode) => {
    const displayName = getOutcomeName(code)
    const isActive = hasData(code)

    return (
      <ClickTooltip
        key={code}
        open={openTooltip === code}
        onClose={handleClose}
        placement="left"
        width="450px"
        closeOnScroll
        content={
          <>
            <TierTooltipContent outcomeCode={code} showTitle={true} />
            <Typography
              variant="compactSubtitle"
              sx={{
                display: "block",
                mt: 1.5,
                fontStyle: "italic",
              }}
            >
              Click{" "}
              <Box
                component="span"
                onClick={() => handleShowOnMap(code)}
                sx={{
                  color: theme.palette.blue.bright,
                  textDecoration: "underline",
                  cursor: "pointer",
                  "&:hover": { color: theme.palette.blue.dark },
                }}
              >
                here
              </Box>{" "}
              or on chart to show values on map.
            </Typography>
          </>
        }
      >
        <Box>
          <OutcomeGlyphItem
            displayName={displayName}
            name={displayName}
            chartData={chartData[code]}
            isActive={!isLoading && isActive}
            isSelected={selectedOutcomeCode === code}
            isTooltipActive={openTooltip === code}
            size={glyphSize}
            showLabel={true}
            showInfoButton={true}
            showSortButton={false}
            morphEnabled
            compact
            onGlyphClick={() => handleShowOnMap(code)}
            onInfoClick={(e) => {
              e.stopPropagation()
              handleToggle(code)
            }}
          />
        </Box>
      </ClickTooltip>
    )
  }

  // Multiple location outcomes (first 5) and single location outcomes (remaining)
  const multipleLocationOutcomes = OUTCOME_CODE_ORDER.slice(0, 5)
  const singleLocationOutcomes = OUTCOME_CODE_ORDER.slice(5)

  return (
    <Box
      sx={{
        ...theme.scenarios.learnPanel.base,
        boxShadow: theme.shadow.sm,
        width: "100%",
        maxWidth: theme.scenarios.learnPanel.maxWidth,
      }}
    >
      <Typography
        variant="subtitle2"
        onClick={onTitleClick}
        sx={{
          ...theme.scenarios.panelTitle,
          // Tightened so the section labels below sit closer to the
          // panel title; reclaims vertical runway so the full panel
          // stack fits on shorter screens.
          mb: theme.space.component.xs,
        }}
      >
        Key outcomes
      </Typography>

      <HydroclimateGate scenarioId={scenarioId} variant="block">
        {/* Multiple location outcomes - first 5 */}
        <Typography
          variant="compactCaptionMedium"
          sx={{ mb: theme.space.component.sm }}
        >
          Multiple location outcomes
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)" },
            gap: theme.space.gap.sm,
            alignItems: "start",
            // Tightened gap between the two grids so "Single location
            // outcomes" sits closer to the "Multiple location outcomes"
            // grid above it.
            mb: theme.space.component.xs,
          }}
        >
          {multipleLocationOutcomes.map(renderOutcomeItem)}
        </Box>

        {/* Single location outcomes - last 4 */}
        <Typography
          variant="compactCaptionMedium"
          sx={{ mb: theme.space.component.sm }}
        >
          Single location outcomes
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
            gap: theme.space.gap.sm,
            alignItems: "start",
          }}
        >
          {singleLocationOutcomes.map(renderOutcomeItem)}
        </Box>
      </HydroclimateGate>
    </Box>
  )
}

export default KeyOutcomesPanel
