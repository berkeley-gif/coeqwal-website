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
            {"During droughts of the past,"}
          </Typography>
          <Typography variant="body1">
            {
              "communities and farmers in California have relied on groundwater to meet their needs. "
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"But that resource, too, has limits."}
          </Typography>
          <Typography variant="body1">
            {"Unfortunately, "}
            <span className="highlight-text">
              {"overpumping of groundwater has depleted aquifers"}
            </span>
            {" and caused the land to subside, or sink."}
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
            {"is intended to prevent unsustainable pumping and "}
          </Typography>
          <Typography variant="body1">
            {
              "help to ensure the groundwater supplies will be available during more extreme droughts of the future. "
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "However, this law will likely require a reduction in farmland and will not go into full effect for many years."
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
            {"Water conservation is another important adaptation strategy."}
          </Typography>
          <Typography variant="body1">
            {
              "For example, drought tolerant landscaping, water efficient appliances, and water recycling "
            }
          </Typography>
          <Typography variant="body1">
            {
              "can help lower human water demands and make the most of available supplies."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "In fact, urban water conservation has been so successful that California’s cities are using as much water now as they did in 2000, "
            }
          </Typography>
          <Typography variant="body1">
            {"despite an increase of about 5.5 million people!"}
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
              "However, further urban conservation will be more difficult to achieve, and agricultural land transitions change livelihoods for workers and local economies,"
            }
          </Typography>
          <Typography variant="body1">
            {
              " even with support for planning and funding those transitions in ways that benefit many groups."
            }
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default SectionSupply
