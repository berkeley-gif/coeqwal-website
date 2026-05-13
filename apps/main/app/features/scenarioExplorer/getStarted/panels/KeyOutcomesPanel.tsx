"use client"

import { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoCard, MobileModal } from "@repo/ui"
import PanelShell from "./PanelShell"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"
import { getOutcomeName, type OutcomeCode } from "../../../../content/outcomes"

const KEY_OUTCOMES: ReadonlyArray<{
  outcomeCode: OutcomeCode
  title: string
  description: string
}> = [
  {
    outcomeCode: "CWS_DEL",
    title: "Community water deliveries",
    description:
      "Reliability of water supplies to communities to satisfy essential drinking water needs",
  },
  {
    outcomeCode: "AG_REV",
    title: "Agricultural revenue",
    description:
      "Economic productivity of agricultural crops based on water availability",
  },
  {
    outcomeCode: "ENV_FLOWS",
    title: "Environmental flows",
    description:
      "Seasonal patterns of river flows needed to support healthy ecosystems",
  },
  {
    outcomeCode: "DELTA_ECO",
    title: "Delta estuary ecology",
    description:
      "Seasonal patterns of flows needed to support the health of the Bay Delta estuary",
  },
  {
    outcomeCode: "WRC_SALMON_AB",
    title: "Winter-run salmon",
    description:
      "Population status of Sacramento River winter-run Chinook salmon",
  },
  {
    outcomeCode: "FW_DELTA_USES",
    title: "Freshwater for in-Delta uses",
    description:
      "Availability of freshwater in the Delta to support local communities and farms",
  },
  {
    outcomeCode: "FW_EXP",
    title: "Freshwater for Delta exports",
    description: "Availability of freshwater for export to other regions",
  },
  {
    outcomeCode: "RES_STOR",
    title: "Reservoir storage",
    description: "Levels of water stored in major reservoirs",
  },
  {
    outcomeCode: "GW_STOR",
    title: "Groundwater storage",
    description: "Amount and trends of water stored in groundwater basins",
  },
]

export default function KeyOutcomesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const exploreBg = theme.palette.tabPanels.explore
  const [outcomeDefinitionModal, setOutcomeDefinitionModal] =
    useState<OutcomeCode | null>(null)

  return (
    <>
      <PanelShell background={exploreBg}>
        <Typography
          variant="h3"
          component="h2"
          color="text.secondary"
          sx={{ maxWidth: "66%", mb: sp.sm }}
        >
          Key outcomes
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: "66%",
            mb: theme.space.section.md,
            opacity: 0.85,
          }}
        >
          How are scenario results described?
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: "50%", mb: theme.space.section.md }}
        >
          The results of each scenario are summarized by nine key outcomes:
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            alignItems: "stretch",
            columnGap: theme.space.section.sm,
            rowGap: theme.space.section.sm,
          }}
        >
          {KEY_OUTCOMES.map(({ outcomeCode, title, description }) => (
            <InfoCard
              key={outcomeCode}
              title={title}
              description={description}
              variant="onDark"
              onClick={() => setOutcomeDefinitionModal(outcomeCode)}
              ariaLabel={`${title}: open full definition and outcome levels`}
            />
          ))}
        </Box>
      </PanelShell>

      <MobileModal
        open={outcomeDefinitionModal != null}
        onClose={() => setOutcomeDefinitionModal(null)}
        title={
          outcomeDefinitionModal
            ? getOutcomeName(outcomeDefinitionModal)
            : undefined
        }
        denseTitle
        maxWidth={560}
        maxHeight="85vh"
        contentAriaLabel="Outcome definition and levels"
      >
        {outcomeDefinitionModal && (
          <TierTooltipContent
            outcomeCode={outcomeDefinitionModal}
            showTitle={false}
          />
        )}
      </MobileModal>
    </>
  )
}
