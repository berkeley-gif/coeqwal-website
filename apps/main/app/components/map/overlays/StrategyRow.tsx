"use client"

/**
 * StrategyRow and related components
 *
 * Components for displaying strategy information in the Learn section.
 * Data is pulled from the same sources as StrategyGrid.
 */

import { useState, useCallback } from "react"
import { Box, Typography, useTheme, InfoIcon, ClickAwayListener } from "@repo/ui/mui"
import { learnMapActions } from "../store"
import { InfoTooltip } from "@repo/ui"
import { ScenarioGlyph } from "@repo/viz"
import { strategies } from "../../../lib/scenarios"
import { CURRENT_OPERATIONS_ICONS } from "../../ScenarioCard"
import { OUTCOMES, OUTCOME_DEFINITIONS, outcomeTierValues } from "../../../lib/outcomes"
import { useDrawerStore } from "@repo/state"
import { useScenarioTiers } from "../../../hooks/useTierData"

interface StrategyRowProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
  /** Whether to show the description */
  showDescription?: boolean
}

interface StrategyInfoPanelProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
  /** Callback when the title is clicked (to reopen tooltip) */
  onTitleClick?: () => void
}

interface KeyOperationsPanelProps {
  /** Strategy value to display (defaults to "current-ops") */
  strategyValue?: string
  /** Callback when the title is clicked (to reopen tooltip) */
  onTitleClick?: () => void
}

interface KeyOutcomesPanelProps {
  /** Scenario ID to display (defaults to "s0020" for current operations) */
  scenarioId?: string
  /** Callback when the title is clicked (to reopen tooltip) */
  onTitleClick?: () => void
}

/**
 * Get the operation icons for a given strategy
 * Uses the same logic as StrategyGrid for consistency
 */
function getStrategyIcons(strategyValue: string) {
  const icons = []

  // Icon 1: Current operations (always shown)
  icons.push({
    path: CURRENT_OPERATIONS_ICONS[0]?.path || "/images/icons/current_ops.svg",
    alt: CURRENT_OPERATIONS_ICONS[0]?.alt || "Current operations",
    description: CURRENT_OPERATIONS_ICONS[0]?.description || "Current operations",
    label: "Current operations",
  })

  // Icon 2: Land use (different for historical-ag strategy)
  if (strategyValue === "current-ops-historical-ag") {
    icons.push({
      path: "/images/icons/land_use_prev.svg",
      alt: "Historical land use",
      description: "Historical land use (2004-2013)",
      label: "Historical land use\n(2004-2013)",
    })
  } else {
    icons.push({
      path: CURRENT_OPERATIONS_ICONS[1]?.path || "/images/icons/land_use.svg",
      alt: CURRENT_OPERATIONS_ICONS[1]?.alt || "Current land use",
      description: CURRENT_OPERATIONS_ICONS[1]?.description || "Current land use considerations",
      label: "Updated agricultural\nland use (2020)",
    })
  }

  // Icon 3: TUCP status
  if (strategyValue === "current-ops-wo-tucp") {
    icons.push({
      path: "/images/icons/no_tucp.svg",
      alt: "Without TUCPs",
      description: "Operations without Temporary Urgent Change Petitions (TUCPs)",
      label: "TUCPs\nnot allowed",
    })
  } else {
    icons.push({
      path: CURRENT_OPERATIONS_ICONS[2]?.path || "/images/icons/tucp.svg",
      alt: CURRENT_OPERATIONS_ICONS[2]?.alt || "TUCP considerations",
      description: CURRENT_OPERATIONS_ICONS[2]?.description || "Temporary Urgent Change Petitions permitted",
      label: "TUCPs\nallowed",
    })
  }

  return icons
}

