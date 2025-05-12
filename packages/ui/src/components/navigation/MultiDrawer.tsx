"use client"

import { useState } from "react"
import { Box, Drawer, useTheme, Typography, Fade } from "@mui/material"

// Content components
import {
  LearnContent,
  CurrentOpsContent,
  ThemesContent,
} from "./drawer-content"

// Types
export type TabKey = "learn" | "currentOps" | "themes"

// Props for the rail buttons
interface RailButtonProps {
  label: string
  onClick: () => void
  active?: boolean
  bgColor: string
  hoverColor: string
  topButton?: boolean
  bottomButton?: boolean
}

/**
 * Button component for the mini rail - vertical tab style with vertical text
 */
function RailButton({
  label,
  onClick,
  active,
  bgColor,
  hoverColor,
  topButton,
  bottomButton,
}: RailButtonProps) {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: active ? theme.palette.primary.main : bgColor,
        color: "#FFFFFF", // White text to match secondary nav
        borderRadius: 0, // Remove capsule shape
        boxShadow: "none",
        padding: "12px 2px", // Reduced horizontal padding
        my: 0,
        width: "60px", // Wider to accommodate longer text
        height: "220px", // Increased height for more text space
        cursor: "pointer",
        position: "relative",
        borderTopLeftRadius: topButton ? "8px" : 0,
        borderBottomLeftRadius: bottomButton ? "8px" : 0,
        borderRight: active
          ? `4px solid ${theme.palette.primary.dark}`
          : "none",
        border: "none", // Remove border
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: active ? theme.palette.primary.main : hoverColor,
        },
      }}
      aria-label={`Open ${label} panel`}
    >
      <Typography
        variant="nav"
        sx={{
          fontWeight: 500, // Match secondary nav
          fontSize: theme.typography.nav.fontSize,
          transform: "rotate(-90deg)",
          whiteSpace: "nowrap",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "inherit", // Ensure text color is inherited
          width: "180px", // Ensure enough width for rotated text
          textAlign: "center", // Center the text
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

// Props for the MultiDrawer component
export interface MultiDrawerProps {
  /**
   * Optional override for drawer width
   * @default 360
   */
  drawerWidth?: number

  /**
   * Optional callback when drawer state changes
   */
  onDrawerStateChange?: (isOpen: boolean, activeTab: TabKey | null) => void

  /**
   * Optional prop to control the active tab externally
   * If provided, the drawer becomes a controlled component
   */
  activeTab?: TabKey | null

  /**
   * When true, the drawer and tabs will overlay content instead of pushing it aside
   * @default false
   */
  overlay?: boolean

  /**
   * Optional drawer content that can be passed to drawer components
   */
  drawerContent?: Record<string, unknown>

  /**
   * Controls visibility of the rail+drawer from parent (used for scroll fade).
   * If omitted, component is always visible.
   */
  visible?: boolean
}

// Map of tab keys to display titles
const tabTitles: Record<TabKey, string> = {
  learn: "LEARN ABOUT CALIFORNIA WATER",
  currentOps: "CURRENT OPERATIONS",
  themes: "SCENARIO THEMES",
}

/**
 * MultiDrawer component with three tabs
 *
 * Features:
 * - Always visible mini rail with labeled buttons
 * - Single drawer with different content based on active tab
 * - Smooth transitions between tabs
 */
export function MultiDrawer({
  drawerWidth = 360,
  onDrawerStateChange,
  activeTab: controlledActiveTab,
  overlay = false,
  drawerContent = {},
  visible = true,
}: MultiDrawerProps) {
  const theme = useTheme()

  // State for managing which tab is active
  const [internalActiveTab, setInternalActiveTab] = useState<TabKey | null>(
    null,
  )

  // Use controlled or uncontrolled active tab
  const isControlled = controlledActiveTab !== undefined
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab

  // Derive drawer open state from active tab
  const drawerOpen = activeTab !== null

  // Mapping of tab keys to background colors
  const tabBg: Record<TabKey, string> = {
    learn: "rgb(128, 175, 196)",
    currentOps: "rgb(106, 155, 170)",
    themes: "rgb(87, 137, 154)",
  }

  // Track the bg color to apply to drawer paper, preserve while closing
  const [drawerBg, setDrawerBg] = useState<string>(tabBg.learn)

  // Update drawer state and call optional callback
  const updateDrawerState = (tab: TabKey | null) => {
    if (tab) {
      setDrawerBg(tabBg[tab])
    }
    if (!isControlled) {
      setInternalActiveTab(tab)
    }
    if (onDrawerStateChange) {
      onDrawerStateChange(tab !== null, tab)
    }
  }

  // Close the drawer
  const close = () => updateDrawerState(null)

  // Toggle a tab (open if closed or different tab, close if already open)
  const toggleTab = (tab: TabKey) => {
    if (activeTab === tab) {
      updateDrawerState(null)
    } else {
      updateDrawerState(tab)
    }
  }

  return (
    <>
      {/* Mini rail with vertical tab buttons */}
      <Fade
        in={!drawerOpen && visible}
        timeout={600}
        mountOnEnter
        unmountOnExit
      >
        <Box
          sx={{
            position: "fixed",
            top: "50%", // Position at middle of window height
            right: 0, // Keep in fixed position
            transform: "translateY(-50%)", // Center vertically
            opacity: drawerOpen ? 0 : 1, // Hide when drawer is open
            visibility: drawerOpen ? "hidden" : "visible", // Hide when drawer is open
            zIndex: overlay ? 1299 : 1200, // Ensure tabs are above other content but below drawer
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0, // No gap between buttons
            overflow: "hidden", // Ensure child border-radius is respected
            p: 0, // No padding
            backgroundColor: "transparent", // Transparent background
            border: "none", // No border
            boxShadow: "none", // No shadow
            transition: theme.transitions.create(["opacity", "visibility"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <RailButton
            label="LEARN ABOUT WATER"
            onClick={() => toggleTab("learn")}
            active={activeTab === "learn"}
            bgColor="rgb(128, 175, 196)" /* #80AFC4 */
            hoverColor="rgb(113, 160, 181)" /* #71A0B5 */
            topButton
          />
          <RailButton
            label="CURRENT OPERATIONS"
            onClick={() => toggleTab("currentOps")}
            active={activeTab === "currentOps"}
            bgColor="rgb(106, 155, 170)" /* #6A9BAA */
            hoverColor="rgb(94, 141, 156)" /* #5E8D9C */
          />
          <RailButton
            label="SCENARIO THEMES"
            onClick={() => toggleTab("themes")}
            active={activeTab === "themes"}
            bgColor="rgb(87, 137, 154)" /* #57899A */
            hoverColor="rgb(76, 123, 138)" /* #4C7B8A */
            bottomButton
          />
        </Box>
      </Fade>

      {/* Main drawer with dynamic content */}
      <Drawer
        anchor="right"
        variant="persistent"
        open={drawerOpen}
        onClose={close}
        sx={{
          // Use higher z-index in overlay mode
          zIndex: overlay ? 1300 : theme.zIndex.drawer,
          position: "relative",
          ".MuiDrawer-paper": {
            width: drawerWidth,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: "hidden", // Prevent scrollbar flicker during transitions
            zIndex: overlay ? 1300 : theme.zIndex.drawer,
            // Don't push content in overlay mode
            position: overlay ? "fixed" : "relative",
            backgroundColor: theme.palette.common.white, // Set default background to white
          },
        }}
      >
        {/* Fade transitions for each content section */}
        <Fade in={activeTab === "learn"}>
          <Box
            sx={{
              display: activeTab === "learn" ? "block" : "none",
              height: "100%",
              overflow: "auto",
            }}
          >
            {activeTab === "learn" && (
              <>
                <Box
                  sx={{
                    backgroundColor: drawerBg,
                    color: theme.palette.common.white,
                    padding: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {tabTitles.learn}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.common.white,
                    height: "calc(100% - 56px)", // Adjust based on header height
                    overflow: "auto",
                  }}
                >
                  <LearnContent
                    onClose={close}
                    selectedSection={
                      drawerContent.selectedSection as string | undefined
                    }
                  />
                </Box>
              </>
            )}
          </Box>
        </Fade>

        <Fade in={activeTab === "currentOps"}>
          <Box
            sx={{
              display: activeTab === "currentOps" ? "block" : "none",
              height: "100%",
              overflow: "auto",
            }}
          >
            {activeTab === "currentOps" && (
              <>
                <Box
                  sx={{
                    backgroundColor: drawerBg,
                    color: theme.palette.common.white,
                    padding: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {tabTitles.currentOps}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.common.white,
                    height: "calc(100% - 56px)", // Adjust based on header height
                    overflow: "auto",
                  }}
                >
                  <CurrentOpsContent
                    onClose={close}
                    selectedSection={
                      drawerContent.selectedSection as string | undefined
                    }
                  />
                </Box>
              </>
            )}
          </Box>
        </Fade>

        <Fade in={activeTab === "themes"}>
          <Box
            sx={{
              display: activeTab === "themes" ? "block" : "none",
              height: "100%",
              overflow: "auto",
            }}
          >
            {activeTab === "themes" && (
              <>
                <Box
                  sx={{
                    backgroundColor: drawerBg,
                    color: theme.palette.common.white,
                    padding: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {tabTitles.themes}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.common.white,
                    height: "calc(100% - 56px)", // Adjust based on header height
                    overflow: "auto",
                  }}
                >
                  <ThemesContent
                    onClose={close}
                    selectedOperation={
                      drawerContent.selectedOperation as string | undefined
                    }
                  />
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Drawer>
    </>
  )
}

export default MultiDrawer
