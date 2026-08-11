"use client"

import { useState } from "react"
import {
  Box,
  Checkbox,
  ListItemText,
  Menu,
  MenuItem,
  KeyboardArrowDownIcon,
  useTheme,
} from "@repo/ui/mui"
import ChartControlsBar from "../../chrome/layout/ChartControlsBar"
import { InlineToggleChip } from "../../chrome/chips/InlineToggleChip"
import { SaveSnapshotButton } from "../../chrome/actions/SaveSnapshotButton"
import { SimpleButton } from "../../chrome/actions/SimpleButton"
import { mapActions } from "../../../../../map/store"
import { useMap } from "@repo/map"
import { useWorkspaceSlice, useEquitySlice } from "../../../store"
import type { ExploreShareCapture } from "../../../useExploreShareCapture"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_NAMES,
} from "../../../../../../content/outcomes"

type EquityChartControlsProps = {
  share: ExploreShareCapture["equity"]
}

export default function EquityChartControls({
  share,
}: EquityChartControlsProps) {
  const {
    showEquityComparison,
    setShowEquityComparison,
    yAxisMode,
    setYAxisMode,
    equityHiddenCategories,
    toggleEquityCategory,
  } = useEquitySlice()
  const { equityFocusScenario } = useWorkspaceSlice()
  const { setMotionChildren } = useMap()
  const theme = useTheme()

  const [categoriesAnchor, setCategoriesAnchor] = useState<HTMLElement | null>(
    null,
  )

  const canSnapshot = equityFocusScenario !== null
  const { onSaveSnapshot } = share.chartControlsProps

  const handleClearSelection = () => {
    mapActions.clearLocationHighlights()
    setMotionChildren?.(null)
  }

  const visibleCount = OUTCOME_CODE_ORDER.length - equityHiddenCategories.length
  const categoriesFiltered = equityHiddenCategories.length > 0
  const categoriesOpen = Boolean(categoriesAnchor)
  const categoriesChipActive = categoriesFiltered || categoriesOpen
  const defaultInactiveBg = theme.palette.grey[100]
  const defaultActiveBg = theme.palette.interaction.selectedBackground

  return (
    <ChartControlsBar>
      <Box
        component="button"
        type="button"
        onClick={(e) => setCategoriesAnchor(e.currentTarget)}
        aria-pressed={categoriesChipActive}
        aria-label={`Toggle Outcomes (${visibleCount}/${OUTCOME_CODE_ORDER.length} shown)`}
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
          fontFamily: "inherit",
          color: categoriesChipActive
            ? theme.palette.blue.bright
            : theme.palette.grey[800],
          background: categoriesChipActive
            ? defaultActiveBg
            : defaultInactiveBg,
          transition: "all 150ms ease",
          "&:hover": {
            background: defaultActiveBg,
            color: theme.palette.blue.bright,
          },
        }}
      >
        Toggle Outcomes ({visibleCount}/{OUTCOME_CODE_ORDER.length})
        <KeyboardArrowDownIcon sx={{ fontSize: "0.875rem", flexShrink: 0 }} />
      </Box>
      <Menu
        anchorEl={categoriesAnchor}
        open={categoriesOpen}
        onClose={() => setCategoriesAnchor(null)}
      >
        {OUTCOME_CODE_ORDER.map((code) => {
          const category = OUTCOME_NAMES[code]
          const active = !equityHiddenCategories.includes(category)
          return (
            <MenuItem
              key={code}
              onClick={() => toggleEquityCategory(category)}
              dense
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: active
                  ? theme.palette.blue.bright
                  : theme.palette.grey[800],
              }}
            >
              <Checkbox
                checked={active}
                size="small"
                sx={{
                  p: 0.5,
                  color: theme.palette.grey[400],
                  "&.Mui-checked": { color: theme.palette.blue.bright },
                }}
              />
              <ListItemText
                primary={category}
                slotProps={{
                  primary: { sx: { fontSize: "0.8125rem", fontWeight: 500 } },
                }}
              />
            </MenuItem>
          )
        })}
      </Menu>
      <InlineToggleChip
        label="Compare to Baseline"
        active={showEquityComparison}
        onClick={() => setShowEquityComparison(!showEquityComparison)}
      />
      <InlineToggleChip
        label="Continuous Levels"
        active={yAxisMode === "continuous"}
        onClick={() =>
          setYAxisMode(yAxisMode === "continuous" ? "discrete" : "continuous")
        }
      />
      <SimpleButton
        label="Clear Map Selection"
        onClick={handleClearSelection}
      />
      <SaveSnapshotButton disabled={!canSnapshot} onClick={onSaveSnapshot} />
    </ChartControlsBar>
  )
}
