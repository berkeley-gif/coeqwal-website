"use client"

// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { useTheme, Box } from "@repo/ui/mui"

import { useTabs, nextTab } from "../../context/Tabs"
import { TABS, TAB_ORDER } from "../../types/tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { ButtonCta } from "@repo/ui"
import type { LearnNavSection } from "../../features/map/config/sectionLayers"
import { mapActions, useLearnNavSection } from "../../features/map/store"

// Footer CTAs shown on the "learn" tab, keyed by the current
// LearnNavSection. Hand-authored per section rather than derived from
// section order, since the copy doesn't follow that order 1:1 -
// water-stories links backward to water-issues, since it's the last
// section and has nothing further to advance to.
const LEARN_FOOTER_BUTTONS: Record<
  LearnNavSection,
  { label: string; target: LearnNavSection }[]
> = {
  "get-started": [
    { label: "Learn more about Water Issues", target: "water-issues" },
  ],
  "water-issues": [
    { label: "Get started", target: "get-started" },
    { label: "Learn more about California water", target: "water-stories" },
  ],
  "water-stories": [
    { label: "Get started", target: "get-started" },
    {
      label: "Learn more about California Water Issues",
      target: "water-issues",
    },
  ],
}

export default function AutoAdvanceFooter() {
  const { state } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
  const learnNavSection = useLearnNavSection()
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
        flexShrink: 0,
        padding: `${theme.spacing(theme.space.section.lg)} 0`,
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
        {activeTab === "learn" &&
          LEARN_FOOTER_BUTTONS[learnNavSection].map(({ label, target }) => (
            <ButtonCta
              key={target}
              onClick={() => mapActions.setLearnNavSection(target)}
            >
              {label}
            </ButtonCta>
          ))}
        {activeTab === "learn" && (
          <ButtonCta onClick={onAdvance}>
            Explore COEQWAL scenarios
          </ButtonCta>
        )}
        {activeTab === "explore" && (
          <ButtonCta onClick={onAdvance}>Share your findings</ButtonCta>
        )}
      </Box>
    </div>
  )
}
