"use client"

/**
 * KeyOutcomesPanel - Shows key outcomes glyphs
 *
 * Used in the Learn section scrollytelling.
 * Uses shared OutcomeGlyphItem components with ClickTooltip wrappers.
 */

import { useCallback } from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { ClickTooltip } from "@repo/ui"
import {
  OUTCOME_DISPLAY_ORDER,
  useScenarioTiers,
} from "../../../scenarios/hooks"
import { OutcomeGlyphItem } from "../../../scenarios/components/shared"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"
import { useTierTooltipState } from "../../../tooltips/useTierTooltipState"
import { mapActions, useActiveOutcomeVisualization } from "../../store"
import { getLearnPanelBaseStyles, learnPanelMaxWidth } from "./learnPanelStyles"
import { getScenarioPanelTitleStyles } from "../../../scenarios/components/shared"

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

  // Fetch tier data for the scenario
  const { chartData, isLoading } = useScenarioTiers(scenarioId)

  // Get current visualization for toggle behavior
  const activeVisualization = useActiveOutcomeVisualization()
  const selectedOutcome = activeVisualization?.outcome ?? null

  // Handler to show outcome data on the map (toggle behavior)
  const handleShowOnMap = useCallback(
    (outcome: string) => {
      handleClose() // Close tooltip when showing on map
      mapActions.clearMapTooltips() // Clear any pinned map tooltips
      // Toggle: if same outcome is already selected, clear it; otherwise set it
      if (selectedOutcome === outcome) {
        mapActions.clearOutcomeVisualization()
      } else {
        mapActions.setOutcomeVisualization(outcome, "s0020")
      }
    },
    [handleClose, selectedOutcome],
  )

  // Helper to check if outcome has valid data
  const hasData = (outcome: string): boolean => {
    const tierData = chartData[outcome]
    return (
      tierData !== undefined &&
      tierData.length > 0 &&
      tierData.some((tier) => tier.value > 0)
    )
  }

  // Shared outcome item renderer with tooltip wrapper
  const renderOutcomeItem = (outcome: string) => {
    const isActive = hasData(outcome)

    return (
      <ClickTooltip
        key={outcome}
        open={openTooltip === outcome}
        onClose={handleClose}
        placement="left"
        width="450px"
        closeOnScroll
        content={
          <>
            <TierTooltipContent outcome={outcome} showTitle={true} />
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
                onClick={() => handleShowOnMap(outcome)}
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
            displayName={outcome}
            name={outcome}
            chartData={chartData[outcome]}
            isActive={!isLoading && isActive}
            isSelected={selectedOutcome === outcome}
            isTooltipActive={openTooltip === outcome}
            size={glyphSize}
            showLabel={true}
            showInfoButton={true}
            showSortButton={false}
            onGlyphClick={() => handleShowOnMap(outcome)}
            onInfoClick={(e) => {
              e.stopPropagation()
              handleToggle(outcome)
            }}
          />
        </Box>
      </ClickTooltip>
    )
  }

  // Multiple location outcomes (first 5) and single location outcomes (remaining)
  const multipleLocationOutcomes = OUTCOME_DISPLAY_ORDER.slice(0, 5)
  const singleLocationOutcomes = OUTCOME_DISPLAY_ORDER.slice(5)

  return (
    <Box
      sx={{
        ...getLearnPanelBaseStyles(theme),
        boxShadow: theme.shadow.sm,
        width: "100%",
        maxWidth: learnPanelMaxWidth,
      }}
    >
      <Typography
        variant="subtitle2"
        onClick={onTitleClick}
        sx={{
          ...getScenarioPanelTitleStyles(theme),
          mb: theme.space.component.sm,
        }}
      >
        Key outcomes
      </Typography>

      {/* Multiple location outcomes - first 5 */}
      <Typography variant="smallSectionLabel" sx={{ mb: theme.space.component.sm }}>
        Multiple location outcomes
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)" },
          gap: theme.space.gap.sm,
          alignItems: "start",
          mb: theme.space.component.md,
        }}
      >
        {multipleLocationOutcomes.map(renderOutcomeItem)}
      </Box>

      {/* Single location outcomes - last 4 */}
      <Typography variant="smallSectionLabel" sx={{ mb: theme.space.component.sm }}>
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
    </Box>
  )
}

export default KeyOutcomesPanel


