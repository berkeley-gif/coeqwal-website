"use client"

import React, { useCallback, useMemo } from "react"
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
import ShareRadarCard from "./ShareRadarCard"
import ShareSnapshotCard from "./ShareSnapshotCard"
import type { ChartDataPoint } from "../../scenarios/components/shared/types"
import { OUTCOME_NAMES, type OutcomeCode } from "../../../content/outcomes"

const DRAWER_WIDTH = 360
const TAB_WIDTH = 36

function outcomeCodesToLabels(codes: string[]): string[] {
  return codes.map(
    (code) => OUTCOME_NAMES[code as OutcomeCode] ?? code,
  )
}

function ShareItemCard({
  item,
  onRemove,
  onNoteChange,
  outcomeNames,
  scenarioLookup,
  allChartData,
}: {
  item: ShareItem
  onRemove: (id: string) => void
  onNoteChange: (id: string, note: string) => void
  outcomeNames: { shortCode: string; displayName: string }[]
  scenarioLookup: Map<
    string,
    {
      name: string
      description: string
      definition: string
      shortLabel: string
    }
  >
  allChartData: Record<string, Record<string, unknown> | undefined>
}) {
  if (item.type === "barChart") {
    const info = scenarioLookup.get(item.scenarioId)
    const viewLabel =
      item.viewMode === "average"
        ? "Key outcomes average"
        : item.viewMode === "distribution"
          ? "Key outcomes distribution"
          : "Key outcomes bar chart"
    const chartData =
      (item.cachedChartData as Record<string, ChartDataPoint[]> | undefined) ??
      (allChartData[item.scenarioId] as
        | Record<string, ChartDataPoint[]>
        | undefined)
    return (
      <ShareScenarioCard
        scenarioId={item.id}
        name={info?.description ?? info?.name ?? item.scenarioId}
        scenarioDefinition={info?.definition}
        description={viewLabel}
        hydroclimate={item.hydroclimate}
        chartData={chartData}
        outcomeNames={outcomeNames}
        onRemove={() => onRemove(item.id)}
        viewMode={item.viewMode}
      />
    )
  }

  if (item.type === "radar") {
    const radarScenarioNames = item.scenarioIds.map(
      (id) =>
        scenarioLookup.get(id)?.description ??
        scenarioLookup.get(id)?.name ??
        id,
    )
    const radarScenarioDefinitions = item.scenarioIds.map(
      (id) => scenarioLookup.get(id)?.definition ?? "",
    )

    return (
      <ShareRadarCard
        scenarioNames={radarScenarioNames}
        scenarioDefinitions={radarScenarioDefinitions}
        scenarioColors={item.scenarioColors}
        hydroclimate={item.hydroclimate}
        showRange={item.showRange}
        highlightBaseline={item.highlightBaseline}
        showDotsOnly={item.showDotsOnly}
        cachedImageDataUrl={item.cachedImageDataUrl}
        onRemove={() => onRemove(item.id)}
      />
    )
  }

  if (item.type === "equity") {
    const info = scenarioLookup.get(item.scenarioId)
    const outcomeChips = outcomeCodesToLabels(item.outcomeCodes)
    return (
      <ShareSnapshotCard
        id={item.id}
        toolLabel="Distribution"
        title={info?.description ?? info?.name ?? item.scenarioId}
        subtitle={
          item.compareToBaseline
            ? "Compared to today's operations"
            : "Single scenario view"
        }
        chips={outcomeChips}
        hydroclimate={item.hydroclimate}
        cachedImageDataUrl={item.cachedImageDataUrl}
        note={item.note}
        onNoteChange={(note) => onNoteChange(item.id, note)}
        onRemove={onRemove}
      />
    )
  }

  if (item.type === "resilience") {
    const outcomeChips = outcomeCodesToLabels(item.outcomeCodes)
    const scenarioChips = item.scenarioIds.map(
      (id) =>
        scenarioLookup.get(id)?.shortLabel ??
        scenarioLookup.get(id)?.name ??
        id,
    )
    const viewLabel =
      item.view === "aggregate"
        ? "Aggregate across library"
        : item.view === "scenario"
          ? "By scenario"
          : item.view === "outcome"
            ? "By outcome"
            : item.view
    const encodingLabel = item.cellEncoding
      .replace(/_/g, " ")
      .replace(/^./, (c) => c.toUpperCase())
    return (
      <ShareSnapshotCard
        id={item.id}
        toolLabel="Resilience"
        title={`${viewLabel}: ${encodingLabel}`}
        subtitle={
          item.scenarioIds.length
            ? `${item.scenarioIds.length} scenario${item.scenarioIds.length === 1 ? "" : "s"} in scope`
            : "Full library"
        }
        chips={[...scenarioChips.slice(0, 4), ...outcomeChips]}
        hydroclimate={item.hydroclimates[0]}
        cachedImageDataUrl={item.cachedImageDataUrl}
        note={item.note}
        onNoteChange={(note) => onNoteChange(item.id, note)}
        onRemove={onRemove}
      />
    )
  }

  return null
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
        color: theme.palette.common.white,
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

export default function ShareDrawer() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  const {
    shareItems,
    showShareDrawer,
    setShowShareDrawer,
    removeShareItem,
    clearShareItems,
    updateShareItem,
  } = useScenarioExplorerStore()

  const { siblingGroups, allChartData, outcomeNames } =
    useResolvedScenarioTiers()

  const scenarioLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string
        description: string
        definition: string
        shortLabel: string
      }
    >()
    siblingGroups.forEach((s) => {
      map.set(s.scenarioId, {
        name: s.shortLabel,
        description: s.label,
        definition: s.description,
        shortLabel: s.shortLabel,
      })
    })
    return map
  }, [siblingGroups])

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
                onNoteChange={handleNoteChange}
                outcomeNames={outcomeNames}
                scenarioLookup={scenarioLookup}
                allChartData={
                  allChartData as Record<
                    string,
                    Record<string, unknown> | undefined
                  >
                }
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
