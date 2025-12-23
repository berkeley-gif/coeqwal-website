import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { useOutcomeDefinitions } from "../scenarios/hooks"
import { outcomeTierValues } from "../../content/outcomes"

interface TierTooltipContentProps {
  outcome: string
  showTitle?: boolean
}

// Format description text with bold markdown (**text**)
export const formatDescription = (text: string, fontWeightMedium: number = 500) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <span key={index} style={{ fontWeight: fontWeightMedium }}>
          {content}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// Format tier text with emphasized keywords, numbers, and markdown
export const formatTierText = (text: string, fontWeightMedium: number = 500) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <span key={index} style={{ fontWeight: fontWeightMedium }}>
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
          <span key={key} style={{ fontWeight: fontWeightMedium }}>
            {subPart}
          </span>
        )
      }
      if (subPart.match(/^\d+%$/)) {
        return (
          <span key={key} style={{ fontWeight: fontWeightMedium }}>
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
            ...theme.typography.nav,
            fontWeight: theme.typography.fontWeightSemiBold,
            display: "block",
            mb: 1,
          }}
        >
          {outcome}
        </Box>
      )}

      <Box
        component="div"
        sx={{
          ...theme.typography.nav,
          mb: 1.5,
        }}
      >
        {formatDescription(
          (outcomeDefinitions as Record<string, string>)[outcome] ||
            "Definition not available",
          theme.typography.fontWeightMedium as number,
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          component="span"
          sx={{
            ...theme.typography.nav,
            fontWeight: theme.typography.fontWeightSemiBold,
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
                borderRadius: theme.borderRadius.xs,
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
                ...theme.typography.nav,
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
                theme.typography.fontWeightMedium as number,
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
