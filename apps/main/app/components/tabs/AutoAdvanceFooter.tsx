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
      {/*       <button
        type="button"
        onClick={onAdvance}
        aria-label={footerText}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing(theme.space.component.lg),
          padding: `${theme.spacing(theme.space.section.lg)} ${theme.spacing(theme.space.section.md)}`,
          width: "100%",
          background: "transparent",
          border: "none",
          color: "inherit",
          font: "inherit",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <Typography
          variant="tabLabel"
          component="span"
          sx={{ color: "common.white", textTransform: "none" }}
        >
          {footerText}
        </Typography>
        <ScrollToButton
          animationComplete
          rotation="-90deg"
          axis="horizontal"
          size={60}
          color={theme.palette.common.white}
        />
      </button> */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <ButtonCta
          href=""
        >
          Learn more about Water Issues
        </ButtonCta>

        <ButtonCta
          href=""
        >
          Explore water allocation scenarios
        </ButtonCta>
      </Box>
    </div>
  )
}
