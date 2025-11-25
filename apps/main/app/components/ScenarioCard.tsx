"use client"

import { useRef, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  InfoIcon,
  IconButton,
  Tooltip,
} from "@repo/ui/mui"
import { ScenarioGlyph } from "@repo/viz"
import { OUTCOMES } from "../lib/outcomes"
import { useCalSimToggle } from "./CalSimContext"
import { useScenarioTiers } from "../hooks/useTierData"
import ScrollTooltip from "./ScrollTooltip"
import type { MotionValue } from "@repo/motion"

// Shared operation icons for current operations strategy
export const CURRENT_OPERATIONS_ICONS = [
  {
    path: "/images/icons/current_ops.svg",
    alt: "Current operations",
    description:
      "Represents how California manages water today, including the laws, regulations, priorities, and decisions that affect how California's water supply is allocated.",
    label: "Current operations",
  },
  {
    path: "/images/icons/land_use.svg",
    alt: "Current land use considerations",
    description: "Current land use considerations",
    label: "Updated agricultural land use (2020)",
  },
  {
    path: "/images/icons/tucp.svg",
    alt: "TUCP considerations",
    description:
      "Temporary Urgent Change Petitions (TUCPs, also known as TUCOs) permit changes during droughts to meet human health and safety needs and protect endangered species.",
    label: "TUCP's\nallowed",
  },
]

interface ScenarioCardProps {
  isMinimized?: boolean
  onToggleMinimized?: () => void
  minimizedTitle?: string
  firstTooltipOpacity?: MotionValue<number>
  secondTooltipOpacity?: MotionValue<number>
}

