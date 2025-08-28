"use client"

import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import { useRef } from "react"

function SectionResolution() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `-${(2 - 1) * 100}vw`],
  )

  return (
    <div>
      <div ref={containerRef} style={{ height: "200vh", position: "relative" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            overflow: "hidden",
            height: "100vh",
          }}
        >
          <motion.div style={{ x, width: "200vw", display: "flex" }}>
            <Hydroclimate />
            <Scenarios />
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
      ref={sectionRef}
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <motion.div style={{ opacity: firstParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {"This is where COEQWAL comes in."}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "Using a water planning model known as CalSim, COEQWAL shines a light on possible water futures "
            }
          </Typography>
          <Typography variant="body1">
            {"by simulating the effects of climate on the water system."}
          </Typography>
        </Box>
      </motion.div>
      <Box
        style={{
          height: "50%",
          width: "80%",
          backgroundImage: "url('/drafts/hydroclimates.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
      <Box className="paragraph" component="article">
        <Typography variant="caption">
          {
            "These hydroclimate futures represent plausible conditions predicted by different models around the year 2050 "
          }
        </Typography>
        <Typography variant="caption">
          {
            "that correspond to more moderate (or slower) and more extreme (or rapid) climate change "
          }
          <u>{"(Hydroclimate futures FAQ)"}</u>
        </Typography>
      </Box>
      <motion.div style={{ opacity: secondParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"COEQWAL evaluates the effect of distinct hydroclimate futures, "}
          </Typography>
          <Typography variant="body1">
            {
              "which represent a range of possible changes in temperature, precipitation, and streamflow that are predicted by global climate models."
            }
          </Typography>
        </Box>
      </motion.div>
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
          {"COEQWAL also explores the effects of "}
          <span style={{ fontWeight: "bold" }}>
            <u>{"different water management decisions"}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {" and how these might limit the impacts of climate change."}
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
            "For example, COEQWAL looks at scenarios where groundwater pumping is limited under SGMA, sometimes along with cutting back farmland. These show how sustainable groundwater management can help during droughts, though it comes with trade-offs for crop production"
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
            "COEQWAL is also evaluating scenarios that include the Delta Conveyance Project."
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
              <Typography variant="body1">
                {"For a foreseeable future, "}
              </Typography>
              <Typography variant="body1">
                {
                  "California will continue to experience warming temperatures, more extreme droughts, and rising sea levels"
                }
              </Typography>
              <Typography variant="body1">
                {"that will affect "}
                <span style={{ fontWeight: "bold" }}>
                  {"when and how much water is available"}
                </span>
                {"."}
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
                  "Are you curios about how these scenarios will affect your specific water needs? "
                }
              </Typography>
              <Typography variant="body1">
                {"You can start "}
                <span style={{ fontWeight: "bold" }}>
                  <u>{"exploring specific scenarios"}</u>
                </span>
                {
                  " and think about how you can help California adapt to this changing climate."
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
