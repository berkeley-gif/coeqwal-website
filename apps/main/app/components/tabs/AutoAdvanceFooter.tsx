// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { ScrollToButton } from "@repo/ui"
import { Typography, useTheme } from "@repo/ui/mui"

import { useTabs, nextTab } from "../../context/Tabs"
import { TABS, TAB_ORDER } from "../../types/tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"



export default function AutoAdvanceFooter() {
  const { state } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
  const theme = useTheme()

  const onAdvance = () => {
    const nxt = nextTab(TAB_ORDER, activeTab)!
    navigateToTab(nxt)
  }

  const tab = TABS.find((t) => t.key === activeTab)


  return (
    <div
      data-auto-advance-sentinel
      style={{
        position: "relative",
        paddingTop: "1rem",
        paddingBottom: "1rem",
        display: "flex",
        alignItems: "center",
        minHeight: 48,
        justifyContent: "center",
        gap: 12,
        backgroundColor: theme.palette.nature.earth,
      }}
    >
      <Typography variant="caption">
        {tab?.footerText ?? ""}
      </Typography>
      <ScrollToButton
        onClick={onAdvance}
        delay={0}
        animationComplete
        rotation="-90deg"
        axis="horizontal"
      />
    </div>
  )
}
