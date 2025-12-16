"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { motion, MotionValue, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import { useEffect, useRef } from "react"
import HydroClimateContainer from "./vis/HydroClimate"
import * as d3 from "d3"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"
import ResolutionScenario from "./vis/ResolutionScenerio"

function SectionResolution() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      console.log("Temperature scrollYProgress:", v)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  //NOTE: play with this to change how horizontal scroll flows
  const x = useTransform(scrollYProgress, [0.3, 1], ["0vw", `-${150}vw`])

  return (
    <div>
      <div ref={containerRef} style={{ height: "300vh", position: "relative" }}>
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
              width: "400vw",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Hydroclimate />
            <Box width="150vw">
              <ScenarioTheme scrollProgress={scrollYProgress} />
            </Box>
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
    offset: ["start end", "end start"],
  })

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
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box className="text-section">
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
                "Some hydroclimates involve moderate changes that our water storage and delivery system can accommodate. But other hydroclimates represent much greater changes in climate, including significant reductions in precipitation and streamflow."
              }
            </Typography>
          </Box>
        </Box>
        <Box className="container-center-horizontal text-section" height="50vh">
          <HydroClimateContainer />
        </Box>
        <Box
          className="paragraph"
          component="article"
          style={{ padding: "0 5rem" }}
        >
          <Typography variant="caption">
            {
              "Changes in adjusted historical records (1922–2021) of precipitation totals, mean temperatures, and mean streamflow relative to the actual historical record, shown for each month of the water year by hydroclimate."
            }
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}

function ScenarioTheme({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>
}) {
  const { sectionRef } = useActiveSection("scenariotheme", { amount: 0.5 })

  const firstScenario = useTransform(scrollProgress, [0.4, 0.6], [0, 1])
  const secondScenario = useTransform(scrollProgress, [0.5, 0.6], [0, 1])
  const restScenario = useTransform(scrollProgress, [0.45, 0.6], [0, 1])

  return (
    <StickyContainer
      sectionID="scenariotheme"
      stickyRollHeight="150vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="0 0 1728 907">
        <ResolutionScenario
          firstScenario={firstScenario}
          secondScenario={secondScenario}
          restScenario={restScenario}
          restOpacity={0.5}
        />
      </SVGLineContainer>
    </StickyContainer>
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

    const startX = 0.75 * window.innerWidth // 80vw = right edge of your image
    const y = 0.3 * window.innerHeight // vertical center (adjust as needed)
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
      <path ref={pathRef} stroke="#f1b143" strokeWidth={2} fill="none" />
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
