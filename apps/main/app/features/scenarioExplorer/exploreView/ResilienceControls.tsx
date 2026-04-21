"use client"

/**
 * ResilienceControls - chart-controls bar for the resilience heatmap.
 *
 * Layout follows the "mode-by-mode first paint" pattern from the
 * Resilience Heatmap Reset plan: a single compact header with the
 * primary mode rail, a one-line helper sentence, a mode-specific
 * action row, and hydroclimate chips docked above the matrix.
 *
 * Primary modes in the rail: View by scenarios | View by outcomes |
 * View aggregate. Leverage (the scatter quadrant view) is hidden for
 * now; the enum value and branch code stay so we can reintroduce it.
 * View by scenarios is sidebar-driven: it renders small multiples of
 * the sidebar selection when non-empty and falls through to the
 * Overview aggregate when empty.
 *
 * View by scenarios first paint: choose outcomes + Regional detail.
 * View by outcomes first paint: primary outcome picker + Compare.
 * View aggregate first paint: choose outcomes (+ advanced Read as /
 * Reference / Display when surfaced).
 *
 * Advanced controls (Read as, Reference, Display) surface only when
 * the active view is showing the Overview aggregate so the other
 * modes stay focused on the dominant decision.
 */

import React, { useCallback, useMemo, useState } from "react"
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { InlineToggleChip } from "../components/InlineToggleChip"
import { useScenarioExplorerStore } from "../store"
import type {
  CellEncoding,
  DeltaMode,
  QuadrantUnit,
  ResilienceControlsState,
  ResilienceView,
} from "./ResiliencePanel"
import {
  type ResilienceHydroclimate,
  RESILIENCE_HYDROCLIMATES,
} from "../hooks/useResilienceMatrix"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  getOutcomeName,
  type OutcomeCode,
} from "../../../content/outcomes"
import {
  hydroclimateOptions,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../content/scenarios"
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"

interface ResilienceControlsProps {
  controls: ResilienceControlsState
  onChange: (next: Partial<ResilienceControlsState>) => void
}

// User-facing mode labels for the primary rail. Internal enum values
// remain unchanged (`scenario` / `outcome` / `aggregate` / `quadrant`).
// All three non-leverage modes are peers in the rail. "View by
// scenarios" is also sidebar-driven; when the sidebar is empty the
// panel falls through to the Overview aggregate for continuity.
const MODE_LABEL: Record<ResilienceView, string> = {
  scenario: "View by scenarios",
  outcome: "View by outcomes",
  aggregate: "View aggregate",
  quadrant: "Leverage",
}

// Primary mode rail order. Three peer entries; Leverage is hidden for
// now (the "More analysis" affordance has been removed) but the enum
// value remains so we can reintroduce it later.
const PRIMARY_MODE_ORDER: readonly ResilienceView[] = [
  "scenario",
  "outcome",
  "aggregate",
]

/**
 * Virtual "Read as" enum. Combines cellEncoding + deltaMode into a
 * single user-facing read mode. Only exposed in Overview mode for now;
 * Scenario and Outcome stay on mean tier to keep the first paint clean.
 */
type ReadAs =
  | "mean_tier"
  | "climate_shift"
  | "risk_density"
  | "opportunity_density"
  | "distribution"
  | "operational_leverage"

const READ_AS_LABEL: Record<ReadAs, string> = {
  mean_tier: "Mean tier",
  climate_shift: "Climate shift",
  risk_density: "Risk density",
  opportunity_density: "Opportunity density",
  distribution: "Distribution",
  operational_leverage: "Operational leverage",
}

function deriveReadAs(
  view: ResilienceView,
  enc: CellEncoding,
  delta: DeltaMode,
): ReadAs {
  if (view === "quadrant") return "mean_tier"
  if (delta !== "none") return "climate_shift"
  if (enc === "density_risk") return "risk_density"
  if (enc === "density_opp") return "opportunity_density"
  if (enc === "distribution") return "distribution"
  if (enc === "leverage") return "operational_leverage"
  return "mean_tier"
}

function applyReadAs(
  next: ReadAs,
  prev: ResilienceControlsState,
): Partial<ResilienceControlsState> {
  switch (next) {
    case "mean_tier":
      return { cellEncoding: "tier", deltaMode: "none" }
    case "climate_shift":
      return {
        cellEncoding: "tier",
        deltaMode:
          prev.deltaMode !== "none" ? prev.deltaMode : "vs_historical",
      }
    case "risk_density":
      return { cellEncoding: "density_risk", deltaMode: "none" }
    case "opportunity_density":
      return { cellEncoding: "density_opp", deltaMode: "none" }
    case "distribution":
      return { cellEncoding: "distribution", deltaMode: "none" }
    case "operational_leverage":
      return { cellEncoding: "leverage", deltaMode: "none" }
  }
}

const READ_AS_OPTIONS_OVERVIEW: readonly ReadAs[] = [
  "mean_tier",
  "climate_shift",
  "distribution",
  "risk_density",
  "opportunity_density",
  "operational_leverage",
]

export default function ResilienceControls({
  controls,
  onChange,
}: ResilienceControlsProps) {
  const theme = useTheme()
  const { siblingGroups } = useScenarioList()

  const {
    view,
    cellEncoding,
    deltaMode,
    deltaBaselineScenarioId,
    reorderBySimilarity,
    selectedHydroclimates,
    showCellNumbers,
    quadrantUnit,
    quadrantOutcome,
    primaryOutcomeCode,
    compareOutcomeCodes,
    scenarioLayout,
  } = controls

  const selectedScenarios = useScenarioExplorerStore(
    (s) => s.selectedScenarios,
  )
  const showResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.showResilienceOutcomeSelector,
  )
  const setShowResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.setShowResilienceOutcomeSelector,
  )
  const resilienceVisibleOutcomes = useScenarioExplorerStore(
    (s) => s.resilienceVisibleOutcomes,
  )
  const distributionMode = useScenarioExplorerStore(
    (s) => s.resilienceDistributionMode,
  )
  const setDistributionMode = useScenarioExplorerStore(
    (s) => s.setResilienceDistributionMode,
  )

  const outcomeItems = useMemo(() => {
    const items: { code: string; label: string; indent?: boolean }[] = []
    for (const code of OUTCOME_CODE_ORDER) {
      items.push({ code, label: getOutcomeName(code) })
      const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
      if (variants) {
        items.push({
          code: variants[0],
          label: getOutcomeName(variants[0]),
          indent: true,
        })
        items.push({
          code: variants[1],
          label: getOutcomeName(variants[1]),
          indent: true,
        })
      }
    }
    return items
  }, [])

  const scenarioItems = useMemo(() => {
    return siblingGroups.map((s) => ({
      id: s.scenarioId,
      label: s.shortLabel || s.label,
    }))
  }, [siblingGroups])

  // Aggregate-only outcomes (no regional variants) for the Outcome-mode
  // primary picker and the Compare sheet.
  const aggregateOutcomeItems = useMemo(
    () =>
      OUTCOME_CODE_ORDER.map((code) => ({
        code,
        label: getOutcomeName(code),
      })),
    [],
  )

  const handleViewChange = useCallback(
    (next: ResilienceView) => {
      if (view === next) return
      const patch: Partial<ResilienceControlsState> = { view: next }
      // Density / glyph / leverage encodings only compose cleanly in
      // Overview; reset them when leaving.
      if (
        next !== "aggregate" &&
        (cellEncoding === "density_risk" ||
          cellEncoding === "density_opp" ||
          cellEncoding === "glyph" ||
          cellEncoding === "leverage")
      ) {
        patch.cellEncoding = "tier"
      }
      onChange(patch)
    },
    [view, cellEncoding, onChange],
  )

  const toggleHydroclimate = useCallback(
    (hc: ResilienceHydroclimate) => {
      const next = new Set(selectedHydroclimates)
      if (next.has(hc)) {
        if (next.size === 1) return
        next.delete(hc)
      } else {
        next.add(hc)
      }
      onChange({ selectedHydroclimates: next })
    },
    [selectedHydroclimates, onChange],
  )

  const toggleShowAllHcs = useCallback(() => {
    const allSelected =
      selectedHydroclimates.size === RESILIENCE_HYDROCLIMATES.length
    if (allSelected) {
      onChange({
        selectedHydroclimates: new Set<ResilienceHydroclimate>(["historical"]),
      })
    } else {
      onChange({
        selectedHydroclimates: new Set<ResilienceHydroclimate>(
          RESILIENCE_HYDROCLIMATES,
        ),
      })
    }
  }, [selectedHydroclimates, onChange])

  const allHcsSelected =
    selectedHydroclimates.size === RESILIENCE_HYDROCLIMATES.length

  const handleReadAsChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange(applyReadAs(e.target.value as ReadAs, controls))
    },
    [controls, onChange],
  )

  const handleDeltaModeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ deltaMode: e.target.value as DeltaMode })
    },
    [onChange],
  )

  const handleDeltaBaselineChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ deltaBaselineScenarioId: e.target.value })
    },
    [onChange],
  )

  const handlePrimaryOutcomeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const next = e.target.value || null
      onChange({ primaryOutcomeCode: next })
    },
    [onChange],
  )

  const handleQuadrantUnitChange = useCallback(
    (next: QuadrantUnit) => {
      if (quadrantUnit === next) return
      onChange({ quadrantUnit: next })
    },
    [quadrantUnit, onChange],
  )

  const handleQuadrantOutcomeChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      onChange({ quadrantOutcome: e.target.value })
    },
    [onChange],
  )

  // Display overflow menu (Overview mode only).
  const [displayAnchor, setDisplayAnchor] = useState<HTMLElement | null>(null)
  const openDisplayMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setDisplayAnchor(e.currentTarget)
  }, [])
  const closeDisplayMenu = useCallback(() => {
    setDisplayAnchor(null)
  }, [])

  // Compare chooser menu. Scenario mode no longer has a compare
  // picker (the sidebar is now the source of truth), so only the
  // outcome compare menu remains.
  const [compareOutcomeAnchor, setCompareOutcomeAnchor] =
    useState<HTMLElement | null>(null)

  const toggleCompareOutcome = useCallback(
    (code: string) => {
      const next = [...compareOutcomeCodes]
      const idx = next.indexOf(code)
      if (idx >= 0) next.splice(idx, 1)
      else next.push(code)
      onChange({ compareOutcomeCodes: next })
    },
    [compareOutcomeCodes, onChange],
  )

  const isScenario = view === "scenario"
  const isOutcome = view === "outcome"
  const isQuadrant = view === "quadrant"
  // Overview is now an implicit state: it renders whenever we are in
  // Scenarios mode with an empty sidebar selection, and also when the
  // view is explicitly "aggregate" (legacy/programmatic entry). The
  // rail itself no longer offers Overview as a peer.
  const isOverviewActive =
    view === "aggregate" || (isScenario && selectedScenarios.length === 0)

  const readAs = deriveReadAs(view, cellEncoding, deltaMode)
  const showReadAs = isOverviewActive
  const showReference = isOverviewActive && readAs === "climate_shift"
  const showDistributionSubmode = isOverviewActive && readAs === "distribution"
  const showDisplayMenu = isOverviewActive

  const captionSx = {
    fontWeight: 500,
    color: theme.palette.text.primary,
    mr: 0.5,
  } as const

  // Subheader that prefixes each of the three control rows
  // ("View:", "Mode:", "Hydroclimate:"). Uses the same caption weight
  // as the inline group captions so the rail reads as a single,
  // coherent stack of three labelled rows.
  const rowLabelSx = {
    ...captionSx,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontSize: "0.75rem",
    color: theme.palette.grey[700],
    minWidth: 84,
    flexShrink: 0,
  } as const

  const groupSx = {
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    flexWrap: "wrap",
  } as const

  const rowSx = {
    display: "flex",
    alignItems: "center",
    gap: 1.25,
    flexWrap: "wrap",
    rowGap: 0.5,
  } as const

  const verticalDivider = (
    <Divider
      orientation="vertical"
      flexItem
      sx={{ mx: 0.25, borderColor: theme.palette.divider, my: 0.25 }}
    />
  )

  const selectSx = {
    minWidth: 200,
    maxWidth: 320,
    fontSize: "0.8125rem",
    ".MuiSelect-select": { py: 0.5 },
  } as const

  const compareButtonSx = (active: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    px: 1.25,
    py: 0.5,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    color: active ? theme.palette.blue.bright : theme.palette.grey[800],
    background: active
      ? theme.palette.interaction.selectedBackground
      : theme.palette.grey[100],
    transition: "all 150ms ease",
    "&:hover": {
      background: theme.palette.interaction.selectedBackground,
      color: theme.palette.blue.bright,
    },
  })

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        py: 0.25,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Row 1 - "View:" subheader + primary mode rail + (Overview only) Display overflow */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ ...rowSx, minWidth: 0 }}>
          <Typography variant="compactCaption" sx={rowLabelSx}>
            View:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {PRIMARY_MODE_ORDER.map((mode) => (
              <InlineToggleChip
                key={mode}
                label={MODE_LABEL[mode]}
                active={view === mode}
                onClick={() => handleViewChange(mode)}
              />
            ))}
          </Box>
        </Box>

        {showDisplayMenu && (
          <Box sx={{ flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={openDisplayMenu}
              aria-label="Display options"
              aria-haspopup="menu"
              aria-expanded={Boolean(displayAnchor)}
              sx={{
                color: theme.palette.grey[800],
                px: 0.75,
                py: 0.25,
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.blue.bright,
                },
              }}
            >
              <icons.Tune sx={{ fontSize: "1rem", mr: 0.5 }} />
              <Typography
                variant="compactCaption"
                sx={{ fontWeight: 500, fontSize: "0.8125rem" }}
              >
                Display
              </Typography>
            </IconButton>
            <Menu
              anchorEl={displayAnchor}
              open={Boolean(displayAnchor)}
              onClose={closeDisplayMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { minWidth: 220 } } }}
            >
              <MenuItem
                onClick={() =>
                  onChange({ reorderBySimilarity: !reorderBySimilarity })
                }
                sx={{ fontSize: "0.8125rem", gap: 1 }}
              >
                {reorderBySimilarity ? (
                  <icons.CheckCircle
                    sx={{
                      fontSize: "1rem",
                      color: theme.palette.blue.bright,
                    }}
                  />
                ) : (
                  <icons.RadioButtonUnchecked
                    sx={{ fontSize: "1rem", color: theme.palette.grey[500] }}
                  />
                )}
                Reorder rows by similarity
              </MenuItem>
              <MenuItem
                onClick={() =>
                  onChange({ showCellNumbers: !showCellNumbers })
                }
                sx={{ fontSize: "0.8125rem", gap: 1 }}
              >
                {showCellNumbers ? (
                  <icons.CheckCircle
                    sx={{
                      fontSize: "1rem",
                      color: theme.palette.blue.bright,
                    }}
                  />
                ) : (
                  <icons.RadioButtonUnchecked
                    sx={{ fontSize: "1rem", color: theme.palette.grey[500] }}
                  />
                )}
                Show cell values
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      {/* Row 2 - mode-specific action row */}
      <Box sx={rowSx}>
        <Typography variant="compactCaption" sx={rowLabelSx}>
          Mode:
        </Typography>

        {/* Row-filter chip. Visible in View by scenarios (small
            multiples) and View aggregate (Overview). Outcome mode
            drives rows from its own primary picker instead. */}
        {(isScenario || isOverviewActive) && (
          <InlineToggleChip
            label={
              resilienceVisibleOutcomes.length === OUTCOME_CODE_ORDER.length
                ? "choose outcomes"
                : `choose outcomes (${resilienceVisibleOutcomes.length})`
            }
            active={showResilienceOutcomeSelector}
            onClick={() =>
              setShowResilienceOutcomeSelector(!showResilienceOutcomeSelector)
            }
          />
        )}

        {/* Scenarios mode: sidebar is the source of truth for which
            scenarios appear, so the action row only exposes a layout
            toggle (small multiples vs one combined chart). */}
        {isScenario && selectedScenarios.length > 0 && (
          <Box sx={{ ...groupSx, gap: 0.5 }}>
            <Typography variant="compactCaption" sx={captionSx}>
              Layout:
            </Typography>
            <InlineToggleChip
              label="small multiples"
              active={scenarioLayout === "small_multiples"}
              onClick={() =>
                onChange({ scenarioLayout: "small_multiples" })
              }
            />
            <InlineToggleChip
              label="one chart"
              active={scenarioLayout === "combined"}
              onClick={() => onChange({ scenarioLayout: "combined" })}
            />
          </Box>
        )}

        {/* Outcome mode: primary outcome picker + Compare */}
        {isOutcome && (
          <>
            <Box sx={{ ...groupSx, gap: 0.75 }}>
              <Typography variant="compactCaption" sx={captionSx}>
                Outcome:
              </Typography>
              <Select
                size="small"
                value={primaryOutcomeCode ?? ""}
                onChange={handlePrimaryOutcomeChange}
                displayEmpty
                sx={selectSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem" }}>
                  Pick an outcome
                </MenuItem>
                {aggregateOutcomeItems.map((o) => (
                  <MenuItem
                    key={o.code}
                    value={o.code}
                    sx={{ fontSize: "0.8125rem" }}
                  >
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            {verticalDivider}
            <Box
              component="button"
              type="button"
              onClick={(e) =>
                setCompareOutcomeAnchor(
                  compareOutcomeAnchor ? null : e.currentTarget,
                )
              }
              aria-haspopup="dialog"
              aria-expanded={Boolean(compareOutcomeAnchor)}
              disabled={!primaryOutcomeCode}
              sx={{
                ...compareButtonSx(compareOutcomeCodes.length > 0),
                opacity: primaryOutcomeCode ? 1 : 0.5,
                cursor: primaryOutcomeCode ? "pointer" : "default",
              }}
            >
              <icons.Compare sx={{ fontSize: "0.875rem" }} />
              Compare
              {compareOutcomeCodes.length > 0 &&
                ` (${compareOutcomeCodes.length})`}
              <icons.KeyboardArrowDown sx={{ fontSize: "0.875rem" }} />
            </Box>
            <Menu
              anchorEl={compareOutcomeAnchor}
              open={Boolean(compareOutcomeAnchor)}
              onClose={() => setCompareOutcomeAnchor(null)}
              slotProps={{ paper: { sx: { maxHeight: 380, minWidth: 260 } } }}
            >
              {aggregateOutcomeItems
                .filter((o) => o.code !== primaryOutcomeCode)
                .map((o) => {
                  const active = compareOutcomeCodes.includes(o.code)
                  return (
                    <MenuItem
                      key={o.code}
                      onClick={() => toggleCompareOutcome(o.code)}
                      sx={{ fontSize: "0.8125rem", gap: 1 }}
                    >
                      {active ? (
                        <icons.CheckCircle
                          sx={{
                            fontSize: "1rem",
                            color: theme.palette.blue.bright,
                          }}
                        />
                      ) : (
                        <icons.RadioButtonUnchecked
                          sx={{
                            fontSize: "1rem",
                            color: theme.palette.grey[500],
                          }}
                        />
                      )}
                      {o.label}
                    </MenuItem>
                  )
                })}
            </Menu>
          </>
        )}

        {/* Overview aggregate: active either because the view is
            explicitly "aggregate" or because Scenarios mode has an
            empty sidebar selection and is falling through. The
            control row exposes Rows and (advanced) Read as /
            Reference. Scope is no longer user-facing - sidebar
            selection is the only way to narrow the aggregate. */}
        {isOverviewActive && (
          <>
            {showReadAs && (
              <>
                {verticalDivider}
                <Box sx={{ ...groupSx, gap: 0.75 }}>
                  <Typography variant="compactCaption" sx={captionSx}>
                    Read as:
                  </Typography>
                  <Select
                    size="small"
                    value={readAs}
                    onChange={handleReadAsChange}
                    sx={{
                      minWidth: 180,
                      fontSize: "0.8125rem",
                      ".MuiSelect-select": { py: 0.5 },
                    }}
                  >
                    {READ_AS_OPTIONS_OVERVIEW.map((opt) => (
                      <MenuItem
                        key={opt}
                        value={opt}
                        sx={{ fontSize: "0.8125rem" }}
                      >
                        {READ_AS_LABEL[opt]}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </>
            )}
            {showDistributionSubmode && (
              <Box sx={groupSx}>
                <Typography variant="compactCaption" sx={captionSx}>
                  Distribution:
                </Typography>
                <InlineToggleChip
                  label="by scenario"
                  active={distributionMode === "scenario"}
                  onClick={() => setDistributionMode("scenario")}
                />
                <InlineToggleChip
                  label="by location"
                  active={distributionMode === "location"}
                  onClick={() => setDistributionMode("location")}
                />
              </Box>
            )}
            {showReference && (
              <>
                {verticalDivider}
                <Box sx={{ ...groupSx, gap: 0.75 }}>
                  <Typography variant="compactCaption" sx={captionSx}>
                    Reference:
                  </Typography>
                  <Select
                    size="small"
                    value={deltaMode}
                    onChange={handleDeltaModeChange}
                    sx={{
                      minWidth: 170,
                      fontSize: "0.8125rem",
                      ".MuiSelect-select": { py: 0.5 },
                    }}
                  >
                    <MenuItem
                      value="vs_historical"
                      sx={{ fontSize: "0.8125rem" }}
                    >
                      vs historical HC
                    </MenuItem>
                    <MenuItem
                      value="vs_baseline"
                      sx={{ fontSize: "0.8125rem" }}
                    >
                      vs baseline scenario
                    </MenuItem>
                  </Select>
                  {deltaMode === "vs_baseline" && (
                    <Select
                      size="small"
                      value={deltaBaselineScenarioId}
                      onChange={handleDeltaBaselineChange}
                      sx={{
                        minWidth: 180,
                        maxWidth: 260,
                        fontSize: "0.8125rem",
                        ".MuiSelect-select": { py: 0.5 },
                      }}
                    >
                      {scenarioItems.map((s) => (
                        <MenuItem
                          key={s.id}
                          value={s.id}
                          sx={{ fontSize: "0.8125rem" }}
                        >
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </Box>
              </>
            )}
          </>
        )}

        {/* Leverage: Unit + (optional) LOI Outcome. Scope is no
            longer user-facing; sidebar selection is the single way to
            narrow the scenario set. */}
        {isQuadrant && (
          <>
            <Box sx={groupSx}>
              <Typography variant="compactCaption" sx={captionSx}>
                Unit:
              </Typography>
              <InlineToggleChip
                label="by outcome"
                active={quadrantUnit === "outcome"}
                onClick={() => handleQuadrantUnitChange("outcome")}
              />
              <InlineToggleChip
                label="by LOI"
                active={quadrantUnit === "loi"}
                onClick={() => handleQuadrantUnitChange("loi")}
              />
            </Box>
            {quadrantUnit === "loi" && (
              <Box sx={{ ...groupSx, gap: 0.75 }}>
                <Typography variant="compactCaption" sx={captionSx}>
                  Outcome:
                </Typography>
                <Select
                  size="small"
                  value={quadrantOutcome ?? ""}
                  onChange={handleQuadrantOutcomeChange}
                  displayEmpty
                  sx={selectSx}
                >
                  <MenuItem value="" disabled sx={{ fontSize: "0.8125rem" }}>
                    Pick an outcome
                  </MenuItem>
                  {outcomeItems.map((o) => (
                    <MenuItem
                      key={o.code}
                      value={o.code}
                      sx={{
                        fontSize: "0.8125rem",
                        pl: o.indent ? 4 : 2,
                      }}
                    >
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Row 3 - "Hydroclimate:" subheader + chips. Docked above the
          matrix so they read as a property of the chart, not the global
          controls. */}
      {!isQuadrant && (
        <Box sx={rowSx}>
          <Typography variant="compactCaption" sx={rowLabelSx}>
            Hydroclimate:
          </Typography>
          <Box sx={groupSx}>
            <InlineToggleChip
              label="all"
              active={allHcsSelected}
              onClick={toggleShowAllHcs}
            />
            {hydroclimateOptions.map((opt) => {
              const hc = opt.value as ResilienceHydroclimate
              return (
                <InlineToggleChip
                  key={opt.value}
                  label={HYDROCLIMATE_SHORT_LABELS[hc] ?? opt.label}
                  active={selectedHydroclimates.has(hc)}
                  onClick={() => toggleHydroclimate(hc)}
                />
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}
