"use client"

import React, { useMemo } from "react"
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  useTheme,
  icons,
} from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import type { ShareItem } from "../store"
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"
import { useTabNavigation } from "../../../hooks/useTabNavigation"
import ShareScenarioCard from "./ShareScenarioCard"
import type { ChartDataPoint } from "../../scenarios/components/shared/types"

const DRAWER_WIDTH = 360
const TAB_WIDTH = 36

function ShareItemCard({
  item,
  onRemove,
  outcomeNames,
  scenarioLookup,
  allChartData,
}: {
  item: ShareItem
  onRemove: (id: string) => void
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<string, { name: string; description: string }>
  allChartData: Record<string, Record<string, unknown> | undefined>
}) {
  const theme = useTheme()

  if (item.type === "barChart") {
    const info = scenarioLookup.get(item.scenarioId)
    const viewLabel =
      item.viewMode === "distribution"
        ? "Key outcomes distribution"
        : "Key outcomes bar chart"
    const chartData =
      (item.cachedChartData as Record<string, ChartDataPoint[]> | undefined) ??
      (allChartData[item.scenarioId] as Record<string, ChartDataPoint[]> | undefined)
    return (
      <ShareScenarioCard
        scenarioId={item.id}
        name={info?.description ?? info?.name ?? item.scenarioId}
        description={viewLabel}
        chartData={chartData}
        outcomeNames={outcomeNames}
        onRemove={() => onRemove(item.id)}
        viewMode={item.viewMode}
      />
    )
  }

  const radarLabel = `Radar: ${item.scenarioIds.length} scenario${item.scenarioIds.length !== 1 ? "s" : ""}`
  const toggleParts: string[] = []
  if (item.showRange) toggleParts.push("range")
  if (item.highlightBaseline) toggleParts.push("baseline")
  const subtitle =
    toggleParts.length > 0
      ? `with ${toggleParts.join(" + ")}`
      : `${item.axes.length} axes`

  return (
    <Box
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.borderRadius?.sm ?? "6px",
        backgroundColor: theme.palette.background.paper,
        p: 1,
        mb: 1,
        overflow: "hidden",
      }}
    >
      <IconButton
        size="small"
        onClick={() => onRemove(item.id)}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          p: 0.25,
          color: theme.palette.grey[400],
          "&:hover": { color: theme.palette.grey[700] },
          zIndex: 1,
        }}
      >
        <icons.Close sx={{ fontSize: "0.875rem" }} />
      </IconButton>
      {item.cachedImageDataUrl && (
        <Box
          component="img"
          src={item.cachedImageDataUrl}
          alt={radarLabel}
          sx={{
            width: "100%",
            height: "auto",
            maxHeight: 120,
            objectFit: "contain",
            borderRadius: "4px",
            backgroundColor: "#fff",
            mb: 0.75,
          }}
        />
      )}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
          fontSize: "0.75rem",
          pr: 2.5,
        }}
      >
        {radarLabel}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          lineHeight: 1.3,
          color: theme.palette.grey[600],
          fontSize: "0.6875rem",
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  )
}

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
        borderRadius: "8px 0 0 8px",
        cursor: "pointer",
        pointerEvents: "auto",
        backgroundColor: theme.palette.blue.bright,
        color: "#fff",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
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
            borderRadius: "9px",
            backgroundColor: "#fff",
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

export default function ShareDrawer() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  const {
    shareItems,
    showShareDrawer,
    setShowShareDrawer,
    removeShareItem,
    clearShareItems,
  } = useScenarioExplorerStore()

  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  const scenarioLookup = useMemo(() => {
    const map = new Map<string, { name: string; description: string }>()
    siblingGroups.forEach((s) => {
      map.set(s.scenarioId, { name: s.shortLabel, description: s.label })
    })
    return map
  }, [siblingGroups])

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
            boxShadow: "-4px 0 12px rgba(0,0,0,0.08)",
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
                borderRadius: "12px",
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
              <ShareItemCard
                key={item.id}
                item={item}
                onRemove={removeShareItem}
                outcomeNames={outcomeNames}
                scenarioLookup={scenarioLookup}
                allChartData={allChartData as Record<string, Record<string, unknown> | undefined>}
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
