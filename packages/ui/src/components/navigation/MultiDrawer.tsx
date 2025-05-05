"use client"

import React, { useState } from "react"
import {
  Box,
  Drawer,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  Typography,
} from "@mui/material"

// Icons
import SchoolIcon from "@mui/icons-material/School"
import SettingsIcon from "@mui/icons-material/Settings"
import StarIcon from "@mui/icons-material/Star"

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
}

/**
 * Button component for the mini rail - vertical tab style with vertical text
 */
function RailButton({ label, onClick, active, bgColor, hoverColor }: RailButtonProps) {
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
        height: "180px", // Taller to accommodate longer text
        cursor: "pointer",
        position: "relative",
        borderRight: active ? `4px solid ${theme.palette.primary.dark}` : "none",
        border: "none", // Remove border
        transition: "all 0.2s ease",
        "&:hover": { 
          bgcolor: active 
            ? theme.palette.primary.main 
            : hoverColor,
        },
      }}
      aria-label={`Open ${label} panel`}
    >
      <Typography 
        variant="button" 
        sx={{ 
          fontWeight: 500, // Match secondary nav
          fontSize: "0.75rem", // Match secondary nav
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

  // Update drawer state and call optional callback
  const updateDrawerState = (tab: TabKey | null) => {
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
      <Box
        sx={{
          position: "fixed",
          top: theme.layout.headerHeight, // Position directly under header
          right: 0, // Keep in fixed position
          transform: "translateY(0)", // No vertical centering
          opacity: drawerOpen ? 0 : 1, // Hide when drawer is open
          visibility: drawerOpen ? "hidden" : "visible", // Hide when drawer is open
          zIndex: overlay ? 1299 : 1200, // Ensure tabs are above other content but below drawer
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0, // No gap between buttons
          p: 0, // No padding
          backgroundColor: "transparent", // Transparent background
          borderRadius: 0, // No border radius
          border: "none", // No border
          boxShadow: "none", // No shadow
          transition: theme.transitions.create(
            ["opacity", "visibility"],
            {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            },
          ),
        }}
      >
        <RailButton
          label="LEARN ABOUT WATER"
          onClick={() => toggleTab("learn")}
          active={activeTab === "learn"}
          bgColor="rgb(191, 218, 220)"
          hoverColor="rgb(172, 196, 198)"
        />
        <RailButton
          label="CURRENT OPERATIONS"
          onClick={() => toggleTab("currentOps")}
          active={activeTab === "currentOps"}
          bgColor="rgb(154, 203, 207)"
          hoverColor="rgb(139, 183, 186)"
        />
        <RailButton
          label="SCENARIO THEMES"
          onClick={() => toggleTab("themes")}
          active={activeTab === "themes"}
          bgColor="rgb(118, 178, 190)"
          hoverColor="rgb(106, 160, 171)"
        />
      </Box>

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
            {activeTab === "learn" && <LearnContent onClose={close} />}
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
              <CurrentOpsContent onClose={close} />
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
            {activeTab === "themes" && <ThemesContent onClose={close} />}
          </Box>
        </Fade>
      </Drawer>
    </>
  )
}

export default MultiDrawer
