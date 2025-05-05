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
}

/**
 * Button component for the mini rail - vertical tab style with vertical text
 */
function RailButton({ label, onClick, active }: RailButtonProps) {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: active ? theme.palette.primary.main : "#f5f5f5",
        color: active ? "white" : theme.palette.text.primary,
        borderRadius: active ? "4px 0 0 4px" : 4,
        boxShadow: active ? "none" : "0 2px 5px rgba(0,0,0,0.1)",
        padding: "12px 8px",
        my: 0.5,
        width: "48px", // Wider for better visibility
        height: "120px",
        cursor: "pointer",
        position: "relative",
        borderRight: active
          ? `4px solid ${theme.palette.primary.dark}`
          : "none",
        border: active ? "none" : "1px solid rgba(0,0,0,0.1)",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: active
            ? theme.palette.primary.main
            : theme.palette.action.hover,
        },
      }}
      aria-label={`Open ${label} panel`}
    >
      <Typography
        variant="button"
        sx={{
          fontWeight: active ? 600 : 600,
          fontSize: "0.95rem",
          transform: "rotate(-90deg)",
          whiteSpace: "nowrap",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
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
          top: "50%", // Center vertically
          right: drawerOpen ? drawerWidth : 0, // Position relative to drawer
          transform: "translateY(-50%)", // Center vertically without X translation
          opacity: drawerOpen ? 0 : 1, // Hide when drawer is open
          visibility: drawerOpen ? "hidden" : "visible", // Hide when drawer is open
          zIndex: 1200, // Ensure tabs are above other content
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          py: 1.5,
          px: 0.5,
          bgcolor: "white", // Solid background to ensure visibility
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          borderLeft: "1px solid rgba(0,0,0,0.1)",
          borderTop: "1px solid rgba(0,0,0,0.1)",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
          transition: theme.transitions.create(
            ["right", "opacity", "visibility"],
            {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            },
          ),
          // Remove debug outline
        }}
      >
        <RailButton
          label="Learn"
          onClick={() => toggleTab("learn")}
          active={activeTab === "learn"}
        />
        <RailButton
          label="Operations"
          onClick={() => toggleTab("currentOps")}
          active={activeTab === "currentOps"}
        />
        <RailButton
          label="Themes"
          onClick={() => toggleTab("themes")}
          active={activeTab === "themes"}
        />
      </Box>

      {/* Main drawer with dynamic content */}
      <Drawer
        anchor="right"
        variant="persistent"
        open={drawerOpen}
        onClose={close}
        sx={{
          ".MuiDrawer-paper": {
            width: drawerWidth,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: "hidden", // Prevent scrollbar flicker during transitions
            zIndex: theme.zIndex.drawer,
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
