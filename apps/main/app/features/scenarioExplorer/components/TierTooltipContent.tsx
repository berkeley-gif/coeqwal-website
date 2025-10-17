import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useOutcomeDefinitions } from "../../../hooks/useTierData"
import { outcomeTierValues } from "../../../lib/outcomes"

interface TierTooltipContentProps {
  outcome: string
  showTitle?: boolean
}

// Map outcome keys to display labels
export const getOutcomeDisplayLabel = (name: string): string => {
  if (name === "Delta ecology") return "Delta estuary ecology" // hack: TODO: fix this
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

/**
 * Shared tooltip/legend content for tier information
 */
export default function TierTooltipContent({
  outcome,
  showTitle = true,
}: TierTooltipContentProps) {
  const theme = useTheme()
  const { definitions: outcomeDefinitions } = useOutcomeDefinitions()

  return (
    <Box>
      {showTitle && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          {getOutcomeDisplayLabel(outcome)}
        </Typography>
      )}

      <Typography
        variant="body2"
        component="div"
        sx={{ mb: 2, lineHeight: 1.4 }}
      >
        {formatDescription(
          (outcomeDefinitions as Record<string, string>)[outcome] ||
            "Definition not available",
        )}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Outcome levels:
        </Typography>

        {[1, 2, 3, 4].map((tierNum) => (
          <Box
            key={tierNum}
            sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
          >
            <Box
              sx={{
                width: 12,
                minHeight: 12,
                borderRadius: "2px",
                backgroundColor:
                  theme.palette.tiers[
                    `tier${tierNum}` as keyof typeof theme.palette.tiers
                  ],
                flexShrink: 0,
                alignSelf: "stretch",
              }}
            />
            <Typography
              variant="body2"
              component="div"
              sx={{ lineHeight: 1.4 }}
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
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
