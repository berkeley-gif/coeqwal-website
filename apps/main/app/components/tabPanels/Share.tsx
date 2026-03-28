"use client"

import React, { useMemo } from "react"
import { Box, Typography, Button, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"
import { useScenarioList } from "../../features/scenarios/hooks"
import { useMultipleScenarioTiers } from "../../features/scenarios/hooks/useTierData"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import ShareScenarioCard from "../../features/scenarioExplorer/components/ShareScenarioCard"

export default function SharePanel() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  const { sharedScenarioIds, hydroclimatePeriod } = useScenarioExplorerStore()

  const { siblingGroups, buildIdMapping } = useScenarioList()

  const idMapping = useMemo(
    () => buildIdMapping(hydroclimatePeriod),
    [buildIdMapping, hydroclimatePeriod],
  )

  const { allChartData, outcomeNames } = useMultipleScenarioTiers(idMapping)

  const scenarioLookup = useMemo(() => {
    const map = new Map<string, { name: string; description: string }>()
    siblingGroups.forEach((s) => {
      map.set(s.scenarioId, { name: s.shortLabel, description: s.label })
    })
    return map
  }, [siblingGroups])

  if (sharedScenarioIds.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 2,
          px: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: theme.palette.text.secondary }}
        >
          Share
        </Typography>
        <Typography
          sx={{
            fontSize: "0.9375rem",
            color: theme.palette.text.secondary,
            textAlign: "center",
            maxWidth: 420,
            opacity: 0.8,
          }}
        >
          No scenarios staged for sharing yet. Go to the Explore tab, find
          scenarios you want to share, and click the share icon on each one.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigateToTab("explore")}
          sx={{
            textTransform: "none",
            mt: 1,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.text.secondary,
          }}
        >
          Go to Explore
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ px: 3, py: 3, maxWidth: 800, mx: "auto" }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.text.secondary }}
      >
        Share
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          color: theme.palette.text.secondary,
          opacity: 0.8,
          mb: 3,
        }}
      >
        {sharedScenarioIds.length} scenario
        {sharedScenarioIds.length !== 1 ? "s" : ""} staged for sharing
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 2,
        }}
      >
        {sharedScenarioIds.map((id) => {
          const info = scenarioLookup.get(id)
          return (
            <ShareScenarioCard
              key={id}
              scenarioId={id}
              name={info?.name ?? id}
              description={info?.description ?? ""}
              chartData={allChartData[id]}
              outcomeNames={outcomeNames}
            />
          )
        })}
      </Box>

      {/* Stub actions for future expansion */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mt: 3,
          pt: 2,
          borderTop: `1px solid rgba(255,255,255,0.2)`,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          disabled
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          Copy link
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          Download PDF
        </Button>
      </Box>
    </Box>
  )
}
