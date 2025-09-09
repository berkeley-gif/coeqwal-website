"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import { useRef } from "react"
import HydroClimateContainer from "./vis/HydroClimate"

function SectionResolution() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-${140}vw`])

  return (
    <div>
      <Hydroclimate />
      <div ref={containerRef} style={{ height: "250vh", position: "relative" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            overflow: "hidden",
            height: "100vh",
            width: "100%",
          }}
        >
          <motion.div
            style={{
              x,
              width: "250vw",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Box height="100vh" width="100vw">
              {" "}
            </Box>
            <ScenariosMockup />
            <Box
              id="scenario-transition"
              className="container-center"
              height="100vh"
              sx={{
                position: "relative",
                justifyContent: "center",
                backgroundImage: "url('/drafts/ending-transition.png')",
                backgroundSize: "auto 100vh",
                backgroundPosition: "left",
                backgroundRepeat: "no-repeat",
              }}
            ></Box>
            {/* Probably need a dummy slide for the transition*/}
          </motion.div>
        </div>
      </div>
      <Conclusion />
    </div>
  )
}

function Hydroclimate() {
  const { sectionRef } = useActiveSection("hydroclimate", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )

  return (
    <Box
      id="hydroclimate"
      className="container-left"
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="150vh"
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box className="sticky-container">
        <Box
          width="100%"
          height="100%"
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <motion.div
            className="text-container-left"
            style={{ opacity: firstParagraphOpacity, padding: "0 5rem" }}
          >
            <Box className="paragraph" component="article">
              <Typography variant="h4">
                {
                  "COEQWAL: Planning for different hydroclimates and management decisions"
                }
              </Typography>
            </Box>
            <Box className="paragraph" component="article">
              <Typography variant="body1" style={{ fontWeight: "bold" }}>
                {"This is where COEQWAL comes in."}
              </Typography>
            </Box>
            <Box className="paragraph" component="article">
              <Typography variant="body1">
                {
                  "Using a water planning model called CalSim, COEQWAL helps us study how climate change might affect California's water."
                }
              </Typography>
            </Box>
          </motion.div>
          <motion.div
            className="text-container-left"
            style={{ opacity: secondParagraphOpacity, padding: "0 5rem" }}
          >
            <Box className="paragraph" component="article">
              <Typography variant="body1">
                {
                  "COEQWAL studies five plausible future hydroclimates that correspond to different levels of concern for our water system. Some involve moderate increases in temperature, precipitation, and streamflow, while others involve much greater changes."
                }
              </Typography>
            </Box>
          </motion.div>
          <Box
            className="container-center-horizontal"
            height="50vh"
            width="80%"
          >
            <HydroClimateContainer />
          </Box>
          <Box
            className="paragraph"
            component="article"
            style={{ padding: "0 5rem" }}
          >
            <Typography variant="caption">
              {
                "Hydroclimate changes in precipitation, temperature, and seasonal streamflow (bands show the interquartile range) relative to historical conditions (1922–2021)."
              }
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function ScenariosMockup() {
  return (
    <Box
      id="scenarios"
      className="container-center"
      height="100vh"
      sx={{
        position: "relative",
        justifyContent: "center",
        backgroundImage: "url('/drafts/scenario-lines-v2.png')",
        backgroundSize: "auto 100vh",
        backgroundPosition: "right",
        backgroundRepeat: "no-repeat",
      }}
      tabIndex={-1}
      role="region"
    ></Box>
  )
}

/*
function Scenarios() {
  return (
    <Box
      id="scenarios"
      className="container-center"
      height="100vh"
      sx={{
        position: "relative",
        justifyContent: "center",
        backgroundImage: "url('/drafts/scenario-lines.png')",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box
        className="paragraph"
        component="article"
        sx={{
          position: "absolute",
          textAlign: "left",
          top: "23%",
          left: "2rem",
          width: "30%",
        }}
      >
        <Typography variant="body1">
          {"COEQWAL also looks at "}
          <span style={{ fontWeight: "bold" }}>
            <u>{"different strategies for managing water"}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {" and how these might limit the impacts of climate change."}
        </Typography>
        <Typography variant="body1">
          {"These different approaches are grouped into distinct themes."}
        </Typography>
      </Box>
      <Box
        className="paragraph"
        component="article"
        sx={{
          position: "absolute",
          textAlign: "left",
          top: "13%",
          left: "57%",
          width: "40%",
        }}
      >
        <Typography variant="h5" style={{ color: "#F1B143" }}>
          {"Managing Groundwater in a Changing Agricultural Landscape"}
        </Typography>
      </Box>
      <Box
        className="paragraph"
        component="article"
        sx={{
          position: "absolute",
          textAlign: "left",
          top: "20%",
          left: "57%",
          width: "40%",
        }}
      >
        <Typography variant="body1">
          {
            "For example, COEQWAL explores how reducing groundwater pumping through SGMA can help during droughts, while also considering the economic impacts to agricultural water users."
          }
        </Typography>
      </Box>
      <Box
        className="paragraph"
        component="article"
        sx={{
          position: "absolute",
          textAlign: "left",
          top: "40%",
          left: "57%",
          width: "40%",
        }}
      >
        <Typography variant="h5" style={{ color: "#F1B143" }}>
          {"Improving Reliability of Delta Exports for Farms and Cities"}
        </Typography>
      </Box>
      <Box
        className="paragraph"
        component="article"
        sx={{
          position: "absolute",
          textAlign: "left",
          top: "48%",
          left: "57%",
          width: "40%",
        }}
      >
        <Typography variant="body1">
          {
            "COEQWAL also explores scenarios provided by government agencies that represent how the Delta Conveyance Project would affect water experts and salinity conditions in the Delta. These scenarios can help us understand how the tunnel could impact farms, cities, and ecosystems throughout the state."
          }
        </Typography>
      </Box>
      <Box
        className="paragraph"
        component="article"
        sx={{
          position: "absolute",
          textAlign: "left",
          top: "63%",
          right: "6rem",
        }}
      >
        <Typography variant="h5" style={{ color: "#F1B143" }}>
          {"Other scenario themes"}
        </Typography>
      </Box>
    </Box>
  )
}
  */

function Conclusion() {
  const { sectionRef } = useActiveSection("conclusion", {
    amount: 0.5,
  })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.7],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1])

  return (
    <Box
      id="conclusion"
      className="container-center"
      sx={{
        justifyContent: "center",
        position: "relative",
        backgroundImage: "url('/drafts/pathways.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="140vh"
        width="100%"
        sx={{ position: "relative" }}
      ></Box>
      <Box className="container-center sticky-container">
        <Stack spacing={12} direction="column">
          <motion.div style={{ opacity: firstParagraphOpacity }}>
            <Box className="paragraph" component="article">
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
            <Box className="paragraph" component="article">
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
          </motion.div>
          <motion.div style={{ opacity: secondParagraphOpacity }}>
            <Box className="paragraph" component="article">
              <Typography variant="body1">
                {
                  "Are you curious about how these scenarios will affect your specific water needs? "
                }
              </Typography>
              <Typography variant="body1">
                {"You can start "}
                <span style={{ fontWeight: "bold" }}>
                  <u>{"exploring specific scenarios"}</u>
                </span>
                {
                  " and think about how you can help California adapt to our changing climate."
                }
              </Typography>
            </Box>
          </motion.div>
        </Stack>
      </Box>
    </Box>
  )
}

export default SectionResolution
