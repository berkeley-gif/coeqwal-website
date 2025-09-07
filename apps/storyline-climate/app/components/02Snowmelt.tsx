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
          <Typography variant="h4">
            {"Losing Nature's Water Storage"}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "For decades, California has relied on mountain snowpacks as a natural water storage."
            }
          </Typography>
          <Typography variant="body1">
            {
              "Snow builds up in winter, then melts slowly, feeding rivers through the long, dry summer."
            }
          </Typography>
          <Typography variant="body1">
            {
              "The snowmelt has consistently maintained river flows to provide water for farms, cities, and ecosystems."
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
            {"But warmer winters mean "}
            <span className="highlight-text">
              {"more precipitation falls as rain"}
            </span>
            {" instead of snow. And "}
            <span className="highlight-text">
              {"the snowpack we do receive melts earlier"}
            </span>
            {" in the year."}
          </Typography>
          <Typography variant="body1">
            {
              "Higher temperatures also cause water to evaporate faster from soils and plants."
            }
          </Typography>
          <Typography variant="body1">
            {"The impact is that "}
            <span style={{ fontWeight: "bold" }}>
              {"less water is available"}
            </span>
            {
              " in rivers and reservoirs during the dry summer when we \u2014 humans and ecosystems \u2014 "
            }
            <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
            {"."}
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default Snowmelt
