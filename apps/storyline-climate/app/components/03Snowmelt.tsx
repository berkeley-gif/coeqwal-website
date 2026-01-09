"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import SnowpackContainer from "./vis/Snowpack"
import { HorizontalImageSlider } from "./helpers/ImageSlider"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { usePlayAnimationOnce } from "@repo/motion/hooks"

function SectionSnow() {
  return (
    <>
      <SierraNevada />
      <Snowmelt />
    </>
  )
}

function SierraNevada() {
  const { sectionRef } = useActiveSection("sierranevada", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])

  return (
    <StickyContainer
      sectionID="sierranevada"
      stickyRollHeight="120vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="450 100 864 864">
        <motion.path
          d="M927 -40.0001C927 -40.0001 609 -62 401 138C193 338 -117 430 -117 430"
          className="svg-line"
          pathLength={linePath}
        />
      </SVGLineContainer>

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          left: "50%",
          width: "50%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <HorizontalImageSlider
          leftSrc="/images/sierra_nevada_2015_v2.png"
          rightSrc="/images/sierra_nevada_2023_v2.png"
          width="100%"
        />
      </Box>

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
        <Box className="paragraph">
          <Typography variant="h4">{"Losing the Natural Reservoir"}</Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"In the mountain regions of California, "}
            <span className="highlight-text">{"warming temperatures "}</span>
            {"mean "}
            <span className="highlight-text">{"less snow "}</span>
            {"and more rain falls in the winter months."}
          </Typography>
          <Typography variant="body1">
            {
              "The snowpack that builds up over the winter is also melting earlier. "
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"This snowpack has historically served as an important "}
            <span style={{ fontWeight: "bold" }}>natural reservoir</span>
            {" to supply water for California."}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {
              "Snow melting in the late spring would feed rivers and top off reservoirs downstream before the long dry season. "
            }
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}

//TODO: check the z-index
function Snowmelt() {
  const { sectionRef } = useActiveSection("snowmelt", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])
  const labelOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.5, 0.65],
    [0, 1],
  )

  return (
    <StickyContainer
      sectionID="snowmelt"
      stickyRollHeight="200vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="0 0 1608 647">
        <motion.path
          d="M2 -33C2 -33 196 235 658 343C1120 451 1702 645 1702 645"
          className="svg-line"
          pathLength={linePath}
          transform="translate(0, -120)" // can be adjusted
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
          <Typography variant="h4">{"Declining Snow"}</Typography>
        </Box>
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
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"The impact is that "}
            <span style={{ fontWeight: "bold" }}>
              {"less water is available"}
            </span>
            {
              " in rivers and reservoirs during the dry summer when we — humans and ecosystems — "
            }
            <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
            {"."}
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
        <motion.div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            opacity: labelOpacity,
          }}
        >
          <Box
            component="img"
            src="/icons/snowflake_icon.svg"
            alt="Snowflake icon"
            sx={{
              display: "block",
              marginRight: 1,
              width: 48,
              height: 48,
              filter: "invert(1) brightness(100%)",
            }}
          />
          <Typography variant="caption">
            {"April Snow Water Equivalent"}
          </Typography>
        </motion.div>
        <Box width="100%" height="50%">
          <SnowpackContainer scrollProgress={scrollYProgress} />
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="h6" align="center">
            {"Projected Change in Snowpack by 2050"}
          </Typography>
          <Typography variant="caption" textAlign={'center'} sx={{padding: "0 4rem"}}>
            {"Source: Cal-Adapt North Sierra, Fourth Assessment Climate Region modeled by CanESM2 in high emission scenario"}
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}

export default SectionSnow
