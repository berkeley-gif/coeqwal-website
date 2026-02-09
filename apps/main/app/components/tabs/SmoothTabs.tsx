"use client"

import { motion, AnimatePresence } from "@repo/motion"
import { Typography, useTheme } from "@repo/ui/mui"

import { TABS, TAB_ORDER, TabKey } from "../../types/tabs"
import { useTabs } from "../../context/Tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"

const descriptions: Record<TabKey, string> = {
  learn:
    "Did you know that California has one of the most complex water systems in the world? Learn about how water flows through California\u2019s Central Valley and how we manage it to support diverse needs.",
  explore:
    "What if we managed water differently? Explore how water allocations change under different water management scenarios and discover new possibilities.",
  empower:
    "What scenarios align with your interests? Share scenario data to empower people and communities to shape our water future. Tools coming soon.",
}

export default function SmoothTabs() {
  const { state, tabsRef, isInTabsArea } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
  const theme = useTheme()

  const onSelect = (tab: TabKey | undefined) => {
    if (tab && tab !== activeTab) {
      navigateToTab(tab)
    }
  }

  // Keyboard support A11y: ArrowLeft/Right, Home/End
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const idx = TAB_ORDER.indexOf(activeTab)

    if (e.key === "ArrowRight")
      onSelect(TAB_ORDER[(idx + 1) % TAB_ORDER.length])
    if (e.key === "ArrowLeft")
      onSelect(TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length])
    if (e.key === "Home") onSelect(TAB_ORDER[0])
    if (e.key === "End") onSelect(TAB_ORDER[TAB_ORDER.length - 1])
  }

  const activeTabColor = TABS.find((t) => t.key === activeTab)?.panelColor

  return (
    <div
      id="tabs"
      ref={tabsRef}
      style={{
        position: "sticky",
        top: theme.layout.collapsedHeaderHeight,
        zIndex: theme.zIndex.appBar,
        marginTop: "-80px", // Pull tabs up to appear at bottom of ActionPanel
      }}
    >
      <div
        role="tablist"
        aria-label="tab-sections"
        onKeyDown={handleKeyDown}
        className="tab-container"
        style={{
          display: "flex",
          width: "100%",
          pointerEvents: "auto",
        }}
      >
        {TABS.map(({ key, label, panelColor }) => {
          const selected = key === activeTab
          return (
            <button
              key={key}
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              onClick={() => onSelect(key)}
              type="button"
              tabIndex={selected ? 0 : -1}
              style={{
                flex: 1,
                position: "relative",
                padding: isInTabsArea ? "8px 20px" : "13px 12px", // Match header padding when sticky
                border: "none",
                background: panelColor, // Keep individual tab colors
                cursor: "pointer",
                fontWeight: 600, // Consistent weight
                textTransform: "uppercase",
                color: theme.palette.blue.darkest,
                transition: "padding 0.2s ease, font-weight 0.2s ease",
              }}
            >
              {/* Active tab indicator - only show when expanded, hide when docked */}
              {selected && !isInTabsArea && (
                <motion.span
                  layoutId="seg-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -5,
                    height: 5,
                    background: `var(--accent, ${panelColor})`,
                  }}
                />
              )}
              <Typography
                component="span"
                variant={isInTabsArea ? "tabLabelDocked" : "tabLabel"}
                sx={{ transition: theme.transition.quick }}
              >
                {label}
              </Typography>
            </button>
          )
        })}
      </div>

      {/* Full-width tab description — only in expanded (non-docked) state */}
      <AnimatePresence initial={false}>
        {!isInTabsArea && (
          <motion.div
            key="tab-desc-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden", width: "100%", background: activeTabColor }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: "100%",
                  background: activeTabColor,
                }}
              >
                <Typography
                  variant="body2"
                  style={{
                    textTransform: "none",
                    padding: 20,
                  }}
                >
                  {descriptions[activeTab]}
                </Typography>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
