"use client"

import { forwardRef, type ReactNode } from "react"
import AutoAdvanceFooter from "./AutoAdvanceFooter"

type TabPanelProps = {
  tabKey: string
  children: ReactNode
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ tabKey, children }, ref) => {
    const thisPanelId = `panel-${tabKey}`

    // Both learn and explore tabs are transparent so the persistent map
    // can show through. Child components (ScenarioExplorer, UnifiedToolView)
    // manage their own opaque backgrounds as needed.
    const isMapTab = tabKey === "learn" || tabKey === "explore"
    const isExploreTab = tabKey === "explore"
    const backgroundColor = isMapTab ? "transparent" : undefined

    // Panels above the map need pointerEvents: "none" so the persistent map behind them
    // can receive drag/pan events. Child components re-enable pointer events as needed.
    const pointerEvents = isMapTab ? "none" : undefined

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={thisPanelId}
        aria-labelledby={`tab-${tabKey}`}
        style={{
          backgroundColor,
          pointerEvents,
          // Minimum height ensures enough page content for sticky tabs to work.
          // Without this, shorter panels cause the browser to clamp scrollY,
          // pushing the tab row to change height.
          ...(isExploreTab && {
            height: "100%",
            overflow: "hidden",
          }),
        }}
      >
        {children}
        {tabKey === "learn" && <AutoAdvanceFooter />}
      </div>
    )
  },
)

TabPanel.displayName = "TabPanel"
export default TabPanel
