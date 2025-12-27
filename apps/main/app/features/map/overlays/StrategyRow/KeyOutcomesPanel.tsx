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
import type { KeyOutcomesPanelProps } from "./types"
import { panelBaseStyles, panelMaxWidth, getTitleStyles } from "./styles"

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
      // Toggle: if same outcome is already selected, clear it; otherwise set it
      if (selectedOutcome === outcome) {
        mapActions.clearOutcomeVisualization()
      } else {
        mapActions.setOutcomeVisualization(outcome, "current-ops")
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
            <Box
              component="span"
              sx={{
                ...theme.typography.compact.subtitle,
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
                  fontStyle: "normal",
                  "&:hover": { color: theme.palette.blue.dark },
                }}
              >
                here
              </Box>{" "}
              or on chart to show values on map.
            </Box>
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
        ...panelBaseStyles,
        boxShadow: theme.shadow.sm,
        width: "100%",
        maxWidth: panelMaxWidth,
      }}
    >
      <Typography
        variant="subtitle2"
        onClick={onTitleClick}
        sx={{
          ...getTitleStyles(theme, !!onTitleClick),
          mb: 1,
        }}
      >
        Key outcomes
      </Typography>

      {/* Multiple location outcomes - first 5 */}
      <Typography
        variant="compactMicro"
        sx={{
          display: "block",
          mb: 1,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[600],
          letterSpacing: "0.5px",
        }}
      >
        Multiple location outcomes
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(5, 1fr)" },
          gap: 1,
          alignItems: "start",
          mb: 1.5,
        }}
      >
        {multipleLocationOutcomes.map(renderOutcomeItem)}
      </Box>

      {/* Single location outcomes - last 4 */}
      <Typography
        variant="compactMicro"
        sx={{
          display: "block",
          mb: 1,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[600],
          letterSpacing: "0.5px",
        }}
      >
        Single location outcomes
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" },
          gap: 1,
          alignItems: "start",
        }}
      >
        {singleLocationOutcomes.map(renderOutcomeItem)}
      </Box>
    </Box>
  )
}

export default KeyOutcomesPanel