export default function ScenarioCard({
  isMinimized = false,
  onToggleMinimized,
  minimizedTitle = "Current operations",
  firstTooltipOpacity,
  secondTooltipOpacity,
}: ScenarioCardProps) {
  const theme = useTheme()
  const { selectedOutcome } = useCalSimToggle()

  // State for operation icon tooltips (track which tooltip is open)
  const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null)

  // Refs for tooltip targets and container
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const keyOperationsRef = useRef<HTMLElement>(null)
  const keyOutcomesRef = useRef<HTMLElement>(null)

  // Fetch tier data for s0020 (Current operations)
  const { chartData, isLoading } = useScenarioTiers("s0020")

  // Helper function to get tier values for an outcome
  const getTierValues = (outcome: string): [number, number, number, number] => {
    const tierData = chartData[outcome]
    if (!tierData || tierData.length !== 4) {
      // Return zeros if data not available
      return [0, 0, 0, 0]
    }
    // Extract normalized values from tier data
    return [
      tierData[0]?.value ?? 0,
      tierData[1]?.value ?? 0,
      tierData[2]?.value ?? 0,
      tierData[3]?.value ?? 0,
    ]
  }

  // Helper function to detect if tier data represents a single value
  const isSingleValueTier = (outcome: string): boolean => {
    const tierData = chartData[outcome]
    if (!tierData || tierData.length === 0) return false
    // Check the tierType metadata from the first data point (all points in a tier have the same type)
    return tierData[0]?.tierType === "single_value"
  }

  return (
    <Box
      ref={cardContainerRef}
      sx={{
        position: "relative",
        width: "100%",
        overflow: "visible", // Allow tooltips to overflow to the left
      }}
    >
      {/* Scroll-driven tooltips - only render if opacity values provided */}
      {firstTooltipOpacity && (
        <ScrollTooltip
          targetRef={keyOperationsRef}
          containerRef={cardContainerRef}
          content={
            <>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Strategy
              </Box>
              <br />
              <br />
              These are the key operations and policy decisions that define this water management strategy.
            </>
          }
          position="left"
          opacity={firstTooltipOpacity}
        />
      )}
      {secondTooltipOpacity && (
        <ScrollTooltip
          targetRef={keyOutcomesRef}
          containerRef={cardContainerRef}
          content={
            <>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Key outcomes
              </Box>
              <br />
              <br />
              These metrics show how this strategy affects water supply, ecosystems, agriculture, and communities.
            </>
          }
          position="left"
          opacity={secondTooltipOpacity}
        />
      )}

      {/* The actual card content */}
      <Box
        sx={{
          pointerEvents: "auto",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: theme.borderRadius.card,
          border: "3px solid", // Thicker border for "response" visual
          borderColor: theme.palette.brand.sky, // Use brand sky blue for response role
          padding: 2,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          opacity: isMinimized ? 0.8 : 1,
        }}
      >
        {/* Minimized state - title only */}
        {isMinimized && (
          <Box sx={{ mb: 1, flexShrink: 0 }}>
            <Box
              sx={{
                color: theme.palette.blue.darkest,
                fontFamily: theme.typography.fontFamily,
                fontWeight: 500,
                fontSize: "1.5rem",
                lineHeight: 1.3,
              }}
            >
              {minimizedTitle}
            </Box>
          </Box>
        )}

        {/* Expanded state - full content */}
        {!isMinimized && (
          <Box sx={{ mb: 1, flexShrink: 0 }}>
            <Box
              sx={{
                color: theme.palette.blue.medium,
                textTransform: "uppercase",
                letterSpacing: "0.75px",
                fontSize: theme.typography.compact.caption.fontSize,
                fontWeight: 500,
                display: "block",
                mb: 0.5,
              }}
            >
              STRATEGY
            </Box>
            <Box
              sx={{
                color: theme.palette.blue.darkest,
                fontFamily:
                  '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontWeight: 500,
                fontSize: "1.5rem",
                lineHeight: 1.3,
                mb: 1,
              }}
            >
              Current operations
            </Box>
            {/* HR separator */}
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: theme.palette.grey[300],
                my: 1.5,
              }}
            />

            {/* Key operations section */}
            <Box ref={keyOperationsRef} sx={{ flexShrink: 0, pb: 1.5 }}>
              <Typography
                variant="h6"
                sx={{
                  pb: 2,
                }}
              >
                Key operations
              </Typography>

              {/* Operations icons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "start",
                }}
              >
                {CURRENT_OPERATIONS_ICONS.map((icon, index) => (
                  <Box
                    key={icon.path}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: theme.spacing(5),
                        height: theme.spacing(5),
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={icon.path}
                        alt={icon.alt}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.blue.darkest,
                        fontWeight: 500,
                        textAlign: "center",
                        fontSize: "0.75rem",
                        mt: 0.5,
                        maxWidth: "100px",
                        whiteSpace: "pre-line",
                        wordBreak: "break-word",
                      }}
                    >
                      {icon.label}{" "}
                      <Tooltip
                        title={icon.description}
                        arrow
                        placement="top"
                        open={openTooltipIndex === index}
                        onClose={() => setOpenTooltipIndex(null)}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                      >
                        <IconButton
                          size="small"
                          component="span"
                          onClick={() =>
                            setOpenTooltipIndex(
                              openTooltipIndex === index ? null : index,
                            )
                          }
                          sx={{
                            padding: 0,
                            minWidth: 0,
                            width: "auto",
                            height: "auto",
                            color: theme.palette.blue.bright,
                            verticalAlign: "middle",
                            display: "inline-flex",
                            ml: 0.25,
                          }}
                        >
                          <InfoIcon sx={{ fontSize: "0.75rem" }} />
                        </IconButton>
                      </Tooltip>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* HR separator */}
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: theme.palette.grey[300],
                my: 1.5,
                mb: 0,
              }}
            />

            {/* Scenario snapshot section */}
            <Box sx={{ flexShrink: 0, pb: 1, pt: 1.5 }}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    pb: 1,
                  }}
                >
                  Key outcomes
                </Typography>

                {/* Outcomes charts - single grid with aligned columns */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)", // 5 equal columns
                    gap: 1.5,
                    alignItems: "start",
                  }}
                >
                  {OUTCOMES.map((outcome, index) => {
                    // Check if outcome has data
                    const tierData = chartData[outcome]
                    const hasData =
                      tierData !== undefined &&
                      tierData.length > 0 &&
                      tierData.some((tier) => tier.value > 0)

                    return (
                      <Box
                        key={outcome}
                        ref={index === 0 ? keyOutcomesRef : null}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          cursor: "default",
                          p: 1,
                          borderRadius: theme.borderRadius.rounded,
                          border:
                            selectedOutcome === outcome
                              ? `2px solid ${theme.palette.blue.bright}`
                              : "2px solid transparent",
                          backgroundColor:
                            selectedOutcome === outcome
                              ? theme.palette.blue.bright + "10"
                              : "transparent",
                          transition: "all 0.2s ease",
                          opacity: isLoading ? 0.5 : hasData ? 1 : 0.7,
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
                          variant={isSingleValueTier(outcome) ? "dots" : "bars"}
                          size={60}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: hasData
                              ? theme.palette.blue.darkest
                              : theme.palette.grey[500],
                            fontWeight: 500,
                            textAlign: "center",
                            fontSize: "0.75rem",
                            mt: 0.5,
                            minHeight: "2.5rem", // Fixed height for alignment
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {outcome}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Minimize/maximize button */}
        {onToggleMinimized && (
          <Box
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onToggleMinimized()
            }}
            sx={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "24px",
              height: "24px",
              backgroundColor: theme.palette.common.white,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              border: `1px solid ${theme.palette.grey[200]}`,
              transition: "all 0.2s ease",
              zIndex: 1,
              pointerEvents: "auto",
              "&:hover": {
                backgroundColor: theme.palette.grey[50],
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              },
            }}
          >
            <svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              style={{
                fill: "#3a4574",
                transition: "transform 0.2s ease",
                transform: isMinimized ? "rotate(0deg)" : "rotate(180deg)",
                pointerEvents: "none",
              }}
            >
              <path d="M6 0 L11 8 Q6 6 1 8 Z" />
            </svg>
          </Box>
        )}
      </Box>
    </Box>
  )
}
