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

    // Learn tab needs transparent background so the persistent map shows through
    // Not necesssary for other tabs.
    const backgroundColor = tabKey === "learn" ? "transparent" : undefined

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={thisPanelId}
        aria-labelledby={`tab-${tabKey}`}
        style={{ padding: "2rem 0", backgroundColor }}
      >
        {children}
        <AutoAdvanceFooter />
      </div>
    )
  },
)

TabPanel.displayName = "TabPanel"
export default TabPanel
