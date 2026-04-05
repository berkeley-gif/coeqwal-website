"use client"

/**
 * ToolToolbar.Shared toolbar rendered above the active tool content.
 *
 * Layout (left to right):
 * 1. "Show map" toggle (label + MUI Switch)
 * 2. "View by climate".hydroclimate chooser icons
 * 3. Tool tabs (List, Tradeoffs, Equity, Resilience, Data in depth)
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  ViewListIcon,
  CompareArrowsIcon,
  AppsIcon,
  AutorenewIcon,
  InsightsIcon,
  Switch,
} from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"
import { useScenarioExplorerStore, type ExploreMode } from "../store"

const TOOL_TABS: { mode: ExploreMode; icon: React.ReactNode; label: string }[] =
  [
    {
      mode: "list",
      icon: <ViewListIcon sx={{ fontSize: "1.1rem" }} />,
      label: "List",
    },
    {
      mode: "comparison",
      icon: <CompareArrowsIcon sx={{ fontSize: "1.1rem" }} />,
      label: "Tradeoffs",
    },
    {
      mode: "equity",
      icon: <AppsIcon sx={{ fontSize: "1.1rem" }} />,
      label: "Equity",
    },
    {
      mode: "resilience",
      icon: <AutorenewIcon sx={{ fontSize: "1.1rem" }} />,
      label: "Resilience",
    },
    {
      mode: "data",
      icon: <InsightsIcon sx={{ fontSize: "1.1rem" }} />,
      label: "Data in depth",
    },
  ]

export default function ToolToolbar() {
  const theme = useTheme()
  const {
    exploreMode,
    setExploreMode,
    hydroclimate,
    setHydroclimate,
    showMap,
    setShowMap,
  } = useScenarioExplorerStore()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        py: 0.5,
        minHeight: 44,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          Show map
        </Typography>
        <Switch
          size="small"
          checked={showMap}
          onChange={(_, checked) => setShowMap(checked)}
          sx={{ ml: -0.5 }}
        />
      </Box>

      <Box
        sx={{
          width: "1px",
          height: 24,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          View by climate
        </Typography>
        <HydroclimateChooser
          layout="horizontal"
          showTitle={false}
          showLabels={false}
          hideDisabled
          iconSize="28px"
          iconFontSize="1rem"
          value={hydroclimate}
          onChange={setHydroclimate}
        />
      </Box>

      <Box
        sx={{
          width: "1px",
          height: 24,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
        {TOOL_TABS.map(({ mode, icon, label }) => {
          const active = exploreMode === mode
          return (
            <Box
              key={mode}
              component="button"
              type="button"
              onClick={() => setExploreMode(mode)}
              aria-pressed={active}
              aria-label={label}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.25,
                py: 0.5,
                border: "none",
                borderRadius: theme.borderRadius.sm ?? "4px",
                cursor: "pointer",
                background: active
                  ? theme.palette.interaction.selectedBackground
                  : "transparent",
                color: active
                  ? theme.palette.blue.bright
                  : theme.palette.text.primary,
                fontWeight: active ? 600 : 400,
                transition: "opacity 0.15s, background-color 0.15s",
                "&:hover": {
                  background: theme.palette.interaction.selectedBackground,
                },
              }}
            >
              {icon}
              <Typography
                component="span"
                variant="subtitle2"
                sx={{
                  fontWeight: "inherit",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
