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
  Typography,
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

      <List
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: theme.spacing(1.5),
          my: theme.spacing(3),
          px: 0,
        })}
      >
        {items.map((item, index) => {
          // Array of background colors to cycle through
          const bgColors = [
            "#D2E6E7",
            "#9ACBCF",
            "#71BFB3",
            "#4D9CA0",
            "#2C6E91",
            "#1A3F6B",
          ]

          // Get color based on index (cycling through the array)
          const bgColor = bgColors[index % bgColors.length]

          // Determine if this is a dark color that needs white text
          const isDarkColor =
            bgColor === "#132C10" ||
            bgColor === "#244A25" ||
            bgColor === "#247061"

          return (
            <ListItem
              key={index}
              disablePadding
              sx={{
                display: "block",
                padding: 0,
                width: "176px",
              }}
            >
              <ListItemButton
                onClick={item.onClick}
                sx={{
                  padding: (theme) => theme.spacing(2, 2),
                  width: "100%",
                  backgroundColor: bgColor,
                  color: isDarkColor ? "#FFFFFF" : "#000000",
                  "&:hover": {
                    backgroundColor: `${bgColor}dd`,
                    boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)",
                  },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "inherit",
                    mb: 1,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      variant: "body2",
                      sx: {
                        fontWeight: 500,
                        lineHeight: 1.2,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 3,
                        width: "100%",
                        textAlign: "center",
                      },
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
