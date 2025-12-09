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

    // Learn tab gets teal background to cover any gaps
    const backgroundColor = tabKey === "learn" ? "#68C3CE" : undefined

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
