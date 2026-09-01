"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { ResilienceView } from "../../../store"

/**
 * ResiliencePanelTitle - two-line header rendered at the top of the
 * chart area.
 *
 * Line 1 (title) names the chart as a noun phrase anchored on the
 * Third-role dimension ("Scenarios as small multiples", "Averaged
 * across outcomes", etc.). Line 2 (subtitle) spells out the scope
 * of the subject the chart exhibits (how many scenarios / outcomes
 * / hydroclimates). This is orthogonal to the sentence-header
 * control bar above the chart, which narrates the current
 * configuration: title = what the chart IS, sentence = how you are
 * currently looking at it.
 *
 * The title follows the same Z-dim / Z-mode framing that the
 * sentence header uses (see `ResilienceControls`), so the two
 * headers stay in lockstep as the user rotates the permutation.
 */
export function ResiliencePanelTitle({
  view,
  scenarioCount,
  outcomeCount,
  climateCount,
}: {
  view: ResilienceView
  scenarioCount: number
  outcomeCount: number
  climateCount: number
}) {
  const theme = useTheme()

  const DIM_PLURAL_TITLECASE: Record<ResilienceView, string> = {
    scenario: "Scenarios",
    outcome: "Outcomes",
    hydroclimate: "Hydroclimates",
  }

  const title = `${DIM_PLURAL_TITLECASE[view]} as small multiples`

  const scopeBits: string[] = []
  if (scenarioCount > 0) {
    scopeBits.push(`${scenarioCount} scenario${scenarioCount === 1 ? "" : "s"}`)
  } else {
    scopeBits.push("entire scenario library")
  }
  scopeBits.push(`${outcomeCount} outcome${outcomeCount === 1 ? "" : "s"}`)
  scopeBits.push(`${climateCount} hydroclimate${climateCount === 1 ? "" : "s"}`)
  const subtitle = scopeBits.join(" · ")

  return (
    <Box
      sx={{
        px: theme.space.component.lg,
        pt: theme.space.component.sm,
        pb: theme.space.component.xs,
      }}
    >
      <Typography
        component="h2"
        sx={{
          m: 0,
          fontSize: "1.0625rem",
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>
      <Typography
        component="div"
        sx={{
          mt: 0.25,
          fontSize: "0.8125rem",
          lineHeight: 1.4,
          color: theme.palette.grey[700],
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  )
}