export function StrategyRow({
  strategyValue = "current-ops",
  showDescription = true,
}: StrategyRowProps) {
  const theme = useTheme()

  // Look up strategy data from shared source
  const strategy = strategies.find((s) => s.value === strategyValue)
  
  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  // Get icons based on strategy
  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      {/* Strategy label */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          mb: showDescription ? 0.5 : 0,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
        }}
      >
        {strategy.label} strategy
      </Typography>

      {/* Description - matches StrategyGrid layout (before icons) */}
      {showDescription && (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            lineHeight: 1.4,
            fontSize: theme.typography.nav.fontSize,
            color: theme.palette.grey[700],
          }}
        >
          {strategy.description
            .split(/(\bTUCPs?\b)/g)
            .map((part, index) => {
              if (part.match(/\bTUCPs?\b/)) {
                return (
                  <span key={index}>
                    {part}
                    <InfoTooltip
                      description="Temporary Urgent Change Petitions (TUCPs) permit changes during droughts to meet human health and safety needs and protect endangered species."
                      placement="top"
                      tooltipProps={{
                        PopperProps: { disablePortal: true },
                      }}
                    >
                      <InfoIcon
                        sx={{
                          fontSize: "1rem",
                          ml: 0.5,
                          cursor: "pointer",
                          color: theme.palette.blue.bright,
                          verticalAlign: "text-top",
                          "&:hover": {
                            color: theme.palette.blue.darkest,
                          },
                        }}
                      />
                    </InfoTooltip>
                  </span>
                )
              }
              return part
            })}
        </Typography>
      )}

      {/* Divider and Key operations section */}
      <Box
        sx={{
          borderTop: `1px solid ${theme.palette.grey[300]}`,
          pt: 2,
          mt: showDescription ? 0 : 2,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            fontSize: theme.typography.body2.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.grey[900],
          }}
        >
          Key operations
        </Typography>

        {/* Operations icons - matches StrategyGrid spacing */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 0.5, md: 1 },
            alignItems: "flex-start",
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
          {icons.map((icon) => (
            <InfoTooltip
              key={icon.path}
              description={
                <>
                  <Box
                    component="span"
                    sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                  >
                    {icon.label.replace(/\n/g, " ")}
                  </Box>
                  {icon.description}
                </>
              }
              tooltipProps={{
                PopperProps: { disablePortal: true },
              }}
            >
              <Box
                sx={{
                  width: { xs: theme.spacing(4), lg: theme.spacing(5) },
                  height: { xs: theme.spacing(4), lg: theme.spacing(5) },
                  cursor: "pointer",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon.path}
                  alt={icon.alt}
                  style={{ width: "100%", height: "100%" }}
                />
              </Box>
            </InfoTooltip>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * StrategyInfoPanel - Shows just the title and description
 */
export function StrategyInfoPanel({
  strategyValue = "current-ops",
  onTitleClick,
}: StrategyInfoPanelProps) {
  const theme = useTheme()

  const strategy = strategies.find((s) => s.value === strategyValue)
  
  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="subtitle1"
        onClick={onTitleClick}
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          mb: 0.5,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
          cursor: onTitleClick ? "pointer" : "default",
          "&:hover": onTitleClick ? {
            color: theme.palette.blue.bright,
          } : {},
        }}
      >
        {strategy.label} strategy
      </Typography>

      <Typography
        variant="body2"
        sx={{
          lineHeight: 1.4,
          fontSize: theme.typography.nav.fontSize,
          color: theme.palette.grey[700],
        }}
      >
        {strategy.description
          .split(/(\bTUCPs?\b)/g)
          .map((part, index) => {
            if (part.match(/\bTUCPs?\b/)) {
              return (
                <span key={index}>
                  {part}
                  <InfoTooltip
                    description="Temporary Urgent Change Petitions (TUCPs) permit changes during droughts to meet human health and safety needs and protect endangered species."
                    placement="top"
                  >
                    <InfoIcon
                      sx={{
                        fontSize: "1rem",
                        ml: 0.5,
                        cursor: "pointer",
                        color: theme.palette.blue.bright,
                        verticalAlign: "middle",
                        "&:hover": {
                          color: theme.palette.blue.darkest,
                        },
                      }}
                    />
                  </InfoTooltip>
                </span>
              )
            }
            return part
          })}
      </Typography>
    </Box>
  )
}

/**
 * KeyOperationsPanel - Shows just the key operations icons
 */
export function KeyOperationsPanel({
  strategyValue = "current-ops",
  onTitleClick,
}: KeyOperationsPanelProps) {
  const theme = useTheme()

  const strategy = strategies.find((s) => s.value === strategyValue)
  
  if (!strategy) {
    console.warn(`Strategy "${strategyValue}" not found`)
    return null
  }

  const icons = getStrategyIcons(strategyValue)

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="subtitle2"
        onClick={onTitleClick}
        sx={{
          mb: 1,
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[900],
          cursor: onTitleClick ? "pointer" : "default",
          "&:hover": onTitleClick ? {
            color: theme.palette.blue.bright,
          } : {},
        }}
      >
        Key operations
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.5, md: 1 },
          alignItems: "flex-start",
          flexDirection: "row",
          justifyContent: "flex-start",
        }}
      >
        {icons.map((icon) => (
          <InfoTooltip
            key={icon.path}
            description={
              <>
                <Box
                  component="span"
                  sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                >
                  {icon.label.replace(/\n/g, " ")}
                </Box>
                {icon.description}
              </>
            }
            tooltipProps={{
              PopperProps: { 
                style: { zIndex: 10001 },
              },
            }}
          >
            <Box
              sx={{
                width: { xs: theme.spacing(4), lg: theme.spacing(5) },
                height: { xs: theme.spacing(4), lg: theme.spacing(5) },
                cursor: "pointer",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.path}
                alt={icon.alt}
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
          </InfoTooltip>
        ))}
      </Box>
    </Box>
  )
}

