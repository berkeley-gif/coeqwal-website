"use client"

import { motion, AnimatePresence } from "@repo/motion"
import { Typography, useTheme } from "@repo/ui/mui"

import { TABS, TAB_ORDER, TabKey } from "../../types/tabs"
import { useTabs } from "../../context/Tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { HEADER_SHRUNK_H } from "../../../../../packages/ui/src/components/navigation/BaseHeader"

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

  return (
    <div
      id="tabs"
      ref={tabsRef}
      style={{
        position: "sticky",
        top: HEADER_SHRUNK_H,
        zIndex: 1000,
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
                padding: "13px 12px",
                border: "none",
                background: panelColor,
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "uppercase",
                color: theme.palette.blue.darkest,
              }}
            >
              {selected && (
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
              <motion.div
                layout
                animate={isInTabsArea ? "sticky" : "expanded"}
                variants={{
                  expanded: { gap: 8 },
                  sticky: { gap: 0 },
                }}
              >
                <Typography
                  variant="h5"
                  style={{
                    fontWeight: 600,
                    fontSize: "1.6rem",
                    textTransform: "capitalize",
                  }}
                >
                  {label}
                </Typography>
                <AnimatePresence initial={false}>
                  {!isInTabsArea && (
                    <motion.div
                      key="tab-description"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      style={{
                        overflow: "hidden",
                      }}
                    >
                      {/* Inner wrapper with min-height ensures all tabs have equal description height */}
                      {/* Responsive: narrower viewports need more height for text wrapping */}
                      {/* Formula: 410px - 23vw, clamped between 125px and 340px */}
                      <div
                        style={{
                          minHeight: "clamp(125px, calc(410px - 23vw), 340px)",
                        }}
                      >
                        <Typography
                          variant="body2"
                          style={{
                            textTransform: "none",
                            margin: 20,
                          }}
                        >
                          {key === "learn" &&
                            "Did you know that California has one of the most complex water systems in the world? Learn about how water flows through California's Central Valley and how we manage it to support diverse needs."}
                          {key === "explore" &&
                            "What if we managed water differently? Explore how water allocations change under different water management scenarios and discover new possibilities."}
                          {key === "empower" &&
                            "What scenarios align with your interests? Share scenario data to empower people and communities to shape our water future. Tools coming soon."}
                        </Typography>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
