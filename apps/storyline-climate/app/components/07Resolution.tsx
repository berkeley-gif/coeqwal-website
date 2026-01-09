"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import { motion, MotionValue, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import { useEffect, useRef } from "react"
import HydroClimateContainer from "./vis/HydroClimate"
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
            <Box width="50%">
              <Hydroclimate />
            </Box>
            <Box width="150vw">
              <ScenarioTheme scrollProgress={scrollYProgress} />
            </Box>
            <Box width="100vw">
              <ScenarioTransition scrollProgress={scrollYProgress} />
            </Box>
            <Box
              id="scenario-transition"
              className="container-center"
              height="100vh"
              sx={{ position: "relative" }}
            ></Box>
          </motion.div>
        </div>
      </div>

      <Conclusion />
    </div>
  )
}

function Hydroclimate() {
  const { sectionRef } = useActiveSection("hydroclimate", { amount: 0.5 })

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

function ScenarioTransition({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>
}) {
  const { sectionRef } = useActiveSection("scenariotransition", { amount: 0.5 })
  const pathLength = useTransform(scrollProgress, [0.7, 1], [0, 1])

  //TODO: fix this
  return (
    <StickyContainer
      sectionID="scenariotransition"
      stickyRollHeight="100vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="10 157 1128 997">
        <motion.path
          className="svg-line"
          d="M-12.5 290C-12.5 290 173 285 394 279C615 273 969 480 908 692C847 904 865 1117 865 1117"
          pathLength={pathLength}
        />
        <motion.path
          className="svg-line"
          d="M-4 468C-4 468 349 484 493 450C637 415.999 709 588.999 810 679C911 769 1022 834.001 979 890C936 945.999 756 1010 804 1040C852 1070 852 1077 856.5 1093C861 1109 861 1117.5 861 1117.5"
          pathLength={pathLength}
        />
        <g style={{ opacity: 0.5 }}>
          <motion.path
            className="svg-line"
            d="M-26 1084C-26 1084 141 1027 307 942.999C473 859 545 910.999 692 936C839 961 909 1017 889 1048C869 1079 869 1118 869 1118"
            pathLength={pathLength}
          />
          <motion.path
            className="svg-line"
            d="M-1.5 1054.5C-1.5 1054.5 256.5 1139.5 424.5 1096.5C592.5 1053.5 696 1069 769 1061C842 1053 858 1118 858 1118"
            pathLength={pathLength}
          />
          <motion.path
            className="svg-line"
            d="M-2 1092C-2 1092 153 1077 269 1042C385 1007 497.5 863 645.5 954C793.5 1045 918.5 1027.5 901 1057C883.5 1086.5 870 1120.5 870 1120.5"
            pathLength={pathLength}
          />
          <motion.path
            className="svg-line"
            d="M-1.5 1024.5C-1.5 1024.5 210.5 973 280 926C349.5 878.999 665 742 800 847C935 952 908 990 921 1033C934 1076 874 1118 874 1118"
            pathLength={pathLength}
          />
          <motion.path
            className="svg-line"
            d="M-3 1108C-3 1108 44 1124 168 1098C292 1072 412 975 541 977C670 979 751 1095 793 1088C835 1081 855.5 1120 855.5 1120"
            pathLength={pathLength}
          />
        </g>
      </SVGLineContainer>
    </StickyContainer>
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