/**
 * KeyOutcomesPanel - Shows the key outcomes glyphs
 * Uses the same layout as ScenarioCard
 */
export function KeyOutcomesPanel({
  scenarioId = "s0020",
  onTitleClick,
}: KeyOutcomesPanelProps) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)

  // Fetch tier data for the scenario
  const { chartData, isLoading } = useScenarioTiers(scenarioId)

  // Helper to open glossary to a specific term
  const handleGlossaryOpen = (term: string) => {
    setDrawerContent({ selectedTerm: term })
    openDrawer("glossary")
  }

  // Handler to show outcome data on the map
  const handleShowOnMap = useCallback((outcome: string) => {
    setOpenTooltip(null) // Close tooltip when showing on map
    learnMapActions.setSelectedOutcome(outcome)
  }, [])

  // Helper to render tier text with bold label and quantity (e.g., "Optimal: ... less than 10%")
  const renderTierText = (tierText: string) => {
    const colonIndex = tierText.indexOf(":")
    if (colonIndex === -1) return tierText
    const label = tierText.substring(0, colonIndex)
    const rest = tierText.substring(colonIndex + 1)
    
    // Find and bold quantity patterns like "less than 10%" or "more than 30%"
    const quantityRegex = /(less than \d+%|more than \d+%)/gi
    const parts = rest.split(quantityRegex)
    
    return (
      <>
        <span style={{ fontWeight: 600 }}>{label}</span>:
        {parts.map((part, i) => {
          // Check if this part matches the quantity pattern
          const isQuantity = /^(less than \d+%|more than \d+%)$/i.test(part)
          return isQuantity ? (
            <span key={i} style={{ fontWeight: 500, whiteSpace: "nowrap" }}>{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        })}
      </>
    )
  }

  // Helper to render definition with clickable glossary terms
  const renderDefinitionWithLinks = (definition: string, outcome: string) => {
    // For "Community deliveries", make "demands" clickable
    if (outcome === "Community deliveries" && definition.includes("demands")) {
      const parts = definition.split("demands")
      return (
        <>
          {parts[0]}
          <Box
            component="span"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              handleGlossaryOpen("Demands")
            }}
            sx={{
              color: theme.palette.blue.bright,
              textDecoration: "underline",
              cursor: "pointer",
              "&:hover": {
                color: theme.palette.blue.dark,
              },
            }}
          >
            demands
          </Box>
          {parts[1]}
        </>
      )
    }
    return definition
  }

  // Helper function to get tier values for an outcome
  const getTierValues = (outcome: string): [number, number, number, number] => {
    const tierData = chartData[outcome]
    if (!tierData || tierData.length !== 4) {
      return [0, 0, 0, 0]
    }
    return [
      tierData[0]?.value ?? 0,
      tierData[1]?.value ?? 0,
      tierData[2]?.value ?? 0,
      tierData[3]?.value ?? 0,
    ]
  }

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: "500px",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="subtitle2"
        onClick={onTitleClick}
        sx={{
          mb: 1,
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[900],
          cursor: onTitleClick ? "pointer" : "default",
          "&:hover": onTitleClick ? {
            color: theme.palette.blue.bright,
          } : {},
        }}
      >
        Key outcomes
      </Typography>

      {/* Multiple location outcomes - first 5 */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 1,
          fontSize: "0.7rem",
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[600],
          // textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Multiple location outcomes
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 1,
          alignItems: "start",
          mb: 1.5,
        }}
      >
        {OUTCOMES.slice(0, 5).map((outcome) => {
          const tierData = chartData[outcome]
          const hasData =
            tierData !== undefined &&
            tierData.length > 0 &&
            tierData.some((tier) => tier.value > 0)

          const tierDefs = outcomeTierValues[outcome]
          const definition = OUTCOME_DEFINITIONS[outcome] || "No definition available."
          
          return (
            <ClickAwayListener key={outcome} onClickAway={() => openTooltip === outcome && setOpenTooltip(null)}>
              <Box>
                <InfoTooltip
                  description={
                    <>
                      <Box
                        component="span"
                        sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                      >
                        {outcome}
                      </Box>
                      {renderDefinitionWithLinks(definition, outcome)}
                      {tierDefs && (
                        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1, fontSize: "0.8rem" }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier1, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier1)}</span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier2, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier2)}</span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier3, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier3)}</span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier4, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier4)}</span>
                          </Box>
                        </Box>
                      )}
                      <Box component="span" sx={{ display: "block", mt: 1.5, fontStyle: "italic", fontSize: "0.8rem" }}>
                        Click{" "}
                        <Box
                          component="span"
                          onClick={() => handleShowOnMap(outcome)}
                          sx={{
                            color: theme.palette.blue.bright,
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontStyle: "normal",
                            "&:hover": { color: theme.palette.blue.dark },
                          }}
                        >
                          here
                        </Box>
                        {" "}or on chart to show values on map.
                      </Box>
                    </>
                  }
                  placement="top"
                  tooltipProps={{
                    open: openTooltip === outcome,
                    disableHoverListener: true,
                    disableFocusListener: true,
                    PopperProps: { 
                      disablePortal: true,
                      sx: { zIndex: 10001 },
                    },
                    slotProps: {
                      popper: {
                        modifiers: [
                          {
                            name: "offset",
                            options: {
                              offset: [0, 10],
                            },
                          },
                        ],
                      },
                    },
                  }}
                >
                  <Box
                    onClick={() => handleShowOnMap(outcome)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: "pointer",
                      p: 0.5,
                      borderRadius: theme.borderRadius.rounded,
                      transition: "all 0.2s ease",
                      opacity: isLoading ? 0.5 : hasData ? 1 : 0.7,
                      "&:hover": {
                        backgroundColor: theme.palette.grey[100],
                      },
                    }}
                  >
                    <ScenarioGlyph
                      tierColors={
                        hasData
                          ? [
                              theme.palette.tiers.tier1,
                              theme.palette.tiers.tier2,
                              theme.palette.tiers.tier3,
                              theme.palette.tiers.tier4,
                            ]
                          : [
                              theme.palette.grey[300],
                              theme.palette.grey[300],
                              theme.palette.grey[300],
                              theme.palette.grey[300],
                            ]
                      }
                      values={getTierValues(outcome)}
                      variant="bars"
                      size={45}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.25,
                        minHeight: "2rem",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: hasData
                            ? theme.palette.blue.darkest
                            : theme.palette.grey[500],
                          fontWeight: 500,
                          textAlign: "center",
                          fontSize: "0.65rem",
                          lineHeight: 1.2,
                        }}
                      >
                        {outcome}
                      </Typography>
                      <InfoIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTooltip(openTooltip === outcome ? null : outcome)
                        }}
                        sx={{
                          fontSize: "0.85rem",
                          color: theme.palette.blue.bright,
                          cursor: "pointer",
                          "&:hover": {
                            color: theme.palette.blue.dark,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </InfoTooltip>
              </Box>
            </ClickAwayListener>
          )
        })}
      </Box>

      {/* Single location outcomes - last 4 */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 1,
          fontSize: "0.7rem",
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[600],
          letterSpacing: "0.5px",
        }}
      >
        Single location outcomes
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          alignItems: "start",
        }}
      >
        {OUTCOMES.slice(5).map((outcome) => {
          const tierData = chartData[outcome]
          const hasData =
            tierData !== undefined &&
            tierData.length > 0 &&
            tierData.some((tier) => tier.value > 0)
          const tierDefs = outcomeTierValues[outcome]
          const definition = OUTCOME_DEFINITIONS[outcome] || "No definition available."

          return (
            <ClickAwayListener key={outcome} onClickAway={() => openTooltip === outcome && setOpenTooltip(null)}>
              <Box>
                <InfoTooltip
                  description={
                    <>
                      <Box
                        component="span"
                        sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                      >
                        {outcome}
                      </Box>
                      {renderDefinitionWithLinks(definition, outcome)}
                      {tierDefs && (
                        <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1, fontSize: "0.8rem" }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier1, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier1)}</span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier2, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier2)}</span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier3, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier3)}</span>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, flexShrink: 0, mt: "4px", backgroundColor: theme.palette.tiers.tier4, borderRadius: 0.5 }} />
                            <span>{renderTierText(tierDefs.tier4)}</span>
                          </Box>
                        </Box>
                      )}
                      <Box component="span" sx={{ display: "block", mt: 1.5, fontStyle: "italic", fontSize: "0.8rem" }}>
                        Click{" "}
                        <Box
                          component="span"
                          onClick={() => handleShowOnMap(outcome)}
                          sx={{
                            color: theme.palette.blue.bright,
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontStyle: "normal",
                            "&:hover": { color: theme.palette.blue.dark },
                          }}
                        >
                          here
                        </Box>
                        {" "}or on chart to show values on map.
                      </Box>
                    </>
                  }
                  placement="top"
                  tooltipProps={{
                    open: openTooltip === outcome,
                    disableHoverListener: true,
                    disableFocusListener: true,
                    PopperProps: { 
                      disablePortal: true,
                      sx: { zIndex: 10001 },
                    },
                    slotProps: {
                      popper: {
                        modifiers: [
                          {
                            name: "offset",
                            options: {
                              offset: [0, 10],
                            },
                          },
                        ],
                      },
                    },
                  }}
                >
                  <Box
                    onClick={() => handleShowOnMap(outcome)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: "pointer",
                      p: 0.5,
                      borderRadius: theme.borderRadius.rounded,
                      transition: "all 0.2s ease",
                      opacity: isLoading ? 0.5 : hasData ? 1 : 0.7,
                      "&:hover": {
                        backgroundColor: theme.palette.grey[100],
                      },
                    }}
                  >
                    <ScenarioGlyph
                      tierColors={
                        hasData
                          ? [
                              theme.palette.tiers.tier1,
                              theme.palette.tiers.tier2,
                              theme.palette.tiers.tier3,
                              theme.palette.tiers.tier4,
                            ]
                          : [
                              theme.palette.grey[300],
                              theme.palette.grey[300],
                              theme.palette.grey[300],
                              theme.palette.grey[300],
                            ]
                      }
                      values={getTierValues(outcome)}
                      variant="dots"
                      size={45}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.25,
                        minHeight: "2rem",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: hasData
                            ? theme.palette.blue.darkest
                            : theme.palette.grey[500],
                          fontWeight: 500,
                          textAlign: "center",
                          fontSize: "0.65rem",
                          lineHeight: 1.2,
                        }}
                      >
                        {outcome}
                      </Typography>
                      <InfoIcon
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenTooltip(openTooltip === outcome ? null : outcome)
                        }}
                        sx={{
                          fontSize: "0.85rem",
                          color: theme.palette.blue.bright,
                          cursor: "pointer",
                          "&:hover": {
                            color: theme.palette.blue.dark,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </InfoTooltip>
              </Box>
            </ClickAwayListener>
          )
        })}
      </Box>
    </Box>
  )
}

export default StrategyRow

