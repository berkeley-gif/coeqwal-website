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

    // Meli, I implemented a different approach to the map, where the same map
    // sits behind the tab panels. This way, the map preloads while visitors are
    // in the IntroSection, and I and keep the same map throughout, instead of 
    // mounting and unmounting every time we switch tabs. In order to do this, the
    // Learn and Explore tabs need transparent backgrounds and no padding
    // so the persistent map shows through / content sits flush with tabs.
    const isMapTab = tabKey === "learn" || tabKey === "explore"
    const backgroundColor = isMapTab ? "transparent" : undefined
    const padding = isMapTab ? "0" : "2rem 0"

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={thisPanelId}
        aria-labelledby={`tab-${tabKey}`}
        style={{ padding, backgroundColor }}
      >
        {children}
        <AutoAdvanceFooter />
      </div>
    )
  },
)

TabPanel.displayName = "TabPanel"
export default TabPanel
