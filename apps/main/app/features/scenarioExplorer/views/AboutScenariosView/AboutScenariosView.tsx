"use client"

import React, { useRef, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

/**
 * AboutScenariosView
 *
 * Split view layout with scroll captured from left panel applied to right.
 */
export default function AboutScenariosView() {
  const theme = useTheme()
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  // Use native event listener to prevent default scroll and redirect to right panel
  useEffect(() => {
    const leftPanel = leftPanelRef.current
    const rightPanel = rightPanelRef.current

    if (!leftPanel || !rightPanel) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      rightPanel.scrollTop += e.deltaY
    }

    // Must use { passive: false } to allow preventDefault
    leftPanel.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      leftPanel.removeEventListener("wheel", handleWheel)
    }
  }, [])

  const tiers = [
    {
      level: 1,
      label: "Optimal",
      color: theme.palette.tiers.tier1,
      description: "Best possible outcomes. Goals are fully met or exceeded.",
    },
    {
      level: 2,
      label: "Sub-optimal",
      color: theme.palette.tiers.tier2,
      description:
        "Good outcomes with minor compromises. Goals are mostly met.",
    },
    {
      level: 3,
      label: "At-risk",
      color: theme.palette.tiers.tier3,
      description:
        "Outcomes falling short of goals. May require intervention or adaptation.",
    },
    {
      level: 4,
      label: "Critical",
      color: theme.palette.tiers.tier4,
      description:
        "Serious concerns. Goals are significantly unmet and require urgent attention.",
    },
  ]

  const outcomeCategories = [
    {
      title: "Communities & economy",
      outcomes: ["Community deliveries", "Agricultural revenue"],
    },
    {
      title: "Environment & ecosystems",
      outcomes: [
        "Environmental flows",
        "Delta estuary ecology",
        "Salmon abundance",
      ],
    },
    {
      title: "Water quality (Delta salinity)",
      outcomes: [
        "Freshwater for in-Delta uses",
        "Freshwater for Delta exports",
      ],
    },
    {
      title: "Storage & supply",
      outcomes: ["Reservoir storage", "Groundwater storage"],
    },
  ]

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left Panel - fixed positioning, but scrolling here scrolls the right panel */}
      <Box
        ref={leftPanelRef}
        sx={{
          width: "50%",
          height: "100%",
          backgroundColor: theme.palette.common.white,
          borderRight: `1px solid ${theme.palette.grey[200]}`,
          px: { xs: 4, md: 12 },
          pt: { xs: 5, md: 8 },
          pb: { xs: 5, md: 8 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflow: "hidden",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: theme.palette.grey[500],
            mb: 2,
          }}
        >
          Understanding Scenarios
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: theme.palette.text.primary,
            mb: 2,
          }}
        >
          What is a scenario?
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.grey[600],
            lineHeight: 1.7,
            mb: 2,
          }}
        >
          A scenario combines a{" "}
          <Box
            component="span"
            sx={{ fontWeight: 600, color: theme.palette.blue.darkest }}
          >
            water management strategy
          </Box>{" "}
          with{" "}
          <Box
            component="span"
            sx={{ fontWeight: 600, color: theme.palette.blue.darkest }}
          >
            climate conditions
          </Box>
          . By modeling many scenarios, we can see how different decisions and
          climate futures affect water across California.
        </Typography>

        {/* Strategies */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
            <Typography
              sx={{
                fontSize: "2rem",
                fontWeight: 600,
                color: theme.palette.nature.forest,
                lineHeight: 1,
              }}
            >
              30
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: theme.palette.blue.darkest,
              }}
            >
              management strategies
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.grey[600],
              lineHeight: 1.7,
            }}
          >
            Alternative ways to operate California&apos;s water system—changes
            to reservoir operations, allocations, environmental flows, and
            infrastructure.
          </Typography>
        </Box>

        {/* Climates */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
            <Typography
              sx={{
                fontSize: "2rem",
                fontWeight: 600,
                color: theme.palette.blue.medium,
                lineHeight: 1,
              }}
            >
              6
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: theme.palette.blue.darkest,
              }}
            >
              climate conditions
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.grey[600],
              lineHeight: 1.7,
            }}
          >
            From historical patterns to extreme warming and drying, we test each
            strategy under different climate futures.
          </Typography>
        </Box>

        {/* Tiers */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
            <Typography
              sx={{
                fontSize: "2rem",
                fontWeight: 600,
                color: theme.palette.grey[500],
                lineHeight: 1,
              }}
            >
              4
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: theme.palette.blue.darkest,
              }}
            >
              performance tiers
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.grey[600],
              lineHeight: 1.7,
            }}
          >
            From optimal to critical, tiers show how well each scenario performs
            for different outcomes.
          </Typography>
        </Box>
      </Box>

      {/* Right panel - Scrolling */}
      <Box
        ref={rightPanelRef}
        sx={{
          width: "50%",
          height: "100%",
          overflow: "auto",
          backgroundColor: theme.palette.grey[50],
        }}
      >
        {/* The tier system */}
        <Box
          sx={{
            px: { xs: 4, md: 12 },
            pt: { xs: 5, md: 8 },
            pb: { xs: 5, md: 8 },
            borderBottom: `1px solid ${theme.palette.grey[200]}`,
            backgroundColor: theme.palette.common.white,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: theme.palette.grey[500],
              mb: 2,
            }}
          >
            The Tier System
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.grey[600],
              lineHeight: 1.7,
              mb: 3,
            }}
          >
            We use a four-tier system to show how well each scenario performs.
            Tiers help you quickly spot trade-offs.
          </Typography>

          {/* Tier List */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {tiers.map((tier) => (
              <Box
                key={tier.level}
                sx={{
                  display: "flex",
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    backgroundColor: tier.color,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: theme.palette.blue.darkest,
                      mb: 0.5,
                    }}
                  >
                    Tier {tier.level}: {tier.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.grey[600],
                      lineHeight: 1.6,
                    }}
                  >
                    {tier.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Outcomes */}
        <Box
          sx={{
            px: { xs: 4, md: 12 },
            pt: { xs: 5, md: 8 },
            pb: { xs: 5, md: 8 },
            borderBottom: `1px solid ${theme.palette.grey[200]}`,
            backgroundColor: theme.palette.common.white,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: theme.palette.grey[500],
              mb: 2,
            }}
          >
            Outcomes
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.grey[600],
              lineHeight: 1.7,
              mb: 3,
            }}
          >
            Nine outcomes that matter to Californians, from community water
            supply to salmon health. These capture what farms, cities, and
            ecosystems need.
          </Typography>

          {/* Outcomes grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 0,
              border: `1px solid ${theme.palette.grey[200]}`,
            }}
          >
            {outcomeCategories.map((category, index) => (
              <Box
                key={category.title}
                sx={{
                  p: 2.5,
                  borderBottom:
                    index < 2 ? `1px solid ${theme.palette.grey[200]}` : "none",
                  borderRight:
                    index % 2 === 0
                      ? `1px solid ${theme.palette.grey[200]}`
                      : "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: theme.palette.blue.darkest,
                    mb: 1,
                  }}
                >
                  {category.title}
                </Typography>
                {category.outcomes.map((outcome) => (
                  <Typography
                    key={outcome}
                    variant="body2"
                    sx={{
                      color: theme.palette.grey[600],
                      lineHeight: 1.8,
                    }}
                  >
                    {outcome}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Get Started */}
        <Box
          sx={{
            px: { xs: 4, md: 12 },
            pt: { xs: 5, md: 8 },
            pb: { xs: 5, md: 8 },
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: theme.palette.grey[500],
              mb: 1.5,
            }}
          >
            Get Started
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.grey[600],
              lineHeight: 1.7,
            }}
          >
            Use the tabs above to look at our library of scenarios. Use the
            first tab to select a set of scenarios of interest. Use the second
            tab to compare these scenarios in depth.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
