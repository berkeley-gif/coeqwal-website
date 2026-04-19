"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import GroundwaterLine from "./vis/GroundwaterLine"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { useRef } from "react"

function Groundwater() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])

  return (
    <StickyContainer
      sectionID="groundwater"
      stickyRollHeight="120vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="0 20 1728 1117">
        <motion.path
          d="M1748 713C1474.44 581.033 984 429 804 263C624 97 268 -8 268 -8"
          className="svg-line"
          pathLength={linePath}
          transform={"scale(1.1)"}
        />
      </SVGLineContainer>

      <Box
        className="text-section"
        width="50%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box className="paragraph" component="article">
          <Typography variant="h3">{"Increasing Droughts"}</Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"Droughts are not new to California."}
          </Typography>
          <Typography variant="body1">
            {
              "But in a changing climate, droughts are expected to occur more often. "
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "In past droughts, when water available in rivers and reservoirs is reduced, "
            }
            {"communities and farmers in California turned to "}
            <span style={{ fontWeight: "bold" }}>{"groundwater"}</span>
            {" to meet their needs."}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"Unfortunately, "}
            <span className="highlight-text">
              {
                "overpumping of groundwater has depleted underground water storage"
              }
            </span>
            {" , causing wells to dry and the land to sink."}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"In 2014, the state enacted "}
            <span style={{ fontWeight: "bold" }}>
              {"Sustainable Groundwater Management Act (SGMA)"}
            </span>
            {
              ". This law is intended to protect groundwater for the future. It aims to reduce overpumping so supplies will still be there during extreme droughts."
            }
          </Typography>
        </Box>
      </Box>

      <Box
        width="50%"
        height="100%"
        sx={{
          position: "absolute",
          inset: 0,
          left: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "5rem",
        }}
      >
        <Box
          className="paragraph"
          component="article"
          sx={{ pointerEvents: "auto" }}
        >
          <Typography variant="h5" align="left">
            {"Cumulative Groundwater Loss in Central Valley"}
          </Typography>
          <Typography variant="caption" align="left" sx={{ opacity: 0.7 }}>
            {
              "Groundwater losses estimated with Central Valley Hydrological Model, simplified for presentation. Source: Liu et al., 2022"
            }
          </Typography>
        </Box>
        <Box width="100%" height="50%">
          <GroundwaterLine scrollProgress={scrollYProgress} />
        </Box>
      </Box>
    </StickyContainer>
  )
}

/*
function Conservation() {
  const { sectionRef } = useActiveSection("conservation", { amount: 0.5 })
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
      id="conservation"
      ref={sectionRef}
      className="container-row"
      height="100vh"
      width="100%"
      tabIndex={-1}
      role="region"
    >
      <Box
        width="50%"
        height="100%"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <motion.div
          className="text-container-left"
          style={{ opacity: firstParagraphOpacity }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {"Making the Most of Limited Water"}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "Water conservation in cities and community water systems can also help us adapt to a future with less water."
              }
            </Typography>
            <Typography variant="body1">
              {
                "Upgrades like drought-tolerant landscaping, water-efficient appliances, and water recycling all help "
              }
              <span className="highlight-text">
                {"lower human water demands"}
              </span>
              {" and make the most of available supplies."}
            </Typography>
          </Box>
        </motion.div>
        <motion.div
          className="text-container-left"
          style={{ opacity: secondParagraphOpacity }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "In fact, California has already made water conservation gains \u2014 cities today use about the same amount of water they did in 2000, "
              }
            </Typography>
            <Typography variant="body1">
              {"even though 5.5 million more people now live here."}
            </Typography>
          </Box>
        </motion.div>
      </Box>
      <Box
        width="50%"
        height="100%"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 20px",
        }}
      >
        <Box
          width="100%"
          height="100%"
          sx={{
            position: "relative",
            justifyContent: "center",
            backgroundImage: "url('/drafts/supply-conservation.png')",
            backgroundSize: "100% auto",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></Box>
      </Box>
    </Box>
  )
}
*/

export default Groundwater
