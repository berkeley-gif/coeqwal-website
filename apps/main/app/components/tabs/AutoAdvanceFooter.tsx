"use client"

// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { ScrollToButton } from "@repo/ui"
import { Button, Typography, useTheme, Box } from "@repo/ui/mui"

import { useTabs, nextTab } from "../../context/Tabs"
import { TABS, TAB_ORDER } from "../../types/tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"
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
  const setMainView = useScenarioExplorerStore((s) => s.setMainView)
  const theme = useTheme()

  // The Explore tab has two sub-views ("get-started" and the Tools
  // views). Tools is handled by hiding the footer entirely in
  // TabPanel, so when this footer renders for the Explore tab it's
  // always at the end of Get Started and should advance to Tools
  // (switch `mainView`), not navigate to the next top-level tab.
  const onAdvance = () => {
    if (activeTab === "explore") {
      setMainView("explorer")
      return
    }
    const nxt = nextTab(TAB_ORDER, activeTab)!
    // When advancing into Explore (e.g. from the Learn tab footer), always
    // land on the get-started intro (panel 1), even if the user had
    // previously switched to Tools earlier in the session.
    if (nxt === "explore") {
      setMainView("get-started")
    }
    navigateToTab(nxt)
  }

  const tab = TABS.find((t) => t.key === activeTab)
  const footerText = tab?.footerText ?? ""
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
        {nextLearnSection && (
          <ButtonCta
            onClick={() => mapActions.setLearnNavSection(nextLearnSection)}
          >
            Learn more about {nextLearnSectionLabel}
          </ButtonCta>
        )}
        <ButtonCta
          href="/explore"
        >
          Explore water allocation scenarios
        </ButtonCta>
      </Box>
    </div>
  )
}
