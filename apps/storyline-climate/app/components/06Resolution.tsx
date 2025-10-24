"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import { useEffect, useRef } from "react"
import HydroClimateContainer from "./vis/HydroClimate"
import * as d3 from "d3";

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
          {/* First motion div */}
          <motion.div
            style={{
              x,
              width: "250vw",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Box height="100vh" width="100vw" sx={{backgroundColor: "red"}}/>
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
            />
          </motion.div>

          {/* Second motion div */}
          <motion.div style={{ x, width: "200vw", display: "flex" }}>
            <Hydroclimate />
            <Scenarios />
            <Box className="container-center">Transition</Box>
            {/* Probably need a dummy slide for the transition */}
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
      //className="container-center"
      width="100vw"
      height="100vh"
      sx={{
        position: "relative",
        justifyContent: "center",
        //backgroundImage: "url('/drafts/scenario-lines-v2.png')",
        //backgroundSize: "auto 100vh",
        //backgroundPosition: "right",
        //backgroundRepeat: "no-repeat",
      }}
      tabIndex={-1}
      role="region"
    >
      
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1728 291"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* loop lines */}
        <motion.path
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
          d="M0 210.147 C87.9324 240.403 957.486 170.211 894 26.0007 C873.232 -21.1739 804.262 10.8549 820.5 61.5007 
            C858.573 180.251 1740.16 15.0845 1733 10.1514
            
            M0 210.147 C13.5057 228.958 809.64 112.862 894 281.626 C978.36 450.39 712 424.753 796 297.626 
            C880 170.5 1686.31 232.946 1725 262.147"
          stroke="#F1B143"
          strokeWidth="4"
        />

        <motion.path
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
          d="M0 210.147 C-9.92595 221.46 395.378 326.686 596 320.074 C637.0672 326.4505 750.465 297.6462 688 237.6067 C625.5352 177.5673 552.5238 319.8387 715.5 388.6055
            C866.894 485.579 970.411 758.6575 1124.056 765.5815 C1277.7 772.5055 1709.966 978.4125 1709.966 978.4125
            
            M0 210.147 C0 210.147 216 127.104 538 339.105 C860 551.106 438.583 519.81 608.542 402.958 C778.5 286.106 1716.02 798.484 1716.02 798.484"
          stroke="#F1B143"
          strokeWidth="4"
          opacity={0.3}
        />

        {/* low opacity lines */}
        {/* <motion.path
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
          d="M0 209C0 209 309.838 302.538 422.054 282.203C534.271 261.867 829.213 446.231 1124.15 679.397C1419.1 912.563 1718.01 720.066 1718.01 720.066
          M0 210.042C0 210.042 453.833 173.441 632.585 307.647C811.338 441.853 854.039 712.976 1137.06 712.976C1420.09 712.976 1722.98 925.807 1722.98 925.807
          M0 210.042C0 210.042 352.54 233.087 507.458 277.823C662.377 322.559 1070.53 708.909 1208.57 780.757C1346.6 852.604 1722.98 814.646 1722.98 814.646
          M0 210.042C0 210.042 190.669 100.238 507.458 307.647C824.247 515.056 817.296 618.083 968.242 618.083C1119.19 618.083 1716.02 798.379 1716.02 798.379
          M-6 209C-6 209 342.567 306.604 478.618 310.671C614.668 314.738 850.026 585.861 976.145 636.019C1102.27 686.177 1718.96 865.118 1718.96 865.118"
          stroke="#F1B143"
          strokeWidth="4"
          opacity={0.3}
        /> */}
      </svg>
    </Box>
  )
}

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

function SvgConnector() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const p = d3.path()

    const startX = 0.75 * window.innerWidth        // 80vw = right edge of your image
    const y = 0.3 * window.innerHeight            // vertical center (adjust as needed)
    const endX = startX + 0.25 * window.innerWidth // 25vw to the right

    p.moveTo(startX, y)
    p.lineTo(endX, y)
    // p.bezierCurveTo()

    if (pathRef.current) {
      pathRef.current.setAttribute("d", p.toString())
    }
  }, [])

  return (
    <svg
      width="100%"
      height="100vh"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <path
        ref={pathRef}
        stroke="#f1b143"
        strokeWidth={2}
        fill="none"
      />
    </svg>
  )
}

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
