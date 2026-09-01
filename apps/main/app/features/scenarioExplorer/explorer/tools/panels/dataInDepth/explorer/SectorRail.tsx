"use client"

/**
 * SectorRail - the left rail of the Data-in-Depth explorer.
 *
 * Lists every sector and its variables in registry order. Selecting a variable
 * updates the store and repairs the dependent selection: if the current view
 * is not offered by the new variable it falls back to that variable's first
 * available view, and if "compare by locations" is active but the new variable
 * has a single location it falls back to comparing scenarios. Locked sectors
 * (no variables yet) render greyed with their note.
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  ChevronLeftIcon,
} from "@repo/ui/mui"
import { useDataSlice } from "../../../../store"
import { useTourAnchor } from "../../../tour"
import CollapsedRailStrip from "../../../chrome/layout/CollapsedRailStrip"
import {
  getVariable,
  LOCATION_GROUPS,
  SECTORS,
  VARIABLES,
  type VariableView,
} from "../config/variableRegistry"

/** Views not shipped in the explorer's first version. */
function availableViews(views: VariableView[]): VariableView[] {
  return views.filter((v) => v !== "monthly")
}

export default function SectorRail() {
  const theme = useTheme()
  const railAnchorRef = useTourAnchor("data.rail")
  const {
    selectedVariableId,
    view,
    compareBy,
    variableRailCollapsed,
    setSelectedVariableId,
    setView,
    setCompareBy,
    setVariableRailCollapsed,
  } = useDataSlice()

  const handlePick = (variableId: string) => {
    const next = getVariable(variableId)
    if (!next) return
    setSelectedVariableId(variableId)
    const nextViews = availableViews(next.views)
    if (!nextViews.includes(view)) setView(nextViews[0] ?? "dist")
    if (
      compareBy === "locations" &&
      LOCATION_GROUPS[next.locationGroup].items.length < 2
    ) {
      setCompareBy("scenarios")
    }
  }

  if (variableRailCollapsed) {
    return (
      <CollapsedRailStrip
        label="Variables"
        ariaLabel="Expand variables"
        onExpand={() => setVariableRailCollapsed(false)}
        horizontalOnXs
      />
    )
  }

  return (
    <Box
      ref={railAnchorRef}
      component="nav"
      aria-label="Variables by sector"
      sx={{
        width: { xs: "100%", md: 236 },
        flexShrink: 0,
        overflowY: "auto",
        borderRight: { md: `1px solid ${theme.palette.divider}` },
        pr: { md: 1 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 1.5,
          pr: 0.5,
          mb: 0.5,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.grey[600],
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          Variables
        </Typography>
        <IconButton
          size="small"
          onClick={() => setVariableRailCollapsed(true)}
          aria-label="Collapse variables"
          sx={{ color: theme.palette.grey[600] }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      </Box>

      {SECTORS.map((sector) => (
        <Box key={sector.id} sx={{ mb: 2 }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              px: 1.5,
              color: theme.palette.grey[600],
              fontWeight: 700,
              letterSpacing: "0.06em",
              opacity: sector.locked ? 0.5 : 1,
            }}
          >
            {sector.name}
          </Typography>

          {sector.locked ? (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                px: 1.5,
                color: theme.palette.grey[500],
                fontStyle: "italic",
              }}
            >
              {sector.note ?? "In development"}
            </Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {sector.variables.map((variableId) => {
                const variable = VARIABLES[variableId]
                if (!variable) return null
                const active = variableId === selectedVariableId
                return (
                  <Box component="li" key={variableId}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handlePick(variableId)}
                      aria-current={active ? "true" : undefined}
                      sx={{
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        border: "none",
                        borderLeft: "3px solid",
                        borderLeftColor: active
                          ? theme.palette.primary.main
                          : "transparent",
                        backgroundColor: active
                          ? theme.palette.action.selected
                          : "transparent",
                        color: active
                          ? theme.palette.text.primary
                          : theme.palette.grey[600],
                        fontWeight: active ? 600 : 400,
                        fontSize: "0.86rem",
                        px: 1.5,
                        py: 0.75,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.primary,
                        },
                      }}
                    >
                      <span>{variable.name}</span>
                      {variable.provisional && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            color: theme.palette.warning.main,
                            border: `1px solid ${theme.palette.warning.main}`,
                            borderRadius: "4px",
                            px: 0.5,
                            lineHeight: 1.4,
                          }}
                        >
                          provisional
                        </Box>
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}
