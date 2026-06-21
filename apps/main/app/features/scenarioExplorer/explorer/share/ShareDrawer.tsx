"use client"

import React, { useCallback } from "react"
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  useTheme,
  icons,
} from "@repo/ui/mui"
import { useWorkspaceSlice } from "../store"
import { useTabNavigation } from "../../../../hooks/useTabNavigation"
import ShareItemView from "./ShareItemView"
import { useShareRenderContext } from "./hooks/useShareRenderContext"
import { ShareRadarLiveProvider } from "./ShareRadarLiveProvider"

const DRAWER_WIDTH = 360
const TAB_WIDTH = 36

function ShareTab({
  count,
  isOpen,
  onClick,
}: {
  count: number
  isOpen: boolean
  onClick: () => void
}) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        position: "fixed",
        right: isOpen ? DRAWER_WIDTH : 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: (theme.zIndex?.drawer ?? 1200) + 1,
        transition: "right 225ms cubic-bezier(0, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0.5,
        width: TAB_WIDTH,
        py: 1.5,
        px: 0.5,
        border: "none",
        borderRadius: `${theme.borderRadius.md} 0 0 ${theme.borderRadius.md}`,
        cursor: "pointer",
        pointerEvents: "auto",
        backgroundColor: theme.palette.blue.bright,
        color: theme.palette.common.white,
        boxShadow: theme.shadow.md,
        "&:hover": {
          backgroundColor: theme.palette.blue.darkest,
        },
      }}
    >
      <icons.IosShare sx={{ fontSize: "1rem" }} />
      <Box
        sx={{
          width: TAB_WIDTH,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            lineHeight: 1,
            transform: "rotate(-90deg)",
            whiteSpace: "nowrap",
          }}
        >
          Share
        </Typography>
      </Box>
      {count > 0 && (
        <Box
          sx={{
            mt: 0.25,
            minWidth: 18,
            height: 18,
            borderRadius: theme.borderRadius.circle,
            backgroundColor: theme.palette.common.white,
            color: theme.palette.blue.bright,
            fontSize: "0.625rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  )
}

/**
 * Explore-tab share drawer. The default export wraps the content in
 * `ShareRadarLiveProvider` so `useShareRenderContext` can read live
 * radar data for every hydroclimate.
 */
export default function ShareDrawer() {
  return (
    <ShareRadarLiveProvider>
      <ShareDrawerContent />
    </ShareRadarLiveProvider>
  )
}

function ShareDrawerContent() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  const {
    shareItems,
    showShareDrawer,
    setShowShareDrawer,
    removeShareItem,
    clearShareItems,
    updateShareItem,
  } = useWorkspaceSlice()

  const { scenarioLookup, radarLiveByHydro, outcomeNames, allChartData } =
    useShareRenderContext()

  const handleNoteChange = useCallback(
    (id: string, note: string) => {
      updateShareItem(id, { note })
    },
    [updateShareItem],
  )

  const handleGoToShare = () => {
    setShowShareDrawer(false)
    navigateToTab("share")
    const tabsArea = document.querySelector("[data-tab-panels]")
    if (tabsArea) {
      tabsArea.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <ShareTab
        count={shareItems.length}
        isOpen={showShareDrawer}
        onClick={() => setShowShareDrawer(!showShareDrawer)}
      />
      <Drawer
        anchor="right"
        variant="persistent"
        open={showShareDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            height: "100vh",
            maxHeight: "100vh",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pointerEvents: "auto",
            boxShadow: theme.shadow.lg,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Share ({shareItems.length})
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowShareDrawer(false)}
            sx={{ p: 0.5 }}
          >
            <icons.Close sx={{ fontSize: "1.125rem" }} />
          </IconButton>
        </Box>

        {/* Action chips */}
        {shareItems.length > 0 && (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              gap: 0.75,
              px: 2,
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={clearShareItems}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                px: 1.25,
                py: 0.5,
                border: "none",
                borderRadius: theme.borderRadius.lg,
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 500,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                color: theme.palette.grey[800],
                background: theme.palette.grey[200],
                transition: "all 150ms ease",
                "&:hover": {
                  background: theme.palette.interaction.selectedBackground,
                  color: theme.palette.blue.bright,
                },
              }}
            >
              <icons.Close sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
              Clear all
            </Box>
          </Box>
        )}

        {/* Scrollable card list */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 1.5,
            py: 1.5,
          }}
        >
          {shareItems.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[500],
                textAlign: "center",
                mt: 4,
              }}
            >
              No scenarios staged.
              <br />
              Click the share icon on a scenario to add it.
            </Typography>
          ) : (
            shareItems.map((item) => (
              <ShareItemView
                key={item.id}
                item={item}
                onRemove={removeShareItem}
                onNoteChange={handleNoteChange}
                outcomeNames={outcomeNames}
                scenarioLookup={scenarioLookup}
                allChartData={allChartData}
                radarLiveByHydro={radarLiveByHydro}
              />
            ))
          )}
        </Box>

        {/* Footer actions */}
        {shareItems.length > 0 && (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={handleGoToShare}
              sx={{ textTransform: "none", fontSize: "0.875rem" }}
            >
              Go to Share
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  )
}
