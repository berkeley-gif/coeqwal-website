"use client"

import React, { useState } from "react"
import {
  Box,
  Drawer,
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

// Width values for the drawer
const drawerWidth = 240
const closedWidth = 64

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}))

export interface MiniDrawerItem {
  text: string
  icon: React.ReactNode
  onClick?: () => void
}

export interface MiniDrawerProps {
  items: MiniDrawerItem[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  position?: "left" | "right"
  header?: React.ReactNode
  footer?: React.ReactNode
}

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

  return (
    <Drawer
      sx={{
        width: open ? drawerWidth : closedWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : closedWidth,
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
      variant="permanent"
      anchor={position}
      open={open}
    >
      {header ? (
        header
      ) : (
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {position === "left" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
      )}

      <Divider />

      <List>
        {items.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
              onClick={item.onClick}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{ opacity: open ? 1 : 0, whiteSpace: "nowrap" }}
              />
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

      {/* Toggle button when closed */}
      {!open && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IconButton onClick={handleDrawerOpen}>
            {position === "left" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}
    </Drawer>
  )
}
