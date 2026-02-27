"use client"

/**
 * ScenarioExplorer - Main scenario exploration interface
 *
 */

import React, { useState } from "react"
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  icons,
  ViewListIcon,
  CompareArrowsIcon,
  AppsIcon,
  TimelineIcon,
} from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import ListPanel from "./exploreView"
import { ComparisonPanel, EquityPanel, ResiliencePanel } from "./exploreView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"
import { ViewModeControls } from "./components/ViewModeControls"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import { useScenarioExplorerStore, type ExploreMode } from "./store"

// ─── View mode button definitions ────────────────────────────────────────────

const VIEW_MODES: {
  mode: ExploreMode
  icon: React.ReactNode
  label: string
}[] = [
  {
    mode: "list",
    icon: <ViewListIcon sx={{ fontSize: "1rem" }} />,
    label: "Scenario list",
  },
  {
    mode: "comparison",
    icon: <CompareArrowsIcon sx={{ fontSize: "1rem" }} />,
    label: "Tradeoffs tool",
  },
  {
    mode: "equity",
    icon: <AppsIcon sx={{ fontSize: "1rem" }} />,
    label: "Equity tool",
  },
  {
    mode: "resilience",
    icon: <TimelineIcon sx={{ fontSize: "1rem" }} />,
    label: "Resilience tool",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScenarioExplorerNew() {
  const theme = useTheme()

  const { mainView, setMainView, exploreMode, setExploreMode } =
    useScenarioExplorerStore()

  const [isListExpanded, setIsListExpanded] = useState(false)

  // Only map mode needs a transparent background (lets the map layer show through)
  const needsTransparentBg = mainView === "explorer" && exploreMode === "map"

  // Analysis modal is open when an analysis mode is active
  const isAnalysisMode =
    mainView === "explorer" &&
    (exploreMode === "comparison" ||
      exploreMode === "equity" ||
      exploreMode === "resilience")

  const closeAnalysisModal = () => setExploreMode("list")

  return (
    <Box
      sx={{
        height: "100%",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: needsTransparentBg ? "none" : "auto",
      }}
    >
      {/* ── Tab navigation ─────────────────────────────────────────────────── */}
      <Box
        component="div"
        role="tablist"
        aria-label="Explore section tabs"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: theme.zIndex.pageContent,
          flexShrink: 0,
          pointerEvents: "auto",
          display: "flex",
          width: "100%",
        }}
      >
        {/* "Filter scenarios" tab — contains view mode buttons inline */}
        {/* Uses div (not button) because it contains clickable children */}
        <Box
          role="tab"
          aria-selected={mainView === "explorer"}
          tabIndex={mainView === "explorer" ? 0 : -1}
          onClick={() => setMainView("explorer")}
          sx={{
            flex: 1,
            position: "relative",
            padding: "8px 20px",
            border: "none",
            background: theme.palette.explore.background,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 600,
            fontSize: "1.3rem",
            lineHeight: 1.1,
            textTransform: "capitalize",
            color: theme.palette.blue.darkest,
            transition: "opacity 0.15s ease",
            opacity: mainView === "explorer" ? 1 : 0.7,
            "&:hover": { opacity: 1 },
          }}
        >
          Filter scenarios

          {/* View mode icon+text buttons */}
          {mainView === "explorer" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {VIEW_MODES.map(({ mode, icon, label }) => {
                const active = exploreMode === mode
                return (
                  <Box
                    key={mode}
                    component="button"
                    onClick={() => setExploreMode(mode)}
                    aria-pressed={active}
                    aria-label={label}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.25,
                      py: 0.5,
                      border: "none",
                      borderRadius: theme.borderRadius.sm ?? "4px",
                      cursor: "pointer",
                      background: active
                        ? theme.palette.interaction.selectedBackground
                        : "transparent",
                      color: active
                        ? theme.palette.blue.bright
                        : theme.palette.blue.darkest,
                      opacity: active ? 1 : 0.55,
                      transition: "opacity 0.15s, background-color 0.15s",
                      "&:hover": {
                        opacity: 1,
                        background: theme.palette.interaction.selectedBackground,
                      },
                    }}
                  >
                    {icon}
                    <Typography
                      component="span"
                      variant="subtitle2"
                      sx={{
                        fontWeight: active ? 600 : 400,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        {/* "Explore data in depth" tab */}
        <Box
          component="button"
          role="tab"
          aria-selected={mainView === "data"}
          tabIndex={mainView === "data" ? 0 : -1}
          onClick={() => setMainView("data")}
          sx={{
            flex: 1,
            position: "relative",
            padding: "8px 20px",
            border: "none",
            background: theme.palette.share.background,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 600,
            fontSize: "1.3rem",
            lineHeight: 1.1,
            textTransform: "capitalize",
            color: theme.palette.blue.darkest,
            transition: "opacity 0.15s ease",
            opacity: mainView === "data" ? 1 : 0.7,
            "&:hover": { opacity: 1 },
          }}
        >
          Explore data in depth
        </Box>
      </Box>

      {/* ── Content area (always full-width list + map behind) ─────────────── */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          pointerEvents: needsTransparentBg ? "none" : "auto",
        }}
      >
        {/* Single full-width column — scenario list, search, banner */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <SelectionBanner />

          {/* Search toolbar (explorer view only) */}
          {mainView === "explorer" && (
            <Box
              sx={{
                flexShrink: 0,
                backgroundColor: theme.palette.background.paper,
                pointerEvents: "auto",
              }}
            >
              <SearchBar
                placeholder="Search scenarios by name or description"
                leftContent={
                  <Tooltip title="Expand" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setIsListExpanded(true)}
                      sx={{
                        color: theme.palette.grey[500],
                        "&:hover": {
                          color: theme.palette.grey[700],
                          backgroundColor: "rgba(0,0,0,0.04)",
                        },
                      }}
                    >
                      <icons.OpenInFull sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                }
                rightContent={<ViewModeControls />}
              />
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            {mainView === "explorer" && (
              <ListPanel
                isExpanded={isListExpanded}
                onCloseExpand={() => setIsListExpanded(false)}
                modalToolbar={
                  <>
                    <SelectionBanner />
                    <SearchBar
                      placeholder="Search scenarios by name or description"
                      rightContent={<ViewModeControls />}
                    />
                  </>
                }
              />
            )}
            {mainView === "data" && (
              <DataExplorerView
                onNavigateToExplorer={() => setMainView("explorer")}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Analysis view modal ─────────────────────────────────────────────── */}
      <MobileModal
        open={isAnalysisMode}
        onClose={closeAnalysisModal}
        title={
          <Typography variant="overline" sx={{ color: theme.palette.text.primary }}>
            {exploreMode === "comparison"
              ? "Tradeoffs view"
              : exploreMode === "equity"
                ? "Equity view"
                : "Resilience view"}
          </Typography>
        }
        denseTitle
        noPadding
        subHeader={<SelectionBanner />}
        maxWidth="90vw"
        maxHeight="90vh"
      >
        {exploreMode === "comparison" && <ComparisonPanel />}
        {exploreMode === "equity" && <EquityPanel />}
        {exploreMode === "resilience" && <ResiliencePanel />}
      </MobileModal>

      {/* Global keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </Box>
  )
}
