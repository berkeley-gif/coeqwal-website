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
  OUTCOME_CODE_ORDER,
  getOutcomeName,
  useScenarioTiers,
} from "../../../scenarios/hooks"
import { OutcomeGlyphItem } from "../../../scenarios/components/shared"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"
import { useTierTooltipState } from "../../../tooltips/useTierTooltipState"
import { mapActions, useActiveOutcomeVisualization } from "../../store"
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

  // Fetch tier data for the scenario
  const { chartData, isLoading } = useScenarioTiers(scenarioId)

  // Get current visualization for toggle behavior (using outcome codes)
  const activeVisualization = useActiveOutcomeVisualization()
  const selectedOutcomeCode = activeVisualization?.outcomeCode ?? null

  // Handler to show outcome data on the map (toggle behavior)
  const handleShowOnMap = useCallback(
    (code: OutcomeCode) => {
      handleClose() // Close tooltip when showing on map
      mapActions.clearMapTooltips() // Clear any pinned map tooltips

      // Toggle: if same outcome is already selected, clear it; otherwise set it
      if (selectedOutcomeCode === code) {
        mapActions.clearOutcomeVisualization()
      } else {
        mapActions.setOutcomeVisualization(code, "s0020")
      }
    },
    [handleClose, selectedOutcomeCode],
  )

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
          mb: theme.space.component.sm,
        }}
      >
        Key outcomes
      </Typography>

      {/* Multiple location outcomes - first 5 */}
      <Typography
        variant="smallSectionLabel"
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
          mb: theme.space.component.md,
        }}
      >
        {multipleLocationOutcomes.map(renderOutcomeItem)}
      </Box>

      {/* Single location outcomes - last 4 */}
      <Typography
        variant="smallSectionLabel"
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
    </Box>
  )
}

export default KeyOutcomesPanel
