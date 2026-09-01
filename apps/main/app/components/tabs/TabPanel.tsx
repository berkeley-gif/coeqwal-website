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

    // Both learn and explore tabs are transparent so the persistent map
    // can show through. Child components (ScenarioExplorer, UnifiedToolView)
    // manage their own opaque backgrounds as needed.
    const isMapTab = tabKey === "learn" || tabKey === "explore"
    const isExploreTab = tabKey === "explore"
    const isLearnTab = tabKey === "learn"
    const backgroundColor = isMapTab ? "transparent" : undefined

    // Panels above the map need pointerEvents: "none" so the persistent map behind them
    // can receive drag/pan events. Child components re-enable pointer events as needed.
    const pointerEvents = isMapTab ? "none" : undefined

    // Sticky-footer layout for Learn: a flex column at least one screen
    // tall (minus the header/tabs already claimed above it - see
    // SmoothTabs.tsx), so the active section (flex: "1 0 auto", set in
    // Learn.tsx) absorbs any leftover space instead of leaving a gap
    // before AutoAdvanceFooter. `minHeight`, not `height`, so a section
    // taller than one screen just grows the page and scrolls - this only
    // ever adds space, never clips content.
    const learnColumnMinHeight =
      theme.layout.headerHeight + 2 * theme.layout.collapsedTabHeight

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
          ...(isLearnTab && {
            display: "flex",
            flexDirection: "column",
            minHeight: `calc(100vh - ${learnColumnMinHeight}px)`,
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
