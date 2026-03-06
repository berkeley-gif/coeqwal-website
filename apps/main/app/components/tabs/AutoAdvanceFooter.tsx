"use client"

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
