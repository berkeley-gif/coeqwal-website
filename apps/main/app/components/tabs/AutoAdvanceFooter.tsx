"use client"

// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { ScrollToButton } from "@repo/ui"
import { Typography, useTheme } from "@repo/ui/mui"

import { useTabs, nextTab } from "../../context/Tabs"
import { TABS, TAB_ORDER } from "../../types/tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"

export default function AutoAdvanceFooter() {
  const { state } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
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
    navigateToTab(nxt)
  }

  const tab = TABS.find((t) => t.key === activeTab)

  return (
    <div
      data-auto-advance-sentinel
      style={{
        position: "relative",
        padding: `${theme.spacing(theme.space.section.lg)} ${theme.spacing(theme.space.section.md)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing(theme.space.component.lg),
        backgroundColor: tab?.panelColor ?? theme.palette.blue.darkest,
        color: theme.palette.common.white,
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="tabLabel"
        sx={{ color: "common.white", textTransform: "none" }}
      >
        {tab?.footerText ?? ""}
      </Typography>
      <ScrollToButton
        onClick={onAdvance}
        animationComplete
        rotation="-90deg"
        axis="horizontal"
        size={60}
        color={theme.palette.common.white}
      />
    </div>
  )
}
