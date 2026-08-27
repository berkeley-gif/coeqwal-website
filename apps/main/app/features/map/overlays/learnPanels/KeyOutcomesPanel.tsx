"use client"

import { useState } from "react"
import { Typography, useTheme } from "@repo/ui/mui"
import { InfoCard, InfoCardGrid, MobileModal } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import TierTooltipContent from "../../../tooltips/TierTooltipContent"
import { getOutcomeName, type OutcomeCode } from "../../../../content/outcomes"
import { KEY_OUTCOMES } from "../content"

export default function KeyOutcomesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const exploreBg = theme.palette.tabPanels.explore
  const [outcomeDefinitionModal, setOutcomeDefinitionModal] =
    useState<OutcomeCode | null>(null)

  return (
    <>
      <PanelShell background={exploreBg}>
        <PanelHeading
          title="Key outcomes"
          kicker="How are scenario results described?"
          lead="The results of each scenario are summarized by nine key outcomes:"
        />

        <Typography variant="body2" color="text.secondary" sx={{ my: sp.lg }}>
          Click on each key outcome to learn more.
        </Typography>

        <InfoCardGrid columns={3} rowGap={theme.space.section.sm}>
          {KEY_OUTCOMES.map(({ outcomeCode, description }) => {
            const title = getOutcomeName(outcomeCode)
            return (
              <InfoCard
                key={outcomeCode}
                title={title}
                description={description}
                variant="onDark"
                onClick={() => setOutcomeDefinitionModal(outcomeCode)}
                ariaLabel={`${title}: open full definition and outcome levels`}
              />
            )
          })}
        </InfoCardGrid>
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
