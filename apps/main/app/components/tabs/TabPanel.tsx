"use client"

import { forwardRef, type ReactNode } from "react"
import { useTheme } from "@repo/ui/mui"
import AutoAdvanceFooter from "./AutoAdvanceFooter"

type TabPanelProps = {
  tabKey: string
  children: ReactNode
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ tabKey, children }, ref) => {
    const theme = useTheme()
    const thisPanelId = `panel-${tabKey}`

    // Map tab panels (in Learn, Explore) need transparent backgrounds and no padding
    // so the persistent map shows through and content sits flush with tabs.
    const isMapTab = tabKey === "learn" || tabKey === "explore"
    const isExploreTab = tabKey === "explore"
    const backgroundColor = isMapTab ? "transparent" : undefined
    const padding = isMapTab ? "0" : "2rem 0"

    // Explore tab gets a fixed viewport height so it doesn't cause page scroll
    // Offset = collapsed header (40px) + docked SmoothTabs height (~40px)
    const headerAndTabsOffset = theme.layout.collapsedHeaderHeight + 40
    const exploreStyles: React.CSSProperties = isExploreTab
      ? { height: `calc(100vh - ${headerAndTabsOffset}px)`, overflow: "hidden" }
      : {}

    // Map tabs need pointerEvents: "none" so the persistent map behind them
    // can receive drag/pan events. Child components re-enable pointer events as needed.
    const pointerEvents = isMapTab ? "none" : undefined

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={thisPanelId}
        aria-labelledby={`tab-${tabKey}`}
        style={{
          padding,
          backgroundColor,
          pointerEvents,
          // Minimum height ensures enough page content for sticky tabs to work.
          // Without this, shorter panels cause the browser to clamp scrollY,
          // pushing the tab row from 40px to ~60px.
          minHeight: `calc(100vh - ${headerAndTabsOffset}px)`,
          ...exploreStyles,
        }}
      >
        {children}
        <AutoAdvanceFooter />
      </div>
    )
  },
)

TabPanel.displayName = "TabPanel"
export default TabPanel
