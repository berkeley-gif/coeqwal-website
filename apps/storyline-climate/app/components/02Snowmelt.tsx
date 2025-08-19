"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"

function Snowmelt() {
  const { sectionRef } = useActiveSection("snowmelt", { amount: 0.5 })
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
  const beforeImageOpacity = useTransform(scrollYProgress, [0.6, 0.7], [1, 0])
  const afterImageOpacity = useTransform(scrollYProgress, [0.6, 0.7], [0, 1])

  return (
    <Box
      id="snowmelt"
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
              "First, we need to understand how climate change is affecting California’s water."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "Mountain snowpack in winter has historically served as a reliable water supply to California. "
            }
          </Typography>
          <Typography variant="body1">
            {
              "The snowmelt contributes to river flows throughout the long, dry summer that supply water for agriculture and cities and also sustain ecosystems."
            }
          </Typography>
        </Box>
      </motion.div>
      <Box
        height="50%"
        width="80%"
        sx={{ position: "relative" }}
        className="paragraph"
      >
        <motion.div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: afterImageOpacity,
            backgroundImage: "url('/drafts/supply-projected-static.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></motion.div>
        <motion.div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: beforeImageOpacity,
            backgroundImage: "url('/drafts/supply-static.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></motion.div>
      </Box>
      <motion.div style={{ opacity: secondParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"However, as the temperature increases, "}
            <span className="highlight-text">
              {"more water arrives as rain"}
            </span>
            {" in California instead of snow, and "}
            <span className="highlight-text">
              {"the reduced snowpack melts earlier"}
            </span>
            {"."}
          </Typography>
          <Typography variant="body1">
            {
              "The water we do have will also evaporate from soils or get used by plants more quickly, stressing ecosystems."
            }
          </Typography>
          <Typography variant="body1">
            {"The impact is that "}
            <span style={{ fontWeight: "bold" }}>
              {"less water is available"}
            </span>
            {" when we \u2014 humans and ecosystems \u2014 "}
            <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
            {" in the dry summer season."}
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default Snowmelt
