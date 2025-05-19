"use client"

import { useState } from "react"
import { Box, Drawer, useTheme, Typography, Fade } from "@mui/material"

// Content components
import { CurrentOpsContent } from "./drawer-content"

// Types
export type TabKey = "glossary"

// Props for the rail buttons
interface RailButtonProps {
  label: string
  onClick: () => void
  active?: boolean
  bgColor: string
  hoverColor: string
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
}: RailButtonProps) {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: active ? "#60aacb" : bgColor,
        color: "#FFFFFF", // White text to match secondary nav
        borderRadius: "8px 0 0 8px", // Rounded corners on the left side only
        boxShadow: "none",
        padding: "12px 2px", // Reduced horizontal padding
        my: 0,
        width: "60px", // Wider to accommodate longer text
        height: "220px", // Increased height for more text space
        cursor: "pointer",
        position: "relative",
        borderRight: active
          ? `4px solid ${theme.palette.primary.dark}`
          : "none",
        border: "none", // Remove border
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: active ? "#60aacb" : hoverColor,
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
   * When true, displays a vertical rail button on the left side for toggling the drawer
   * @default false
   */
  showRailButton?: boolean
}

// Map of tab keys to display titles
const tabTitles: Record<TabKey, string> = {
  glossary: "GLOSSARY",
}

/**
 * MultiDrawer component with a single Glossary tab
 *
 * Features:
 * - Drawer with glossary content
 * - Smooth transitions
 * - Can be controlled from outside via HeaderHome
 */
export function MultiDrawer({
  drawerWidth = 360,
  onDrawerStateChange,
  activeTab: controlledActiveTab,
  overlay = false,
  drawerContent = {},
  showRailButton = false,
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
    glossary: "#60aacb",
  }

  // Track the bg color to apply to drawer paper, preserve while closing
  const [drawerBg, setDrawerBg] = useState<string>(tabBg.glossary)

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
      {/* Rail button - only shown when showRailButton is true */}
      {showRailButton && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: 0,
            transform: "translateY(-50%)",
            zIndex: theme.zIndex.drawer - 1,
          }}
        >
          <RailButton
            label={tabTitles.glossary}
            onClick={() => toggleTab("glossary")}
            active={activeTab === "glossary"}
            bgColor="#3F7DA2" // Slightly darker than the active color
            hoverColor="#5195BD" // Slightly lighter than active color
          />
        </Box>
      )}

      {/* Main drawer with glossary content */}
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
        <Fade in={activeTab === "glossary"}>
          <Box
            sx={{
              display: activeTab === "glossary" ? "block" : "none",
              height: "100%",
              overflow: "auto",
            }}
          >
            {activeTab === "glossary" && (
              <>
                <Box
                  sx={{
                    background: "linear-gradient(to right, #FFAC6E, #60aacb)",
                    color: theme.palette.common.white,
                    padding: 2,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {tabTitles.glossary}
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
      </Drawer>
    </>
  )
}

export default MultiDrawer
