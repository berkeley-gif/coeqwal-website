"use client"

import { useState } from "react"
import {
  Box,
  Drawer,
  useTheme,
  Typography,
  Fade,
  IconButton,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { motion, AnimatePresence } from "@repo/motion"

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
  icon?: React.ReactNode
}

/**
 * Button component for the mini rail, vertical tab style with vertical text
 */
function RailButton({
  label,
  onClick,
  active,
  bgColor,
  hoverColor,
  icon,
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
        color: "#FFFFFF",
        borderRadius: "8px 0 0 8px", // Rounded corners on the left side only (tabs are on right, so round toward center)
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
        border: "none",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: active ? "#60aacb" : hoverColor,
        },
      }}
      aria-label={`Open ${label} panel`}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          transform: "rotate(-90deg)",
          transformOrigin: "center",
          width: "180px",
        }}
      >
        <Typography
          variant="nav"
          sx={{
            fontWeight: 500,
            fontSize: theme.typography.nav.fontSize,
            whiteSpace: "nowrap",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "inherit",
            textAlign: "center",
          }}
        >
          {label}
        </Typography>
        {icon && (
          <Box
            component="button"
            onClick={(e) => {
              e.stopPropagation() // Prevent triggering the rail button
              console.log("Save to story clicked")
            }}
            sx={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ml: 0.5,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              "&:hover": {
                transform: "scale(1.1)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <Box
              sx={{
                fontSize: "1.5rem",
                color: active ? "#449cd9" : "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </Box>
          </Box>
        )}
      </Box>
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
  showRailButtons?: boolean

  /**
   * Optional offset from top to account for fixed header
   * @default 0
   */
  headerOffset?: number
}

// Map of tab keys to display titles
const tabTitles: Record<TabKey, string> = {
  glossary: "Glossary",
}

/**
 * MultiDrawer component with glossary content
 */
export function MultiDrawer({
  drawerWidth = undefined,
  onDrawerStateChange,
  activeTab: controlledActiveTab,
  overlay = false,
  drawerContent = {},
  showRailButtons = false,
  headerOffset = 0,
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
    glossary: theme.palette.blue.medium,
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
      {/* Rail buttons - only shown when showRailButtons is true */}
      <AnimatePresence>
        {showRailButtons && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
            style={{
              position: "fixed",
              top: `calc(50% + ${headerOffset}px)`,
              right: drawerOpen
                ? (drawerWidth ??
                  theme.layout.drawer.width ??
                  theme.layout.drawer.glossaryWidth)
                : 0,
              transform: "translateY(-50%)",
              zIndex: theme.zIndex.drawerBackdrop,
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(1),
              transition: theme.transitions.create("right", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <RailButton
              label={tabTitles.glossary}
              onClick={() => toggleTab("glossary")}
              active={activeTab === "glossary"}
              bgColor={theme.palette.blue.dark} // Slightly darker blue for rail button
              hoverColor={theme.palette.blue.bright} // Slightly lighter blue for hover
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main drawer with glossary content */}
      <Drawer
        anchor="right"
        variant="persistent"
        open={drawerOpen}
        onClose={close}
        sx={{
          // Use overlay z-index in overlay mode, otherwise use drawer z-index
          zIndex: overlay ? theme.zIndex.overlay : theme.zIndex.drawer,
          position: "relative",
          ".MuiDrawer-paper": {
            width:
              drawerWidth ??
              theme.layout.drawer.width ??
              theme.layout.drawer.glossaryWidth,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: "hidden", // Prevent scrollbar flicker during transitions
            zIndex: overlay ? theme.zIndex.overlay : theme.zIndex.drawer,
            // Don't push content in overlay mode
            position: overlay ? "fixed" : "relative",
            // Account for header height when in overlay mode
            top: overlay ? `${headerOffset}px` : 0,
            height: overlay ? `calc(100vh - ${headerOffset}px)` : "100vh",
            backgroundColor: drawerBg, // Use the tracked background color
            borderTopLeftRadius: theme.borderRadius.rounded,
          },
        }}
      >
        {/* Glossary Content */}
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
                    background: theme.palette.blue.medium, // Use the beautiful medium blue
                    color: theme.palette.common.white,
                    padding: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minHeight: "56px",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.common.white,
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {tabTitles.glossary}
                  </Typography>
                  <IconButton
                    onClick={close}
                    size="small"
                    aria-label="close drawer"
                    sx={{
                      color: theme.palette.common.white,
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
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
                    selectedTerm={
                      drawerContent.selectedTerm as string | undefined
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
