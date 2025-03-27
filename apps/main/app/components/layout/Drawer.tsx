"use client"

import React from "react"
import {
  SwipeableDrawer,
  Box,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
} from "@mui/material"
import CustomArrowForwardIcon from "@repo/ui/customArrowForwardIcon"
import { useTranslation } from "@repo/i18n"

interface DrawerProps {
  open: boolean
  onOpen: (event: React.KeyboardEvent | React.MouseEvent) => void
  onClose: (event: React.KeyboardEvent | React.MouseEvent) => void
}

const Drawer: React.FC<DrawerProps> = ({ open, onOpen, onClose }) => {
  const { t, messages } = useTranslation()

  let linkKeys: string[] = []

  try {
    const drawerLinks = messages.drawerLinks
    if (
      drawerLinks &&
      typeof drawerLinks === "object" &&
      "links" in drawerLinks
    ) {
      const links = drawerLinks.links
      if (links && typeof links === "object") {
        linkKeys = Object.keys(links)
      }
    }
  } catch (e) {
    console.error("Error accessing link keys:", e)
  }

  const drawerList = () => (
    <Box role="presentation" onClick={onClose} onKeyDown={onClose}>
      <List>
        {linkKeys.map((key, index) => (
          <React.Fragment key={`${key}-${index}`}>
            <ListItem disablePadding>
              <ListItemButton
                component="a"
                href={`#${key}`}
                sx={{ color: "text.secondary" }}
              >
                <ListItemText primary={t(`drawerLinks.links.${key}`)} />
                <CustomArrowForwardIcon />
              </ListItemButton>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      <Button onClick={onClose} style={{ marginTop: "16px", width: "100%" }}>
        {t("drawerButton.close")}
      </Button>
    </Box>
  )

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      slotProps={{
        backdrop: {
          invisible: true, // Disable backdrop darkening
        },
      }}
    >
      {drawerList()}
    </SwipeableDrawer>
  )
}

export default Drawer
