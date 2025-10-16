import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoTooltip } from "@repo/ui"
import { useOutcomeDefinitions } from "../../../hooks/useTierData"
import { outcomeTierValues } from "../../../lib/outcomes"

interface OutcomeTooltipProps {
  outcome: string
  children: React.ReactElement
}

// Map outcome keys to display labels
const getOutcomeDisplayLabel = (name: string): string => {
  if (name === "Delta ecology") return "Delta estuary ecology"
  return name
}

// Format description text with bold markdown (**text**)
const formatDescription = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <span key={index} style={{ fontWeight: 500 }}>
          {content}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// Format tier text with emphasized keywords, numbers, and markdown
const formatTierText = (text: string) => {
  // First handle markdown bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, index) => {
    // Handle markdown bold
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <span key={index} style={{ fontWeight: 500 }}>
          {content}
        </span>
      )
    }
    
    // For non-bold parts, emphasize keywords and percentages
    const subParts = part.split(
      /(Optimal:|Suboptimal:|At-risk:|Critical:|Compromised:|\d+%)/g,
    )
    
    return subParts.map((subPart, subIndex) => {
      const key = `${index}-${subIndex}`
      
      if (
        subPart.match(
          /^(Optimal:|Suboptimal:|At-risk:|Critical:|Compromised:)$/,
        )
      ) {
        return (
          <span key={key} style={{ fontWeight: 500 }}>
            {subPart}
          </span>
        )
      }
      if (subPart.match(/^\d+%$/)) {
        return (
          <span key={key} style={{ fontWeight: 500 }}>
            {subPart}
          </span>
        )
      }
      return <span key={key}>{subPart}</span>
    })
  })
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
    lineHeight: 1.4,
    wordBreak: "break-word",
    whiteSpace: "normal",
  },
  tierTextExpanded: {
    lineHeight: 1.4,
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
        {getOutcomeDisplayLabel(outcome)}
      </Typography>
      <Typography variant="body2" component="div" sx={tooltipStyles.description}>
        {formatDescription(
          (outcomeDefinitions as Record<string, string>)[outcome] ||
            "Definition not available",
        )}
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
          <Typography
            variant="body2"
            component="div"
            sx={tooltipStyles.tierTextExpanded}
          >
            {formatTierText(
              (outcomeTierValues as Record<string, any>)[outcome]?.tier1 ||
                "Excellent",
            )}
          </Typography>
        </Box>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier2,
            }}
          />
          <Typography variant="body2" component="div" sx={tooltipStyles.tierText}>
            {formatTierText(
              (outcomeTierValues as Record<string, any>)[outcome]?.tier2 ||
                "Good",
            )}
          </Typography>
        </Box>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier3,
            }}
          />
          <Typography variant="body2" component="div" sx={tooltipStyles.tierText}>
            {formatTierText(
              (outcomeTierValues as Record<string, any>)[outcome]?.tier3 ||
                "Fair",
            )}
          </Typography>
        </Box>
        <Box sx={tooltipStyles.legendRow}>
          <Box
            sx={{
              ...tooltipStyles.tierBox,
              backgroundColor: theme.palette.tiers.tier4,
            }}
          />
          <Typography variant="body2" component="div" sx={tooltipStyles.tierText}>
            {formatTierText(
              (outcomeTierValues as Record<string, any>)[outcome]?.tier4 ||
                "Poor",
            )}
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
