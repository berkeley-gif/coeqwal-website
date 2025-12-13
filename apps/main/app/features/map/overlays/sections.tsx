"use client"

/**
 * Scrollytelling section content
 *
 * Section content for the Learn map scrollytelling.
 */

import { Box, Typography } from "@repo/ui/mui"

// ============================================================================
// SECTION 1: California Overview
// ============================================================================

export function CaliforniaSection() {
  return (
    <>
      <Typography variant="body1">
        Did you know that California has one of the most complex water systems
        in the world?
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 3,
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: "1.5rem",
            color: "white",
            animation: "bounce 2s ease-in-out infinite",
            "@keyframes bounce": {
              "0%, 100%": { transform: "translateY(0)" },
              "50%": { transform: "translateY(-8px)" },
            },
          }}
        >
          ↓
        </Box>
      </Box>
    </>
  )
}

// ============================================================================
// SECTION 2: Central Valley
// ============================================================================

export function CentralValleySection() {
  return (
    <Typography variant="body1">
      The{" "}
      <Box component="span" sx={{ fontWeight: 600 }}>
        Central Valley
      </Box>{" "}
      is a long, low valley that collects much of California&apos;s water. This
      water is stored, divided, and transported to farms and cities across the
      state, supporting some of the most productive agricultural land in the
      country.
    </Typography>
  )
}

// ============================================================================
// SECTION 3: Basins
// ============================================================================

export function BasinsSection() {
  return (
    <Typography variant="body1">
      The Central Valley lies across three water{" "}
      <Box component="span" sx={{ fontWeight: 600 }}>
        basins
      </Box>
      .
    </Typography>
  )
}

// ============================================================================
// SECTION 4: Watersheds
// ============================================================================

export function WatershedsSection() {
  return (
    <Typography variant="body1">
      Each basin collects the rain and snowmelt that flows down from surrounding
      mountains into its network of streams, rivers, reservoirs, and wetlands.
    </Typography>
  )
}

// ============================================================================
// SECTION 6: Rivers
// ============================================================================

export function RiversSection() {
  return (
    <>
      <Typography variant="body1" sx={{ mb: 2 }}>
        These waters flow to the Valley floor, where the{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          Sacramento River
        </Box>{" "}
        flows from the north and the{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          San Joaquin River
        </Box>{" "}
        flows from the south. The rivers meet and mix in the low-lying{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          Delta
        </Box>
        .
      </Typography>
      <Typography variant="body1">
        During{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          wet years
        </Box>{" "}
        water flows from the Tulare Basin into the San Joaquin River.
      </Typography>
    </>
  )
}

// ============================================================================
// SECTION 8: Distribution
// ============================================================================

export function DistributionSection() {
  return (
    <Typography variant="body1">
      Water is diverted and distributed from multiple points along this system.
      Some water is released from reservoirs. Some is pumped from the Delta to
      the San Joaquin Valley and Southern California. Some is allowed to flow
      out to the Pacific Ocean. All of it must be carefully planned and
      accounted for.
    </Typography>
  )
}

// ============================================================================
// SECTION 9: CalSim
// ============================================================================

export function CalSimSection() {
  return (
    <>
      <Typography variant="body1" sx={{ mb: 2 }}>
        To do this water planning and accounting, the federal{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          U.S. Bureau of Reclamation
        </Box>{" "}
        and the state{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          Department of Water Resources
        </Box>{" "}
        use a computer model called{" "}
        <Box component="span" sx={{ fontWeight: 600 }}>
          CalSim
        </Box>
        .
      </Typography>
      <Typography variant="body1">
        CalSim models how water would move through the system based on the water
        management decisions that are made. It models how much water flows into
        reservoirs based on climate assumptions, how much is stored or released,
        and where it gets delivered.
      </Typography>
    </>
  )
}

// ============================================================================
// SECTION 10: COEQWAL
// ============================================================================

export function COEQWALSection() {
  return (
    <Typography variant="body1">
      The{" "}
      <Box component="span" sx={{ fontWeight: 600 }}>
        COEQWAL
      </Box>{" "}
      project has received support from the{" "}
      <Box component="span" sx={{ fontWeight: 600 }}>
        University of California
      </Box>{" "}
      and the{" "}
      <Box component="span" sx={{ fontWeight: 600 }}>
        Bay-Delta Science Program
      </Box>{" "}
      to use CalSim to explore a broad range of water management strategies. We
      evaluate the results under current and future climate conditions.
    </Typography>
  )
}

// ============================================================================
// SECTION 11: Public Data
// ============================================================================

export function PublicDataSection() {
  return (
    <Typography variant="body1">
      We are making these{" "}
      <Box component="span" sx={{ fontWeight: 600 }}>
        alternative water management scenarios
      </Box>{" "}
      available to the public so that communities can envision alternative water
      futures for California and understand the consequences that different
      water management strategies can bring.
    </Typography>
  )
}

// ============================================================================
// SECTION 12: Scenario Intro
// ============================================================================

export function ScenarioIntroSection() {
  return (
    <Typography
      variant="body1"
      sx={{
        maxWidth: {
          xs: "100%",
          sm: "340px",
          md: "380px",
          lg: "420px",
          xl: "460px",
        },
      }}
    >
      Each water management scenario on this site can be read as having three
      main elements. Let&apos;s look at the water management scenario for the
      way we currently manage Central Valley water.
    </Typography>
  )
}

// ============================================================================
// SECTION 13: Scenario Conclusion
// ============================================================================

export function ScenarioConclusionSection() {
  return (
    <Typography variant="body1">
      Keeping these three things in mind can help you read a scenario and
      understand what it changes, what it impacts, and how it might matter for
      your community.
    </Typography>
  )
}

