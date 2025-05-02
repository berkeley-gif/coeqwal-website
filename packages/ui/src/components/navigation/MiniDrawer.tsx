"use client"

import React, { useState } from "react"
import {
  Box,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  styled,
} from "@mui/material"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"

// Create a more flexible DrawerHeader component
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1),
  // Let the justifyContent be set by props
}))

// Create a separate component for the title
// const DrawerTitle = styled(Typography)(({ theme }) => ({
//   fontWeight: 700,
//   fontSize: "0.95rem",
//   color: theme.palette.common.white,
//   backgroundColor: theme.palette.primary.main,
//   padding: theme.spacing(0.5, 1.5),
//   borderRadius: theme.shape.borderRadius,
//   marginLeft: theme.spacing(2),
//   marginRight: theme.spacing(1),
//   flexGrow: 1,
//   display: "inline-block",
//   maxWidth: "fit-content",
// }))

export interface MiniDrawerItem {
  /** Text to display for the drawer item */
  text: string
  /** Optional click handler for the drawer item */
  onClick?: () => void
  /** Whether this item is currently active */
  active?: boolean
}

export interface MiniDrawerProps {
  /** Array of items to display in the drawer */
  items: MiniDrawerItem[]
  /** Whether the drawer is open (controlled mode) */
  open?: boolean
  /** Callback when open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void
  /** Position of the drawer */
  position?: "left" | "right"
  /** Optional custom header component */
  header?: React.ReactNode
  /** Optional footer component */
  footer?: React.ReactNode
  /** Optional title to display in the drawer */
  title?: string
}

/**
 * Mini drawer that can collapse to icons-only mode
 * Uses special styling defined in the theme
 */
export function MiniDrawer({
  items,
  open: controlledOpen,
  onOpenChange,
  position = "left",
  header,
  footer,
}: MiniDrawerProps) {
  // Use controlled or uncontrolled open state
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  // Toggle handlers for drawer state
  const handleDrawerOpen = () => {
    if (isControlled) {
      onOpenChange?.(true)
    } else {
      setInternalOpen(true)
    }
  }

  const handleDrawerClose = () => {
    if (isControlled) {
      onOpenChange?.(false)
    } else {
      setInternalOpen(false)
    }
  }

  // Determine which direction icon to use based on open state and position
  const toggleIcon =
    position === "left" ? <ChevronLeftIcon /> : <ChevronRightIcon />

  return (
    <MuiDrawer
      variant="permanent"
      anchor={position}
      open={open}
      className="MiniDrawer-docked"
      classes={{
        paper: "MiniDrawer-paper",
      }}
    >
      {header ? (
        header
      ) : (
        <DrawerHeader
          sx={{
            borderTop: "2px solid #ddd",
            flexDirection: position === "left" ? "row" : "row-reverse",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderBottom: "1px solid #ddd",
            padding: 0,
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={open ? handleDrawerClose : handleDrawerOpen}
            sx={(theme) => ({
              transition: theme.transitions.create(["transform"], {
                duration: theme.transitions.duration.shorter,
              }),
              ...(position === "left" && {
                transform: open ? "rotate(0deg)" : "rotate(180deg)",
              }),
              ...(position === "right" && {
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }),
              margin: theme.spacing(1),
            })}
          >
            {toggleIcon}
          </IconButton>
        </DrawerHeader>
      )}

      <Divider />

      <List
        sx={(theme) => ({
          padding: theme.spacing(1, 0),
          width: "100%",
        })}
      >
        {items.map((item, index) => {
          // Array of background colors to cycle through
          const bgColors = [
            "#BFDADC",
            "#9ACBCF",
            "#71BFB3",
            "#4D9CA0",
            "#2C6E91",
            "#1A3F6B",
          ]

          // Get color based on index (cycling through the array)
          const bgColor = bgColors[index % bgColors.length]

          return (
            <ListItem
              key={index}
              disablePadding
              sx={{
                display: "block",
                padding: 0,
                width: "100%",
              }}
            >
              <ListItemButton
                onClick={item.onClick}
                disableRipple={true}
                sx={(theme) => ({
                  width: "100%",
                  backgroundColor: bgColor,
                  color: theme.palette.common.white,
                  padding: theme.spacing(2),
                  textAlign: "left",
                  "&:hover": {
                    backgroundColor: `${bgColor}dd`,
                    transform: "translateY(-2px)",
                  },
                  // Apply hover styling when item is active
                  ...(item.active && {
                    backgroundColor: `${bgColor}dd`,
                    transform: "translateY(-2px)",
                  }),
                  transition: theme.transitions.create(
                    ["background-color", "transform"],
                    {
                      duration: theme.transitions.duration.shortest,
                    },
                  ),
                })}
              >
                <ListItemText
                  primary={item.text}
                  sx={{
                    margin: 0,
                    "& .MuiListItemText-primary": {
                      fontSize: "1rem",
                      lineHeight: 1.2,
                      color: "inherit",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {footer && (
        <>
          <Divider />
          <Box sx={{ p: open ? 2 : 1 }}>{footer}</Box>
        </>
      )}
    </MuiDrawer>
  )
}
