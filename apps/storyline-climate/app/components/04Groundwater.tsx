"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import GroundwaterLine from "./vis/GroundwaterLine"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { useRef } from "react"

function Groundwater() {
  const sectionRef = useRef(null)
  const theme = useTheme()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])
  const textOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])

  return (
    <StickyContainer
      sectionID="groundwater"
      stickyRollHeight="120vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="0 20 1728 1115" zIndex={1}>
        <motion.path
          id="groundwaterPumpingPath"
          d="M-16 -52C-16 -52 -14 12 270 42C554 72 588 128 805 297C1022 466 1481.44 712.033 1755 844V1115"
          className="svg-line glow-effect"
          pathLength={linePath}
          transform={"translate(0, -14)"}
        />
        <motion.path
          id="groundwaterPumpingTextPath"
          d="M-16 -52C-16 -52 -14 12 270 42C554 72 588 128 805 297C1022 466 1481.44 712.033 1755 844V1115"
          fill="none"
          stroke="none"
          transform="translate(0, -38)"
        />
        <motion.text
          fill="#F1B143"
          fontWeight="bold"
          style={{
            fontSize: theme.typography.caption.fontSize,
            opacity: textOpacity,
          }}
        >
          <textPath
            href="#groundwaterPumpingTextPath"
            startOffset="35%"
            textAnchor="middle"
          >
            The pumping below
          </textPath>
        </motion.text>
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
              "Groundwater losses estimated with Central Valley Hydrological Model, simplified for presentation. Source: "
            }
            <a
              href="https://doi.org/10.1038/s41467-022-35582-x"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              {"Liu et al., 2022"}
            </a>
          </Typography>
        </Box>
        <Box width="100%" height="50%">
          <GroundwaterLine scrollProgress={scrollYProgress} />
        </Box>
      </Box>
    </StickyContainer>
  )
}

export default Groundwater
