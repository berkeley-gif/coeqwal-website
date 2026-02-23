"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "@repo/motion"
import { Typography, useTheme, alpha } from "@repo/ui/mui"
import { TwoColumnInterstitial } from "@repo/ui"

import { TABS, TAB_ORDER, TabKey } from "../../types/tabs"
import { useTabs } from "../../context/Tabs"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { smoothScrollToCenter } from "../../utils/smoothScrollToCenter"

/** Action descriptions shown in expanded tab buttons (matches Panel 4 columns) */
const TAB_DESCRIPTIONS: Record<TabKey, string> = {
  learn:
    "the basics of Central Valley water management and how to read our scenario data",
  explore:
    "the scenarios. Use tools to understand and compare them. Look at the data through the lenses of tradeoffs, equity, and resilience.",
  share:
    "your findings by capturing data and charts as you explore and exporting them as files.",
}

/** Renders the active tab's description panel content */
function TabDescription({
  tab,
  onScrollPromptClick,
}: {
  tab: TabKey
  onScrollPromptClick: () => void
}) {
  switch (tab) {
    case "learn":
      return (
        <TwoColumnInterstitial
          headline="Did you know that California has one of the most complex water systems in the world?"
          body="Learn how water flows through California's Central Valley and the tools we use for water planning and decision-making"
          onScrollPromptClick={onScrollPromptClick}
          linkListLabel="Learn more about"
          links={[
            {
              label: "How water moves through California",
              href: "https://flow.coeqwal.org",
              target: "_blank",
              rel: "noopener noreferrer",
            },
            {
              label: "How climate change affects California water",
              href: "https://climate.coeqwal.org",
              target: "_blank",
              rel: "noopener noreferrer",
            },
            { label: "How water is managed in California" },
            { label: "How equity shapes California water" },
          ]}
        />
      )
    case "explore":
      return (
        <TwoColumnInterstitial
          headline="What if we managed water differently?"
          body="Explore how water allocations change under different scenarios through three lenses — trade-offs, equity, and resilience — and discover new possibilities for California's water future."
          linkListLabel="Explore how critical water issues are addressed"
          links={[
            { label: "Community water systems" },
            { label: "Farms, groundwater, and food systems" },
            { label: "Rivers, salmon, and ecosystems" },
            { label: "The Delta as a living place" },
            { label: "Climate risk, reliability, and resilience" },
            { label: "Water governance and decision-making" },
          ]}
        />
      )
    case "share":
      return (
        <TwoColumnInterstitial
          headline="What scenarios align with your interests?"
          body="Select scenario data and share what you've learned to shape our water future."
          linkListLabel=""
          links={[]}
          scrollPrompt={null}
        />
      )
  }
}

export default function SmoothTabs() {
  const { state, tabsRef, isInTabsArea } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()
  const theme = useTheme()

  // Track whether descriptions were opened by a tab click while docked
  const [clickOpened, setClickOpened] = useState(false)

  // Force-hide the interstitial before a programmatic scroll so that its
  // collapsing height animation doesn't shift document positions mid-scroll.
  const [forceHideDescriptions, setForceHideDescriptions] = useState(false)

  // Show descriptions when expanded or opened by click, unless force-hidden.
  const showDescriptions = !forceHideDescriptions && (!isInTabsArea || clickOpened)

  // Once the tabs have docked (isInTabsArea = true), the interstitial is gone
  // from the flow and the force-hide flag is no longer needed.
  useEffect(() => {
    if (isInTabsArea) setForceHideDescriptions(false)
  }, [isInTabsArea])

  // When user scrolls after a click-open, retract the descriptions
  useEffect(() => {
    if (!clickOpened) return

    const handleScroll = () => {
      setClickOpened(false)
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
      once: true,
    })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [clickOpened])

  // "Scroll to Explore" handler for the Learn interstitial.
  // Closes the interstitial FIRST so its height animation doesn't shift
  // document positions during the scroll, then scrolls after the animation.
  const handleScrollPromptClick = useCallback(() => {
    setForceHideDescriptions(true)
    // 0.45s matches the AnimatePresence exit transition duration.
    // Waiting for it to complete means the layout is stable when we scroll.
    setTimeout(() => {
      smoothScrollToCenter("central-valley-content")
    }, 460)
  }, [])

  const onSelect = useCallback(
    (tab: TabKey | undefined) => {
      if (tab && tab !== activeTab) {
        navigateToTab(tab)
      }
      // Always show descriptions on tab click, even if already on this tab
      if (isInTabsArea) {
        setClickOpened(true)
      }
    },
    [activeTab, navigateToTab, isInTabsArea],
  )

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
        backgroundColor: isInTabsArea
          ? alpha(theme.palette.text.primary, 0.75)
          : "transparent",
        transition: "background-color 0.4s ease",
        pointerEvents: "auto",
      }}
    >
      <div
        role="tablist"
        aria-label="tab-sections"
        onKeyDown={handleKeyDown}
        className="tab-container"
        style={{
          display: "flex",
          gap: 0,
          width: "100%",
          pointerEvents: "auto",
          paddingLeft: 0,
          paddingRight: 0,
          transition: "padding 0.3s ease",
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
                border: "none",
                backgroundColor: panelColor,
                cursor: "pointer",
                color: theme.palette.common.white,
                transition:
                  "padding 0.4s ease, clip-path 0.4s ease, gap 0.4s ease, font-size 0.4s ease",
                display: "flex",
                flexDirection: "column",
                gap: isInTabsArea ? 0 : 6,
                alignItems: isInTabsArea ? "center" : "flex-start",
                justifyContent: "flex-start",
                textAlign: isInTabsArea ? "center" : "left",
                padding: isInTabsArea
                  ? "8px 20px"
                  : `24px ${theme.space.panel.padding}`,
                borderTop: "none",
                borderBottom: isInTabsArea
                  ? `${theme.strokeWidth.rule}px solid ${theme.palette.common.white}80`
                  : "none",
                // File-tab shape: triangle cut from upper-right corner (80px).
                // Smaller when docked (20px).
                clipPath: isInTabsArea
                  ? "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
                  : "polygon(0 0, calc(100% - 80px) 0, 100% 80px, 100% 100%, 0 100%)",
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
                    bottom: 0,
                    height: 5,
                    background: `var(--accent, ${panelColor})`,
                  }}
                />
              )}
              <Typography
                component="span"
                variant={isInTabsArea ? "tabLabelDocked" : "h4"}
                sx={{
                  transition: "font-size 0.4s ease, color 0.4s ease",
                  fontWeight: 600,
                }}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </Typography>
              {/* Description - only when expanded */}
              {!isInTabsArea && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 400,
                    opacity: 0.85,
                    textTransform: "none",
                    m: 0,
                  }}
                >
                  {TAB_DESCRIPTIONS[key]}
                </Typography>
              )}
            </button>
          )
        })}
      </div>

      {/* Full-width tab description — visible when expanded or opened by click */}
      <AnimatePresence initial={false}>
        {showDescriptions && (
          <motion.div
            key="tab-desc-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{
              overflow: "hidden",
              width: "100%",
              background: activeTabColor,
            }}
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
                <TabDescription
                  tab={activeTab}
                  onScrollPromptClick={handleScrollPromptClick}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
