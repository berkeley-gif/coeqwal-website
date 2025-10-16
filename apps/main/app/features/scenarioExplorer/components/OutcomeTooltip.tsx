import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoTooltip } from "@repo/ui"
import { useOutcomeDefinitions } from "../../../hooks/useTierData"
import { outcomeTierValues } from "../../../lib/outcomes"

interface OutcomeTooltipProps {
  outcome: string
  children: React.ReactElement
}

// Reusable styles, eventually put in ui package
const tooltipStyles = {
  container: {
    width: "450px",
    padding: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    wordBreak: "break-word",
    hyphens: "auto",
  },
  title: {
    mb: 1,
    fontWeight: 500,
    width: "100%",
    wordBreak: "break-word",
    whiteSpace: "normal",
  },
  description: {
    mb: 2,
    lineHeight: 1.4,
    width: "100%",
    wordBreak: "break-word",
    whiteSpace: "normal",
  },
  legendContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
  },
  legendTitle: {
    fontWeight: 500,
    mb: 0.5,
  },
  legendRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 1,
  },
  tierBox: {
    width: 12,
    minHeight: 12,
    borderRadius: "2px",
    flexShrink: 0,
    alignSelf: "stretch",
  },
  tierText: {
    lineHeight: 1.3,
  },
  tierTextExpanded: {
    lineHeight: 1.3,
    wordBreak: "break-word",
    whiteSpace: "normal",
    flex: 1,
    width: "100%",
  },
} as const

// Outcome tooltip (memoized)
const OutcomeTooltip = React.memo(function OutcomeTooltipComponent({
  outcome,
  children,
}: OutcomeTooltipProps) {
  const theme = useTheme()
  const { definitions: outcomeDefinitions } = useOutcomeDefinitions()

  const tooltipContent = (
    <Box sx={tooltipStyles.container}>
      <Typography variant="body2" sx={tooltipStyles.title}>
        {outcome}
      </Typography>
      <Typography variant="body2" sx={tooltipStyles.description}>
        {(outcomeDefinitions as Record<string, string>)[outcome] ||
          "Definition not available"}
      </Typography>
      {/* Legend */}
      <Box sx={tooltipStyles.legendContainer}>
        <Typography variant="caption" sx={tooltipStyles.legendTitle}>
          Outcome levels:
        </Typography>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier1,
            }}
          />
          <Typography variant="caption" sx={tooltipStyles.tierTextExpanded}>
            {(outcomeTierValues as Record<string, any>)[outcome]?.tier1 ||
              "Excellent"}
          </Typography>
        </Box>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier2,
            }}
          />
          <Typography variant="caption" sx={tooltipStyles.tierText}>
            {(outcomeTierValues as Record<string, any>)[outcome]?.tier2 ||
              "Good"}
          </Typography>
        </Box>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier3,
            }}
          />
          <Typography variant="caption" sx={tooltipStyles.tierText}>
            {(outcomeTierValues as Record<string, any>)[outcome]?.tier3 ||
              "Fair"}
          </Typography>
        </Box>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier4,
            }}
          />
          <Typography variant="caption" sx={tooltipStyles.tierText}>
            {(outcomeTierValues as Record<string, any>)[outcome]?.tier4 ||
              "Poor"}
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <InfoTooltip
      description={tooltipContent}
      placement="top"
      tooltipProps={{
        enterDelay: 300,
        leaveDelay: 0,
        enterNextDelay: 100,
        PopperProps: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -40], // Hack: Move tooltip higher
              },
            },
          ],
        },
        slotProps: {
          tooltip: {
            sx: {
              maxWidth: "none !important",
              width: "auto",
              minWidth: "450px",
            },
          },
        },
      }}
    >
      {children}
    </InfoTooltip>
  )
})

export default OutcomeTooltip
export type { OutcomeTooltipProps }
