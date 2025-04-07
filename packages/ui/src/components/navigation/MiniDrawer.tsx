"use client"

import React, { useState } from "react"
import {
  Box,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  styled,
} from "@mui/material"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(1),
}))

export interface MiniDrawerItem {
  /** Text to display for the drawer item */
  text: string
  /** Icon to display for the drawer item */
  icon: React.ReactNode
  /** Optional click handler for the drawer item */
  onClick?: () => void
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
  const toggleIcon = open ? (
    position === "left" ? (
      <ChevronLeftIcon />
    ) : (
      <ChevronRightIcon />
    )
  ) : position === "left" ? (
    <ChevronRightIcon />
  ) : (
    <ChevronLeftIcon />
  )

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
        <DrawerHeader>
          <IconButton onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {toggleIcon}
          </IconButton>
        </DrawerHeader>
      )}

      <Divider />

      <List>
        {items.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton onClick={item.onClick}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
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
