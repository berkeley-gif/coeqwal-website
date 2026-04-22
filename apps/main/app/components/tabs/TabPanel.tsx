"use client"

import { forwardRef, type ReactNode } from "react"
import { useTheme } from "@repo/ui/mui"
import { useMapMode } from "../../features/map/store"
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"
import AutoAdvanceFooter from "./AutoAdvanceFooter"

type TabPanelProps = {
  tabKey: string
  children: ReactNode
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ tabKey, children }, ref) => {
    const theme = useTheme()
    const mapMode = useMapMode()
    const mainView = useScenarioExplorerStore((s) => s.mainView)
    const thisPanelId = `panel-${tabKey}`

    // Both learn and explore tabs are transparent so the persistent map
    // can show through. Child components (ScenarioExplorer, UnifiedToolLayout)
    // manage their own opaque backgrounds as needed.
    const isMapTab = tabKey === "learn" || tabKey === "explore"
    const isExploreTab = tabKey === "explore"
    const backgroundColor = isMapTab ? "transparent" : undefined
    const padding = isMapTab ? "0" : `2rem ${theme.space.panel.padding}`

    // Explore tab gets a fixed viewport height so it doesn't cause page scroll,
    // EXCEPT when in get-started mode which uses page scroll like the learn tab.
    // The sub-nav (ExploreSubNav) is an additional sticky bar above the panel.
    const headerAndTabsOffset =
      theme.layout.collapsedHeaderHeight + theme.layout.collapsedTabHeight
    const subNavHeight = isExploreTab ? theme.layout.collapsedTabHeight : 0
    const exploreStyles: React.CSSProperties =
      isExploreTab && mapMode !== "get-started"
        ? {
            height: `calc(100vh - ${headerAndTabsOffset + subNavHeight}px)`,
            minHeight: `calc(100vh - ${headerAndTabsOffset + subNavHeight}px)`,
            overflow: "hidden",
          }
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
        {/* Auto-advance footer sentinel.
            - Share is the last tab, so no footer needed.
            - In the Explore tab, the footer is only shown at the end
              of the Get Started sub-view; the Tools / Data sub-views
              take the full viewport and scroll internally, so the
              footer would just get in the way. */}
        {tabKey !== "share" &&
          !(tabKey === "explore" && mainView !== "get-started") && (
            <AutoAdvanceFooter />
          )}
      </div>
    )
  },
)

TabPanel.displayName = "TabPanel"
export default TabPanel
