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
import { useScenarioList } from "../../scenarios/hooks"
import { useMultipleScenarioTiers } from "../../scenarios/hooks/useTierData"
import { useTabNavigation } from "../../../hooks/useTabNavigation"
import ShareScenarioCard from "./ShareScenarioCard"

const DRAWER_WIDTH = 360
const TAB_WIDTH = 32

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
        backgroundColor: theme.palette.blue.bright,
        color: "#fff",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
        "&:hover": {
          backgroundColor: theme.palette.blue.darkest,
        },
      }}
    >
      <icons.IosShare sx={{ fontSize: "1rem" }} />
      <Typography
        sx={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          lineHeight: 1,
        }}
      >
        Share
      </Typography>
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
    sharedScenarioIds,
    showShareDrawer,
    setShowShareDrawer,
    removeFromShare,
    clearShared,
    hydroclimatePeriod,
  } = useScenarioExplorerStore()

  const { siblingGroups, buildIdMapping } = useScenarioList()

  const idMapping = useMemo(
    () => buildIdMapping(hydroclimatePeriod),
    [buildIdMapping, hydroclimatePeriod],
  )

  const { allChartData, outcomeNames } = useMultipleScenarioTiers(idMapping)

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
        count={sharedScenarioIds.length}
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
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
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
            sx={{
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: theme.palette.text.primary,
            }}
          >
            Share ({sharedScenarioIds.length})
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowShareDrawer(false)}
            sx={{ p: 0.5 }}
          >
            <icons.Close sx={{ fontSize: "1.125rem" }} />
          </IconButton>
        </Box>

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
          {sharedScenarioIds.length === 0 ? (
            <Typography
              sx={{
                fontSize: "0.8125rem",
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
            sharedScenarioIds.map((id) => {
              const info = scenarioLookup.get(id)
              return (
                <ShareScenarioCard
                  key={id}
                  scenarioId={id}
                  name={info?.name ?? id}
                  description={info?.description ?? ""}
                  chartData={allChartData[id]}
                  outcomeNames={outcomeNames}
                  onRemove={removeFromShare}
                />
              )
            })
          )}
        </Box>

        {/* Footer actions */}
        {sharedScenarioIds.length > 0 && (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              size="small"
              onClick={clearShared}
              sx={{
                textTransform: "none",
                color: theme.palette.grey[600],
                fontSize: "0.75rem",
              }}
            >
              Clear all
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleGoToShare}
              sx={{ textTransform: "none", fontSize: "0.8125rem" }}
            >
              Go to Share
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  )
}
