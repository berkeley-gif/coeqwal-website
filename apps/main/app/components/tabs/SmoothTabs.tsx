"use client"

import { useCallback } from "react"
import { motion, AnimatePresence } from "@repo/motion"
import { Box, Typography, useTheme, alpha } from "@repo/ui/mui"
import { TwoColumnInterstitial } from "@repo/ui"

import { TABS, TAB_ORDER, TabKey } from "../../types/tabs"
import { useTabs } from "../../context/Tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
//import { usePanelRoute } from "../../hooks/usePanelRoute"
import { smoothScrollToCenter } from "../../utils/smoothScrollToCenter"
import ExploreSubNav from "../../features/scenarioExplorer/explorer/tools/chrome/nav/ExploreSubNav"

/** Renders the active tab's description panel content */
function TabDescription({
  tab,
  onScrollPromptClick,
}: {
  tab: TabKey
  onScrollPromptClick: () => void
}) {
  // Dormant call. Uncomment if TabDescription needs theme route state.
  // usePanelRoute reads useSearchParams, so restoring this requires a
  // Suspense boundary above SmoothTabs in page.tsx. Re-import from
  // "../../hooks/usePanelRoute".
  // usePanelRoute()

  switch (tab) {
    case "learn":
      return (
        <TwoColumnInterstitial
          headline="Did you know that California has one of the most complex water systems in the world?"
          body="Learn how water flows through California's Central Valley and the tools we use for water planning and decision-making"
          onScrollPromptClick={onScrollPromptClick}
          linkListLabel="Learn more about"
          links={[
            {
              label: "How water moves through California",
              href: "https://flow.coeqwal.org",
              target: "_blank",
              rel: "noopener noreferrer",
            },
            {
              label: "How climate change affects California water",
              href: "https://climate.coeqwal.org",
              target: "_blank",
              rel: "noopener noreferrer",
            },
            { label: "How water is managed in California", opacity: 0.65 },
            { label: "How equity shapes California water", opacity: 0.65 },
          ]}
        />
      )
    case "explore":
      return (
        <TwoColumnInterstitial
          headline="What if we managed water differently?"
          body="Explore how water allocations change under different scenarios and hydroclimates — and discover new possibilities for California's water future."
          linkListLabel=""
          links={[]}
        />
      )
    case "share":
      return (
        <TwoColumnInterstitial
          headline="What scenarios align with your interests?"
          body="Select scenario data and share what you've learned to shape our water future."
          linkListLabel=""
          links={[]}
          scrollPrompt={null}
        />
      )
  }
}

export default function SmoothTabs() {
  const { state, tabsRef } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
  const theme = useTheme()

  const onSelect = useCallback(
    (tab: TabKey) => {
      if (tab !== activeTab) navigateToTab(tab)
    },
    [activeTab, navigateToTab],
  )

  // Keyboard a11y: ArrowLeft/Right, Home/End
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const idx = TAB_ORDER.indexOf(activeTab)
    if (e.key === "ArrowRight") onSelect(TAB_ORDER[(idx + 1) % TAB_ORDER.length])
    if (e.key === "ArrowLeft") onSelect(TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length])
    if (e.key === "Home") onSelect(TAB_ORDER[0])
    if (e.key === "End") onSelect(TAB_ORDER[TAB_ORDER.length - 1])
  }

  return (
    <div
      id="tabs"
      ref={tabsRef}
      style={{
        position: "sticky",
        top: theme.layout.collapsedHeaderHeight,
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.palette.common.white,
        pointerEvents: "auto",
      }}
    >
      <div
        role="tablist"
        aria-label="tab-sections"
        onKeyDown={handleKeyDown}
        className="tab-container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          width: "100%",
          pointerEvents: "auto",
          boxSizing: "border-box",
        }}
      >
        {TABS.map(({ key, label, panelColor }) => {
          const selected = key === activeTab
          return (
            <Box
              key={key}
              component="button"
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              onClick={() => onSelect(key)}
              tabIndex={selected ? 0 : -1}
              sx={{
                justifySelf: "center",
                width: "85%",
                position: "relative",
                border: "none",
                backgroundColor: panelColor,
                cursor: "pointer",
                color: theme.palette.common.white,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "0 20px",
                height: theme.layout.collapsedTabHeight,
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.common.white}`,
                  outlineOffset: 2,
                },
              }}
            >

              <Typography
                component="span"
                variant="nav"
                sx={{
                  fontWeight: 600,
                  color: "inherit",
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </div>
      <Box
        id="tabPanelHeader"
        role="tabPanelHeader"
        sx={{
          flexShrink: 0,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: theme.layout.collapsedTabHeight,
          background: theme.palette.tabPanels[activeTab],
          lineHeight: 1,
          color: theme.palette.common.white,
          justifyContent: "center",
          gap: 1,
        }}
      />


      <ExploreSubNav />
    </div>
  )
}
