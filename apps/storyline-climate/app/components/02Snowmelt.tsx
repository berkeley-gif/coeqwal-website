"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import SnowpackContainer from "./vis/Snowpack"
import TemperatureLineChart from "./vis/TemperatureLineChart"

function SectionStarter() {
  return (
    <>
      <Temperature />
      <Snowmelt />
    </>
  )
}

function Temperature() {
  const { sectionRef } = useActiveSection("temperature", { amount: 0.5 })
  return (
    <Box
      id="temperature"
      className="container-left"
      ref={sectionRef}
      height="100vh"
      width="100%"
      tabIndex={-1}
      role="region"
      sx={{ paddingLeft: "5rem", paddingRight: "5rem" }}
    >
      <Box width="100%" height="60%" sx={{ display: "flex" }}>
        <TemperatureLineChart />
      </Box>
      <Box
        width="100%"
        height="40%"
        className="text-container-left"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box className="paragraph">
          <Typography variant="body1">
            {
              "California’s water system is under pressure to meet multiple demands."
            }
          </Typography>
          <Typography variant="body1">
            {
              "People need clean drinking water. Farms need water to grow food. Fish and wildlife need water to survive."
            }
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {"Climate change is making matters worse."}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {
              "Warmer temperatures, less predictable rain and snow, and higher sea levels are stressing both our water infrastructure and living environment."
            }
          </Typography>
        </Box>
        <Box
          className="paragraph"
          component="article"
          aria-labelledby="opener-throughline"
        >
          <Typography
            id="throughline-heading"
            variant="body1"
            sx={{ fontWeight: "bold" }}
          >
            {
              "How can we limit the impacts of climate change on California's water future?"
            }
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

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

  return (
    <Box
      id="snowmelt"
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
        <motion.div
          className="text-container-left"
          style={{ opacity: secondParagraphOpacity, paddingRight: "10px" }}
        >
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
          </Box>
        </motion.div>
        <motion.div
          className="text-container-left"
          style={{ opacity: secondParagraphOpacity, paddingRight: "10px" }}
        >
          <Box className="paragraph" component="article">
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
            display: "flex",
            flexDirection: "column",
            justifyContent: "center", // centers vertical
            alignItems: "flex-start", // aligned left
            backgroundSize: "100% auto",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Box
            component="img"
            src="/icons/snowflake_icon.svg"
            alt="Snowflake icon"
            sx={{
              display: "block",
              mb: 2, // spacing between icon and chart
              ml: 2, // move right
              width: 48,
              height: 48,
              filter: "invert(1) brightness(100%)",
            }}
          />
          <Box width="100%" height="50%">
            <SnowpackContainer />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default SectionStarter
