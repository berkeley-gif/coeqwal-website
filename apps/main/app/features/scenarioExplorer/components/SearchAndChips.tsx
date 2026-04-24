"use client"

/**
 * SearchAndChips - Search input + visibility toggle chips.
 *
 * Shared across the sidebar (non-list modes) and the toolbar (list mode).
 * Reads all state from the scenario-explorer store so consumers just render
 * <SearchAndChips /> with no props.
 */

import React from "react"
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  useTheme,
  icons,
} from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import ToggleChip from "./ToggleChip"
import { useTourAnchor } from "../tour/TourAnchorContext"

interface SearchAndChipsProps {
  /** Show a vertical divider between search and chips (toolbar layout) */
  showDivider?: boolean
  /**
   * Optional small-caps subheader rendered above the chip row to
   * categorize it. Used by the sidebar to label the visibility chips
   * as the scenario-list tuner; omitted in the toolbar variant where
   * the chips are inline with the rest of the toolbar controls.
   */
  chipsEyebrow?: string
}

export default function SearchAndChips({
  showDivider,
  chipsEyebrow,
}: SearchAndChipsProps) {
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
  } = useScenarioExplorerStore()

  const searchAnchorRef = useTourAnchor("list.toolbar.search")
  const chipsRowAnchorRef = useTourAnchor("list.toolbar.chips")
  const themeGroupAnchorRef = useTourAnchor("list.toolbar.themeGroup")
  const showOnlyChosenAnchorRef = useTourAnchor("list.select.showOnlyChosen")
  const showBaselinesAnchorRef = useTourAnchor("list.select.showBaselines")
  const keyOperationsChipAnchorRef = useTourAnchor(
    "list.toolbar.keyOperationsChip",
  )

  return (
    <>
      <Box
        ref={searchAnchorRef}
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
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.5,
          flexBasis: chipsEyebrow ? "100%" : "auto",
          minWidth: 0,
        }}
      >
        {chipsEyebrow && (
          <Typography
            variant="dashboard"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {chipsEyebrow}
          </Typography>
        )}
        <Box
          ref={chipsRowAnchorRef}
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
          />
          <Box ref={showBaselinesAnchorRef} sx={{ display: "inline-flex" }}>
            <ToggleChip
              label="baselines"
              active={showAlternativeBaselines}
              onClick={() =>
                setShowAlternativeBaselines(!showAlternativeBaselines)
              }
            />
          </Box>
          <Box ref={keyOperationsChipAnchorRef} sx={{ display: "inline-flex" }}>
            <ToggleChip
              label="key operations"
              active={showKeyOperations}
              onClick={() => setShowKeyOperations(!showKeyOperations)}
            />
          </Box>
          <Box ref={showOnlyChosenAnchorRef} sx={{ display: "inline-flex" }}>
            <ToggleChip
              label="selected only"
              active={showOnlyChosen}
              onClick={() => setShowOnlyChosen(!showOnlyChosen)}
            />
          </Box>
          <Box ref={themeGroupAnchorRef} sx={{ display: "inline-flex" }}>
            <ToggleChip
              label="group by theme"
              active={groupByTheme}
              onClick={() => setGroupByTheme(!groupByTheme)}
            />
          </Box>
        </Box>
      </Box>
    </>
  )
}
