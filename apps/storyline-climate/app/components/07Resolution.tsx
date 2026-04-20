"use client"

import {
  Box,
  LibraryBooksIcon,
  Stack,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { useRef } from "react"
import { motion } from "@repo/motion"
import HydroClimateContainer from "./vis/HydroClimate"
import StickyContainer from "./helpers/StickyContainer"

export function Hydroclimate() {
  const sectionRef = useRef(null)

  return (
    <StickyContainer
      sectionID="hydroclimate"
      stickyRollHeight="150vh"
      sectionRef={sectionRef}
    >
      <Box
        width="100%"
        height="100%"
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          className="text-section"
          width="100%"
          height="35%"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            paddingTop: "5rem",
            pointerEvents: "auto",
          }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {"COEQWAL: Planning for the future"}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography
              variant="body1"
              style={{ fontWeight: "bold" }}
              gutterBottom
            >
              {"This is where COEQWAL comes in."}
            </Typography>
            <Typography variant="body1">
              {
                "Using a water planning model called CalSim, COEQWAL helps us understand how climate change might affect California's water system."
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"COEQWAL studies five plausible future "}
              <span style={{ fontWeight: "bold" }}>{"hydroclimates"}</span>
              {
                " \u2014 specific changes in temperatures, precipitation, and streamflow."
              }
            </Typography>
            <Typography variant="body1">
              {
                "Some hydroclimates involve moderate changes that our water storage and delivery system can accommodate. "
              }
            </Typography>
            <Typography variant="body1">
              {
                "But other hydroclimates represent much greater changes in climate, including significant reductions in precipitation and streamflow."
              }
            </Typography>
          </Box>
        </Box>

        <Box
          className="text-section"
          width="100%"
          height="65%"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            pointerEvents: "auto",
          }}
        >
          <Box component="article">
            <Typography variant="h5">
              {"Streamflow Changes under Different Hydroclimates"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {
                "Changes in adjusted historical records (1922–2021) of precipitation totals, mean temperatures, and mean streamflow relative to the actual historical record, shown for each month of the water year by hydroclimate."
              }
            </Typography>
          </Box>
          <Box
            className="container-center-horizontal"
            width="100%"
            height="100%"
          >
            <HydroClimateContainer />
          </Box>
        </Box>
      </Box>
    </StickyContainer>
  )
}

export function Themes() {
  const theme = useTheme()

  return (
    <Box
      width="100%"
      height="200vh"
      sx={{
        background: `linear-gradient(180deg, #172a48 10%, ${theme.palette.brand.water} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h3" sx={{ color: "white" }}>
        Scenario Theme Visuals
      </Typography>
    </Box>
  )
}

export function Conclusion() {
  const theme = useTheme()

  return (
    <Box
      width="100%"
      height="100vh"
      sx={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layer 1: Gradient background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `linear-gradient(to bottom, ${theme.palette.brand.water}, ${theme.palette.brand.panelLight})`,
        }}
      />

      {/* Layer 2: Background image */}
      <motion.img
        src="/images/2025_08_28_KJ_3517_Delta_Aerials.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "auto",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          px: theme.space.panel.padding,
          pt: theme.space.panel.topOffset,
          pb: theme.space.panel.padding,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          height: "100%",
          boxSizing: "border-box",
          alignItems: "center",
          width: "100%",
          pointerEvents: "auto",
          color: theme.palette.text.primary,
        }}
      >
        <Stack spacing={2} direction="column" alignItems="center">
          <Box width="100%" className="paragraph" component="article">
            <Typography variant="body1">{"In the years ahead,"}</Typography>
            <Typography variant="body1">
              {
                "California will keep getting hotter, with more severe droughts, less snowpack in the mountains, and higher sea levels."
              }
            </Typography>
            <Typography variant="body1">
              {"This will change "}
              <span style={{ fontWeight: "bold" }}>
                {"when and how much water we have"}
              </span>
              {" to allocate to different uses."}
            </Typography>
          </Box>
          <Box width="100%" className="paragraph" component="article">
            <Typography variant="body1">
              {
                "By exploring different scenarios about the future of water in California, "
              }
            </Typography>
            <Typography variant="body1">
              {
                "we can better plan for the challenges ahead and search for solutions that work for everyone."
              }
            </Typography>
          </Box>
          <Box width="100%" className="paragraph" component="article">
            <Typography variant="body1">
              {
                "Are you curious about how these scenarios will affect your specific water needs? "
              }
            </Typography>
            <Typography variant="body1">
              {"You can start "}
              <strong>
                <a
                  href="https://dev.coeqwal.org/?tab=explore"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  explore specific scenarios
                </a>
              </strong>{" "}
              <LibraryBooksIcon
                sx={{
                  fontSize: theme.typography.body1.fontSize,
                  verticalAlign: "middle",
                }}
              />
              {
                " and think about how you can help California adapt to our changing climate."
              }
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
