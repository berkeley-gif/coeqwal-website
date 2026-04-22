"use client"

import { Box, LibraryBooksIcon, Typography, useTheme } from "@repo/ui/mui"
import { useRef } from "react"
import StickyContainer from "./helpers/StickyContainer"
import { FreshWaterColor } from "./helpers/colorPalette"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { motion, useScroll, useTransform } from "@repo/motion"

export default function DeltaFarms() {
  const sectionRef = useRef(null)
  const theme = useTheme()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePathLength = useTransform(scrollYProgress, [0.6, 0.9], [0, 1])
  const lineOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1])

  return (
    <StickyContainer
      sectionID="deltaFarms"
      stickyRollHeight="100vh"
      sectionRef={sectionRef}
    >
      <Box
        width="100%"
        height="100%"
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: 'url("/images/delta-background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <SVGLineContainer
        viewBox=" 20 0 1925 1080"
        preserveAspectRatio="none"
        zIndex={1}
      >
        <motion.path
          className="svg-line"
          d="M2 0V590C2 590 254 579.999 392 590C530 600.001 682 608 758 614C834 620 906 668 964 680C1022 692 1124 680 1188 708C1252 736 586 802 392 848C198 894 498 930 732 918C966 906 1204 806 1442 848C1680 890 1402 1024 1766 992C2130 960 1766 1116 1766 1116"
          style={{ pathLength: linePathLength, opacity: lineOpacity }}
        />
      </SVGLineContainer>

      <Box
        className="text-section"
        width="65%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          paddingTop: "5rem",
          textShadow: theme.textShadow.displayBody,
        }}
      >
        <Box className="paragraph" component="article">
          <Typography variant="h3">{"Rising seas, rising risks"}</Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "You may be aware that climate change melts polar ice, raising sea levels worldwide."
            }
          </Typography>
          <Typography variant="body1">
            {"But do you know how this will affect California? "}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            One of the most vulnerable places to rising sea levels is the Delta,
            where two of the state&apos;s largest rivers {"\u2014"}{" "}
            <span style={{ fontWeight: "bold", color: FreshWaterColor }}>
              the Sacramento and San Joaquin
            </span>{" "}
            {"\u2014"} meet the San Francisco Bay.{" "}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"This area is home to many small communities and farms."}
          </Typography>
          <Typography variant="body1">
            {
              "It is also where huge pumps move freshwater south to the Delta to supply large farms in the San Joaquin Valley and cities in Southern California."
            }
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}

export function DeltaAqueduct() {
  const sectionRef = useRef(null)
  const theme = useTheme()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePathLength = useTransform(scrollYProgress, [0.6, 0.9], [0, 1])
  const lineOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1])

  return (
    <StickyContainer
      sectionID="deltaAqueduct"
      stickyRollHeight="100vh"
      sectionRef={sectionRef}
    >
      <Box
        width="100%"
        height="100%"
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: 'url("/images/delta-ca-aqueduct-background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <SVGLineContainer
        viewBox="20 0 1751 1113"
        preserveAspectRatio="none"
        zIndex={1}
      >
        <motion.path
          className="svg-line"
          d="M2 0V472C2 472 163 429 188 452C213 475 381 511.2 369 518C357 524.8 326 523 326 536C326 549 531 558 512 573C493 588 427 578 412 592C397 606 547 602 563 616C579 630 480 638 382 662C284 686 180 690 188 724C196 758 388 791 480 797C572 803 682 835 774 873C866 911 1088 1110 1126 1138C1164 1166 1750 1138 1750 1138"
          style={{ pathLength: linePathLength, opacity: lineOpacity }}
        />
      </SVGLineContainer>
      <Box
        className="text-section"
        width="65%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          paddingTop: "5rem",
          color: "text.primary",
        }}
      >
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "As sea levels rise, salty ocean water can extend further into the Delta."
            }
          </Typography>
          <Typography variant="body1">
            {
              "Increasing salinity threatens local communities and farms that rely on fresh water flowing through the Delta."
            }
          </Typography>
          <Typography variant="body1">
            {
              "It also puts water exports to San Joaquin Valley and Southern California at risk."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "People are looking for ways to manage salinity in the Delta, which is becoming more difficult as the climate changes."
            }
          </Typography>
          <Typography variant="body1">
            For example,{" "}
            <strong>
              <a
                href="https://delta-just-transitions-ucdavis.hub.arcgis.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                Just Transitions in the Delta
              </a>
            </strong>{" "}
            <LibraryBooksIcon
              sx={{
                fontSize: theme.typography.body1.fontSize,
                verticalAlign: "middle",
              }}
            />{" "}
            {
              " is a research project exploring a wide range of adaptation strategies to address salinity intrusion in the Delta"
            }
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}
