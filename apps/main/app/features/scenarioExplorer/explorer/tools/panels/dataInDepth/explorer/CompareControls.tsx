"use client"

/**
 * CompareControls - the explorer's single-axis comparison controls.
 *
 * "Compare by" picks the one axis that holds multiple members; the other two
 * are held constant by the pinned selectors:
 *  - scenarios: the workspace scenario selection (Current Operations locked
 *    first as the reference), at a pinned hydroclimate and location.
 *  - climates: a multi-select of climate futures, for one pinned scenario and
 *    location.
 *  - locations: a multi-select of locations, for one pinned scenario and
 *    hydroclimate.
 * Scenario membership is owned by the workspace (the selection sidebar); this
 * control only reflects it and marks the locked reference.
 *
 * Layout rule: the compared members' chips come first, then the two pinned
 * (held-constant) selectors as one non-wrapping cluster, so e.g. the
 * reservoir dropdown always sits next to the hydroclimate dropdown instead
 * of wrapping apart at narrow widths.
 *
 * Chip swatches use the same sticky per-member colors as the chart and its
 * legend (seriesColorAssignment, shared scope keys with ChartCard).
 */

import React from "react"
import {
  Box,
  Chip,
  FormControl,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { useDataSlice, useWorkspaceSlice } from "../../../../store"
import type { DataCompareBy } from "../../../../store"
import { BASELINE_SCENARIO_ID } from "../../../../../constants"
import {
  getScenarioShortLabel,
  HYDROCLIMATES,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../../../../../content/scenarios"
import { getVariable, LOCATION_GROUPS } from "../config/variableRegistry"
import { MAX_DATA_IN_DEPTH_SCENARIOS } from "../config/scenarioLimit"
import { getStableSeriesColors } from "../config/seriesColorAssignment"

const MAX_COMPARE_LOCATIONS = 6
const DEFAULT_LOCATION_COUNT = 3

const scenarioLabel = (id: string) => getScenarioShortLabel(id) ?? id
const climateLabel = (id: string) => HYDROCLIMATE_SHORT_LABELS[id] ?? id

const COMPARE_OPTIONS: { value: DataCompareBy; label: string }[] = [
  { value: "scenarios", label: "Scenarios" },
  { value: "climates", label: "Climate futures" },
  { value: "locations", label: "Locations" },
]

export default function CompareControls() {
  const theme = useTheme()
  const {
    selectedVariableId,
    compareBy,
    pinnedScenario,
    pinnedClimate,
    pinnedLocationByGroup,
    selectedClimates,
    selectedLocationsByGroup,
    setCompareBy,
    setPinnedScenario,
    setPinnedClimate,
    setPinnedLocation,
    setSelectedClimates,
    setSelectedLocations,
  } = useDataSlice()
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)
  const workspaceHydroclimate = useWorkspaceSlice((s) => s.hydroclimate)

  const variable = getVariable(selectedVariableId)
  if (!variable) return null
  const groupId = variable.locationGroup
  const group = LOCATION_GROUPS[groupId]
  const multiLoc = group.items.length > 1

  // Comparison scenario set: reference first, then the workspace selection.
  const compareScenarios = [
    BASELINE_SCENARIO_ID,
    ...selectedScenarios.filter((id) => id !== BASELINE_SCENARIO_ID),
  ].slice(0, MAX_DATA_IN_DEPTH_SCENARIOS)

  // Clamp to a scenario still in the comparison set so the Select never holds
  // an out-of-range value after the workspace selection shrinks.
  const heldScenario =
    pinnedScenario && compareScenarios.includes(pinnedScenario)
      ? pinnedScenario
      : BASELINE_SCENARIO_ID
  const heldClimate = pinnedClimate ?? workspaceHydroclimate
  const heldLocation =
    pinnedLocationByGroup[groupId] ?? group.items[0]?.id ?? ""

  const effectiveClimates =
    selectedClimates.length > 0 ? selectedClimates : [...HYDROCLIMATES]
  const chosenLocations = selectedLocationsByGroup[groupId] ?? []
  const effectiveLocations =
    chosenLocations.length > 0
      ? chosenLocations
      : group.items.slice(0, DEFAULT_LOCATION_COUNT).map((l) => l.id)

  const orderClimates = (ids: string[]) =>
    [...HYDROCLIMATES].filter((c) => ids.includes(c))
  const orderLocations = (ids: string[]) =>
    group.items.map((l) => l.id).filter((id) => ids.includes(id))

  // Sticky per-member colors, shared with ChartCard (same scopes + id order).
  const scenarioColors = getStableSeriesColors("scenarios", compareScenarios)
  const climateColors = getStableSeriesColors("climates", effectiveClimates)
  const locationColors = getStableSeriesColors(
    `locations:${groupId}`,
    effectiveLocations,
  )

  const toggleClimate = (id: string) => {
    const next = effectiveClimates.includes(id)
      ? effectiveClimates.filter((c) => c !== id)
      : [...effectiveClimates, id]
    if (next.length >= 1) setSelectedClimates(orderClimates(next))
  }

  const toggleLocation = (id: string) => {
    const isOn = effectiveLocations.includes(id)
    if (isOn && effectiveLocations.length <= 1) return
    if (!isOn && effectiveLocations.length >= MAX_COMPARE_LOCATIONS) return
    const next = isOn
      ? effectiveLocations.filter((l) => l !== id)
      : [...effectiveLocations, id]
    setSelectedLocations(groupId, orderLocations(next))
  }

  const controlSx = { minWidth: 190 } as const

  // Pinned selectors label with the same small caption used across this
  // control row instead of a floating MUI InputLabel: the floating label
  // sat half-behind the white input fill (clipped against the border) and
  // rendered a size too large. The caption id keeps the select's
  // accessible name via labelId.
  const pinCaptionSx = {
    display: "block",
    mb: 0.5,
    color: theme.palette.grey[600],
  } as const
  const pinSelectSx = { typography: "body2" } as const

  const scenarioPin = (
    <Box>
      <Typography id="scenario-pin-label" variant="caption" sx={pinCaptionSx}>
        Scenario
      </Typography>
      <FormControl size="small" sx={controlSx}>
        <Select
          labelId="scenario-pin-label"
          value={heldScenario}
          onChange={(e) => setPinnedScenario(e.target.value)}
          sx={pinSelectSx}
        >
          {compareScenarios.map((id) => (
            <MenuItem key={id} value={id}>
              {scenarioLabel(id)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )

  const climatePin = (
    <Box>
      <Typography id="climate-pin-label" variant="caption" sx={pinCaptionSx}>
        Hydroclimate
      </Typography>
      <FormControl size="small" sx={controlSx}>
        <Select
          labelId="climate-pin-label"
          value={heldClimate}
          onChange={(e) => setPinnedClimate(e.target.value)}
          sx={pinSelectSx}
        >
          {HYDROCLIMATES.map((c) => (
            <MenuItem key={c} value={c}>
              {climateLabel(c)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )

  const locationPin = multiLoc ? (
    <Box>
      <Typography id="location-pin-label" variant="caption" sx={pinCaptionSx}>
        {group.label}
      </Typography>
      <FormControl size="small" sx={controlSx}>
        <Select
          labelId="location-pin-label"
          value={heldLocation}
          onChange={(e) => setPinnedLocation(groupId, e.target.value)}
          sx={pinSelectSx}
        >
          {group.items.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  ) : null

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, py: 1.5 }}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 0.5,
            color: theme.palette.grey[600],
          }}
        >
          Compare by
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={compareBy}
          onChange={(_, next: DataCompareBy | null) => {
            if (next) setCompareBy(next)
          }}
          aria-label="Compare by"
        >
          {COMPARE_OPTIONS.map((opt) => (
            <ToggleButton
              key={opt.value}
              value={opt.value}
              disabled={opt.value === "locations" && !multiLoc}
              sx={{ textTransform: "none", px: 1.5 }}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {compareBy === "scenarios" && (
        <>
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                color: theme.palette.grey[600],
              }}
            >
              Scenarios (from your selection)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {compareScenarios.map((id, i) => {
                const isRef = id === BASELINE_SCENARIO_ID
                return (
                  <Chip
                    key={id}
                    size="small"
                    icon={
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "3px",
                          ml: 1,
                          backgroundColor: scenarioColors[i],
                        }}
                      />
                    }
                    label={
                      isRef
                        ? `${scenarioLabel(id)} · reference`
                        : scenarioLabel(id)
                    }
                    variant={isRef ? "filled" : "outlined"}
                  />
                )
              })}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: { xs: "wrap", sm: "nowrap" },
              gap: 2.5,
            }}
          >
            {climatePin}
            {locationPin}
          </Box>
        </>
      )}

      {compareBy === "climates" && (
        <>
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                color: theme.palette.grey[600],
              }}
            >
              Climate futures
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {HYDROCLIMATES.map((c) => {
                const on = effectiveClimates.includes(c)
                return (
                  <Chip
                    key={c}
                    size="small"
                    clickable
                    onClick={() => toggleClimate(c)}
                    label={climateLabel(c)}
                    variant={on ? "filled" : "outlined"}
                    icon={
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          ml: 1,
                          backgroundColor: on
                            ? climateColors[effectiveClimates.indexOf(c)]
                            : "transparent",
                          border: on
                            ? "none"
                            : `1px solid ${theme.palette.grey[500]}`,
                        }}
                      />
                    }
                  />
                )
              })}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: { xs: "wrap", sm: "nowrap" },
              gap: 2.5,
            }}
          >
            {scenarioPin}
            {locationPin}
          </Box>
        </>
      )}

      {compareBy === "locations" && (
        <>
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                color: theme.palette.grey[600],
              }}
            >
              {group.label}s (up to {MAX_COMPARE_LOCATIONS})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {group.items.map((l) => {
                const on = effectiveLocations.includes(l.id)
                return (
                  <Tooltip
                    key={l.id}
                    title={l.aggregate ? "Aggregate rollup" : ""}
                  >
                    <Chip
                      size="small"
                      clickable
                      onClick={() => toggleLocation(l.id)}
                      label={l.name}
                      variant={on ? "filled" : "outlined"}
                      icon={
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            ml: 1,
                            backgroundColor: on
                              ? locationColors[effectiveLocations.indexOf(l.id)]
                              : "transparent",
                            border: on
                              ? "none"
                              : `1px solid ${theme.palette.grey[500]}`,
                          }}
                        />
                      }
                    />
                  </Tooltip>
                )
              })}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: { xs: "wrap", sm: "nowrap" },
              gap: 2.5,
            }}
          >
            {scenarioPin}
            {climatePin}
          </Box>
        </>
      )}
    </Box>
  )
}
