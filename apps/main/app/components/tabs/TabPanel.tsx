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

    // Learn and Explore tabs need transparent backgrounds and no padding
    // so the persistent map shows through / content sits flush with tabs
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
