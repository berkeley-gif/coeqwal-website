"use client"

/**
 * SearchAndChips — Search input + visibility toggle chips.
 *
 * Shared across the sidebar (non-list modes) and the toolbar (list mode).
 * Reads all state from the scenario-explorer store so consumers just render
 * <SearchAndChips /> with no props.
 */

import React from "react"
import { Box, IconButton, InputBase, useTheme, icons } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import ToggleChip from "./ToggleChip"

interface SearchAndChipsProps {
  /** Show a vertical divider between search and chips (toolbar layout) */
  showDivider?: boolean
}

export default function SearchAndChips({ showDivider }: SearchAndChipsProps) {
  const theme = useTheme()
  const {
    searchQuery,
    setSearchQuery,
    showDefinitions,
    setShowDefinitions,
    showAlternativeBaselines,
    setShowAlternativeBaselines,
    showKeyOperations,
    setShowKeyOperations,
    showOnlyChosen,
    setShowOnlyChosen,
    groupByTheme,
    setGroupByTheme,
    sharedScenarioIds,
    setShowShareDrawer,
  } = useScenarioExplorerStore()

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: 140,
          maxWidth: 200,
          border: `1px solid ${theme.palette.grey[300]}`,
          borderRadius: 1,
          px: 1,
          py: 0.25,
          backgroundColor: theme.palette.background.paper,
          transition: "border-color 0.15s",
          "&:focus-within": {
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <InputBase
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search scenarios"
          size="small"
          inputProps={{ "aria-label": "Search scenarios" }}
          sx={{
            flex: 1,
            fontSize: "0.8125rem",
            "& .MuiInputBase-input": {
              py: 0.25,
              px: 0,
              "&::placeholder": {
                color: theme.palette.grey[500],
                opacity: 1,
              },
            },
          }}
        />
        {searchQuery && (
          <IconButton
            size="small"
            onClick={() => setSearchQuery("")}
            sx={{ p: 0.25 }}
          >
            <icons.Close sx={{ fontSize: "0.875rem" }} />
          </IconButton>
        )}
      </Box>

      {showDivider && (
        <Box
          sx={{
            width: "1px",
            height: 24,
            backgroundColor: theme.palette.divider,
            flexShrink: 0,
          }}
        />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          flexWrap: "wrap",
        }}
      >
        <ToggleChip
          label="definitions"
          active={showDefinitions}
          onClick={() => setShowDefinitions(!showDefinitions)}
          tooltip={showDefinitions ? "Hide definitions" : "Show definitions"}
        />
        <ToggleChip
          label="baselines"
          active={showAlternativeBaselines}
          onClick={() => setShowAlternativeBaselines(!showAlternativeBaselines)}
          tooltip={
            showAlternativeBaselines
              ? "Hide extra baselines"
              : "Show extra baselines"
          }
        />
        <ToggleChip
          label="key ops"
          active={showKeyOperations}
          onClick={() => setShowKeyOperations(!showKeyOperations)}
          tooltip={
            showKeyOperations ? "Hide key operations" : "Show key operations"
          }
        />
        <ToggleChip
          label={showOnlyChosen ? "chosen only" : "all scenarios"}
          active={showOnlyChosen}
          onClick={() => setShowOnlyChosen(!showOnlyChosen)}
          tooltip={showOnlyChosen ? "Show all scenarios" : "Show chosen only"}
        />
        <ToggleChip
          label={groupByTheme ? "grouped by theme" : "ungrouped by theme"}
          active={groupByTheme}
          onClick={() => setGroupByTheme(!groupByTheme)}
          tooltip={
            groupByTheme
              ? "Ungroup scenarios by theme"
              : "Group scenarios by theme"
          }
        />
        {sharedScenarioIds.length > 0 && (
          <ToggleChip
            label={`share (${sharedScenarioIds.length})`}
            active={true}
            onClick={() => setShowShareDrawer(true)}
            tooltip="Open share drawer"
          />
        )}
      </Box>
    </>
  )
}
