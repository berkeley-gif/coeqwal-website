// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { ScrollToButton } from "@repo/ui"
import { Typography } from "@repo/ui/mui"

import { useTabs, nextTab } from "../../context/Tabs"
import { TAB_ORDER } from "../../types/tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"

export default function AutoAdvanceFooter() {
  const { state } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()

  const onAdvance = () => {
    const nxt = nextTab(TAB_ORDER, activeTab)!
    navigateToTab(nxt)
  }

  return (
    <div
      data-auto-advance-sentinel
      style={{
        position: "relative",
        paddingTop: "2rem",
        paddingBottom: "2rem",
        display: "flex",
        alignItems: "center",
        minHeight: 48,
        justifyContent: "center",
        gap: 12,
      }}
    >
      <Typography variant="caption">
        Explore water allocation scenarios
      </Typography>
      <ScrollToButton
        onClick={onAdvance}
        delay={0}
        showDuration={0.1}
        animationComplete
        rotation="-90deg"
        axis="horizontal"
      />
    </div>
  )
}
