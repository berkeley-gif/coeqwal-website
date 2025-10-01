"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import GroundwaterContainer from "./vis/Groundwater"

function SectionSupply() {
  return (
    <>
      <Groundwater />
      <Conservation />
    </>
  )
}

function Groundwater() {
  const { sectionRef } = useActiveSection("groundwater", { amount: 0.5 })
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
      id="groundwater"
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
          style={{
            opacity: firstParagraphOpacity,
            marginBottom: "20px",
            paddingRight: "10px",
          }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {"Groundwater: A Hidden but Limited Reserve"}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "In past droughts, when water available in rivers and reservoirs is reduced,"
              }
            </Typography>
            <Typography variant="body1">
              {"communities and farmers in California have turned to "}
              <span style={{ fontWeight: "bold" }}>{"groundwater"}</span>
              {" to meet their needs."}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1" gutterBottom>
              {"But that resource, too, has limits."}
            </Typography>
            <Typography variant="body1">
              {"Unfortunately, "}
              <span className="highlight-text">
                {
                  "overpumping of groundwater has depleted underground water storage"
                }
              </span>
              {" and caused the land to sink."}
            </Typography>
          </Box>
        </motion.div>
        <motion.div
          className="text-container-left"
          style={{ opacity: secondParagraphOpacity, paddingRight: "10px" }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"The 2014 "}
              <span style={{ fontWeight: "bold" }}>
                {"Sustainable Groundwater Management Act (SGMA) "}
              </span>
              {
                "is intended to protect groundwater for the future. It aims to reduce overpumping so supplies will still be there during extreme droughts."
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"But putting the law fully into effect will take years. "}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {
                "It will also mean many farms must cut back on water use through more efficient irrigation, fewer crops, or retiring some farmland. These changes could affect the livelihoods of workers and local economies. "
              }
            </Typography>
            <Typography variant="body1">
              {
                "Therefore, careful planning will be needed to support affected communities."
              }
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
          height="70%"
          sx={{
            position: "relative",
            justifyContent: "center",
            // backgroundImage: "url('/drafts/supply-groundwater.png')",
            backgroundSize: "100% auto",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Box width="100%" height="60%">
            <GroundwaterContainer />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

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

export default SectionSupply
