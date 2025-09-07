"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"

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
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <motion.div style={{ opacity: firstParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "In past droughts, when water available in rivers and reservoirs is reduced,"
            }
          </Typography>
          <Typography variant="body1">
            {"communities and farmers in California have turned to"}
            <span style={{ fontWeight: "bold" }}>{"groundwater"}</span>
            {" to meet their needs."}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
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
      <Box
        className="paragraph"
        style={{
          height: "60%",
          width: "90%",
          backgroundImage: "url('/drafts/groundwater-static.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
      <motion.div style={{ opacity: secondParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"The 2014 "}
            <span style={{ fontWeight: "bold" }}>
              {"Sustainable Groundwater Management Act (SGMA) "}
            </span>
            {"is intended to protect groundwater for the future."}
          </Typography>
          <Typography variant="body1">
            {
              "It aims to reduce overpumping so supplies will still be there during extreme droughts."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "But putting the law fully into effect will take years. It will also mean many farms must cut back on water use through more efficient irrigation, fewer crops, or retiring some farmland."
            }
          </Typography>
          <Typography variant="body1">
            {
              "These changes could affect the livelihoods of workers and local economies. Therefore, careful planning will be needed to support affected communities."
            }
          </Typography>
        </Box>
      </motion.div>
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
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <motion.div style={{ opacity: firstParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "Water conservation in cities and community water systems can also help us adapt to a future with less water."
            }
          </Typography>
          <Typography variant="body1">
            {
              "Upgrades like drought-tolerant landscaping, water-efficient appliances, and water recycling "
            }
          </Typography>
          <Typography variant="body1">
            {"all help "}
            <span className="highlight-text">
              {"lower human water demands"}
            </span>
            {" and make the most of available supplies."}
          </Typography>
        </Box>
      </motion.div>
      <Box
        className="paragraph"
        style={{
          height: "60%",
          width: "80%",
          backgroundImage: "url('/drafts/conservation-static.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
      <motion.div style={{ opacity: secondParagraphOpacity }}>
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
  )
}

export default SectionSupply
