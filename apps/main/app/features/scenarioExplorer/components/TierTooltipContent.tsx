import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { useOutcomeDefinitions } from "../../../hooks/useTierData"
import { outcomeTierValues } from "../../../lib/outcomes"

interface TierTooltipContentProps {
  outcome: string
  showTitle?: boolean
}

// Map outcome keys to display labels (no longer needed - using API names directly)
export const getOutcomeDisplayLabel = (name: string): string => {
  return name
}

// Format description text with bold markdown (**text**)
export const formatDescription = (text: string) => {
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
export const formatTierText = (text: string) => {
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

    const subParts = part.split(
      /(Optimal:|Sub-optimal:|At-risk:|Critical:|Compromised:|\d+%)/g,
    )

    return subParts.map((subPart, subIndex) => {
      const key = `${index}-${subIndex}`

      if (
        subPart.match(
          /^(Optimal:|Sub-optimal:|At-risk:|Critical:|Compromised:)$/,
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

/**
 * Shared tooltip/legend content for tier information
 * Styled to match learn-map ScrollTooltip
 */
export default function TierTooltipContent({
  outcome,
  showTitle = true,
}: TierTooltipContentProps) {
  const theme = useTheme()
  const { definitions: outcomeDefinitions } = useOutcomeDefinitions()

  return (
    <Box sx={{ color: theme.palette.text.primary }}>
      {showTitle && (
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            display: "block",
            mb: 1,
            fontSize: "0.875rem",
            lineHeight: 1.4,
          }}
        >
          {getOutcomeDisplayLabel(outcome)}
        </Box>
      )}

      <Box
        component="div"
        sx={{
          mb: 1.5,
          fontSize: "0.875rem",
          fontWeight: 400,
          lineHeight: 1.4,
        }}
      >
        {formatDescription(
          (outcomeDefinitions as Record<string, string>)[outcome] ||
            "Definition not available",
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: "0.875rem",
            lineHeight: 1.4,
          }}
        >
          Outcome levels:
        </Box>

        {[1, 2, 3, 4].map((tierNum) => (
          <Box
            key={tierNum}
            sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                backgroundColor:
                  theme.palette.tiers[
                    `tier${tierNum}` as keyof typeof theme.palette.tiers
                  ],
                flexShrink: 0,
                mt: "3px", // Align with first line of text
              }}
            />
            <Box
              component="span"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 400,
                lineHeight: 1.4,
              }}
            >
              {formatTierText(
                (
                  outcomeTierValues as Record<
                    string,
                    {
                      tier1: string
                      tier2: string
                      tier3: string
                      tier4: string
                    }
                  >
                )[outcome]?.[
                  `tier${tierNum}` as "tier1" | "tier2" | "tier3" | "tier4"
                ] ||
                  ["Excellent", "Good", "Fair", "Poor"][tierNum - 1] ||
                  "",
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
