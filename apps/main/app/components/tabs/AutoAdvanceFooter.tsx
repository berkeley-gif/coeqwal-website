"use client"

// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { useTheme, Box } from "@repo/ui/mui"

import { useTabs, nextTab } from "../../context/Tabs"
import { TABS, TAB_ORDER } from "../../types/tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { ButtonCta } from "@repo/ui"
import {
  LearnNavSections,
  nextLearnNavSection,
  LEARN_NAV_SECTION_LABELS,
} from "../../features/map/config/sectionLayers"
import { mapActions, useLearnNavSection } from "../../features/map/store"

export default function AutoAdvanceFooter() {
  const { state } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
  const learnNavSection = useLearnNavSection()
  const nextLearnSection = nextLearnNavSection(LearnNavSections, learnNavSection)
  const nextLearnSectionLabel = nextLearnSection
    ? LEARN_NAV_SECTION_LABELS[nextLearnSection]
    : null
  const theme = useTheme()

  const onAdvance = () => {
    const nxt = nextTab(TAB_ORDER, activeTab)!
    navigateToTab(nxt)
  }

  const tab = TABS.find((t) => t.key === activeTab)
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: tab?.panelColor ?? theme.palette.blue.darkest,
        color: theme.palette.common.white,
        pointerEvents: "auto",
        minHeight: "100px",
        padding: `${theme.spacing(theme.space.section.lg)} 0`
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {activeTab === "learn" && nextLearnSection && (
          <ButtonCta
            onClick={() => mapActions.setLearnNavSection(nextLearnSection)}
          >
            Learn about {nextLearnSectionLabel}
          </ButtonCta>
        )}
        {activeTab === "learn" && !nextLearnSection && (
          <ButtonCta onClick={onAdvance}>
            Explore water allocation scenarios
          </ButtonCta>
        )}
        {activeTab === "explore" && (
          <ButtonCta onClick={onAdvance}>
            Share your findings
          </ButtonCta>
        )}
      </Box>
    </div>
  )
}
