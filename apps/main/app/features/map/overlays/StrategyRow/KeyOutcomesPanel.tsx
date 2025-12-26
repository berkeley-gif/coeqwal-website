/**
 * KeyOutcomesPanel - Shows key outcomes glyphs
 *
 * Used in the Learn section scrollytelling.
 * Uses the same layout style as ScenarioCard.
 */

import { useCallback } from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { InfoIconButton, ClickTooltip } from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import {
  OUTCOME_DISPLAY_ORDER,
  useScenarioTiers,
} from "../../../scenarios/hooks"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"
import { useTierTooltipState } from "../../../tooltips/useTierTooltipState"
import { learnMapActions, useSelectedOutcome } from "../../store"
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

  // Get current selected outcome for toggle behavior
  const selectedOutcome = useSelectedOutcome()

  // Handler to show outcome data on the map (toggle behavior)
  const handleShowOnMap = useCallback(
    (outcome: string) => {
      handleClose() // Close tooltip when showing on map
      // Toggle: if same outcome is already selected, clear it; otherwise set it
      learnMapActions.setSelectedOutcome(
        selectedOutcome === outcome ? null : outcome,
      )
    },
    [handleClose, selectedOutcome],
  )

  // Helper function to get tier values for an outcome
  const getTierValues = (outcome: string): [number, number, number, number] => {
    const tierData = chartData[outcome]
    if (!tierData || tierData.length !== 4) {
      return [0, 0, 0, 0]
    }
    return [
      tierData[0]?.value ?? 0,
      tierData[1]?.value ?? 0,
      tierData[2]?.value ?? 0,
      tierData[3]?.value ?? 0,
    ]
  }

  // Shared outcome item renderer
  const renderOutcomeItem = (outcome: string, variant: "bars" | "dots") => {
    const tierData = chartData[outcome]
    const hasData =
      tierData !== undefined &&
      tierData.length > 0 &&
      tierData.some((tier) => tier.value > 0)

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
        <Box
          onClick={() => handleShowOnMap(outcome)}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            p: 0.5,
            borderRadius: theme.borderRadius.md,
            transition: theme.transition.default,
            opacity: isLoading ? 0.5 : hasData ? 1 : 0.7,
            minWidth: 0, // Allow grid item to shrink
            overflow: "hidden",
            "&:hover": {
              backgroundColor: theme.palette.grey[100],
            },
          }}
        >
          {hasData ? (
            <ScenarioGlyph
              tierColors={[
                theme.palette.tiers.tier1,
                theme.palette.tiers.tier2,
                theme.palette.tiers.tier3,
                theme.palette.tiers.tier4,
              ]}
              values={getTierValues(outcome)}
              variant={variant}
              size={glyphSize}
            />
          ) : (
            <Box
              sx={{
                width: glyphSize,
                height: glyphSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.palette.grey[100],
                borderRadius: theme.borderRadius.md,
                border: theme.border.medium,
              }}
            >
              <Typography
                variant="compactMicro"
                sx={{
                  color: theme.palette.text.primary,
                  textAlign: "center",
                  lineHeight: 1.2, // Tighter than variant default for data viz
                  px: 0.5,
                }}
              >
                No data at this time
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              minHeight: "2rem",
              width: "100%",
            }}
          >
            <Typography
              variant="compactMicro"
              sx={{
                color: hasData
                  ? theme.palette.blue.darkest
                  : theme.palette.grey[500],
                fontWeight: theme.typography.fontWeightMedium,
                textAlign: "center",
                lineHeight: 1.2, // Tighter than variant default for data viz
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {outcome}
            </Typography>
            <InfoIconButton
              isActive={openTooltip === outcome}
              onClick={(e) => {
                e.stopPropagation()
                handleToggle(outcome)
              }}
              title="Click for outcome details"
            />
          </Box>
        </Box>
      </ClickTooltip>
    )
  }

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
        {OUTCOME_DISPLAY_ORDER.slice(0, 5).map((outcome) =>
          renderOutcomeItem(outcome, "bars"),
        )}
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
        {OUTCOME_DISPLAY_ORDER.slice(5).map((outcome) =>
          renderOutcomeItem(outcome, "dots"),
        )}
      </Box>
    </Box>
  )
}

export default KeyOutcomesPanel
