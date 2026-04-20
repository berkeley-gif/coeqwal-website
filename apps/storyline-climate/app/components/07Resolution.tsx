"use client"

import {
  Box,
  LibraryBooksIcon,
  Stack,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "@repo/motion"
import HydroClimateContainer from "./vis/HydroClimate"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"

export function Hydroclimate() {
  const sectionRef = useRef(null)

  return (
    <StickyContainer
      sectionID="hydroclimate"
      stickyRollHeight="150vh"
      sectionRef={sectionRef}
    >
      <Box
        width="100%"
        height="100%"
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          className="text-section"
          width="100%"
          height="35%"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            paddingTop: "5rem",
            pointerEvents: "auto",
          }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {"COEQWAL: Planning for the future"}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography
              variant="body1"
              style={{ fontWeight: "bold" }}
              gutterBottom
            >
              {"This is where COEQWAL comes in."}
            </Typography>
            <Typography variant="body1">
              {
                "Using a water planning model called CalSim, COEQWAL helps us understand how climate change might affect California's water system."
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"COEQWAL studies five plausible future "}
              <span style={{ fontWeight: "bold" }}>{"hydroclimates"}</span>
              {
                " \u2014 specific changes in temperatures, precipitation, and streamflow."
              }
            </Typography>
            <Typography variant="body1">
              {
                "Some hydroclimates involve moderate changes that our water storage and delivery system can accommodate. "
              }
            </Typography>
            <Typography variant="body1">
              {
                "But other hydroclimates represent much greater changes in climate, including significant reductions in precipitation and streamflow."
              }
            </Typography>
          </Box>
        </Box>

        <Box
          className="text-section"
          width="100%"
          height="65%"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            pointerEvents: "auto",
          }}
        >
          <Box component="article">
            <Typography variant="h5">
              {"Streamflow Changes under Different Hydroclimates"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {
                "Changes in adjusted historical records (1922–2021) of precipitation totals, mean temperatures, and mean streamflow relative to the actual historical record, shown for each month of the water year by hydroclimate."
              }
            </Typography>
          </Box>
          <Box
            className="container-center-horizontal"
            width="100%"
            height="100%"
          >
            <HydroClimateContainer />
          </Box>
        </Box>
      </Box>
    </StickyContainer>
  )
}

type SvgMultilineLabelProps = {
  x: number
  y: number
  title: string
  lines: string[]
  fontSize?: string | number
  fill: string
  textAnchor?: "start" | "middle" | "end"
}

function SvgMultilineLabel({
  x,
  y,
  title,
  lines,
  fontSize,
  fill,
  textAnchor = "start",
}: SvgMultilineLabelProps) {
  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        style={{
          fontSize: fontSize ?? 16,
          fill,
          fontWeight: "bold",
        }}
        dy="-1.75em"
      >
        {title}
      </text>
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        style={{
          fontSize: fontSize ?? 16,
          fill,
        }}
      >
        {lines.map((line, idx) => (
          <tspan
            key={`${title}-${idx}`}
            x={x}
            textAnchor={textAnchor}
            dy={idx === 0 ? "0em" : "1.25em"}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

export function Themes() {
  const theme = useTheme()
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const themeCircles = [
    {
      id: "community",
      cx: 153,
      cy: 429,
      r: 73,
    },
    {
      id: "groundwater",
      cx: 282,
      cy: 909,
      r: 73,
    },
    {
      id: "salmon",
      cx: 924,
      cy: 1220,
      r: 73,
    },
    {
      id: "delta",
      cx: 1364,
      cy: 1683,
      r: 73,
    },
    {
      id: "operations",
      cx: 1586,
      cy: 655,
      r: 73,
    },
  ]

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  })

  useEffect(() => {
    scrollYProgress.on("change", (latest) => {
      console.log(latest)
    })
  }, [scrollYProgress])

  const communityLineProgress = useTransform(
    scrollYProgress,
    [0.0, 0.3],
    [0, 1],
  )
  const communityLineOpacity = useTransform(scrollYProgress, [0.0, 0.3], [0, 1])
  const communityNodeOpacity = useTransform(
    scrollYProgress,
    [0.16, 0.24],
    [0, 1],
  )
  const communityNodeScale = useTransform(
    scrollYProgress,
    [0.16, 0.24],
    [0.94, 1],
  )
  const communityLabelOpacity = useTransform(
    scrollYProgress,
    [0.22, 0.3],
    [0, 1],
  )
  const communityLabelY = useTransform(scrollYProgress, [0.22, 0.3], [14, 0])

  const operationsLineProgress = useTransform(
    scrollYProgress,
    [0.1, 0.2],
    [0, 1],
  )
  const operationsLineOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.16],
    [0, 1],
  )
  const operationsNodeOpacity = useTransform(
    scrollYProgress,
    [0.18, 0.26],
    [0, 1],
  )
  const operationsNodeScale = useTransform(
    scrollYProgress,
    [0.18, 0.26],
    [0.94, 1],
  )
  const operationsLabelOpacity = useTransform(
    scrollYProgress,
    [0.24, 0.32],
    [0, 1],
  )
  const operationsLabelY = useTransform(scrollYProgress, [0.24, 0.32], [12, 0])

  const groundwaterLineProgress = useTransform(
    scrollYProgress,
    [0.34, 0.44],
    [0, 1],
  )
  const groundwaterLineOpacity = useTransform(
    scrollYProgress,
    [0.34, 0.4],
    [0, 1],
  )
  const groundwaterNodeOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.5],
    [0, 1],
  )
  const groundwaterNodeScale = useTransform(
    scrollYProgress,
    [0.42, 0.5],
    [0.94, 1],
  )
  const groundwaterLabelOpacity = useTransform(
    scrollYProgress,
    [0.48, 0.56],
    [0, 1],
  )
  const groundwaterLabelY = useTransform(scrollYProgress, [0.48, 0.56], [12, 0])

  const salmonLineProgress = useTransform(scrollYProgress, [0.52, 0.62], [0, 1])
  const salmonLineOpacity = useTransform(scrollYProgress, [0.52, 0.58], [0, 1])
  const salmonNodeOpacity = useTransform(scrollYProgress, [0.6, 0.68], [0, 1])
  const salmonNodeScale = useTransform(scrollYProgress, [0.6, 0.68], [0.94, 1])
  const salmonLabelOpacity = useTransform(scrollYProgress, [0.66, 0.74], [0, 1])
  const salmonLabelY = useTransform(scrollYProgress, [0.66, 0.74], [12, 0])

  const deltaLineProgress = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])
  const deltaLineOpacity = useTransform(scrollYProgress, [0.7, 0.76], [0, 1])
  const deltaNodeOpacity = useTransform(scrollYProgress, [0.78, 0.86], [0, 1])
  const deltaNodeScale = useTransform(scrollYProgress, [0.78, 0.86], [0.94, 1])
  const deltaLabelOpacity = useTransform(scrollYProgress, [0.84, 0.92], [0, 1])
  const deltaLabelY = useTransform(scrollYProgress, [0.84, 0.92], [12, 0])

  return (
    <Box
      ref={sectionRef}
      width="100%"
      height="200vh"
      sx={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(180deg, #172a48 10%, ${theme.palette.brand.water} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <SVGLineContainer viewBox="0 0 1728 2129">
          <defs>
            {themeCircles.map((circle) => (
              <clipPath key={`clip-${circle.id}`} id={`clip-${circle.id}`}>
                <circle cx={circle.cx} cy={circle.cy} r={circle.r} />
              </clipPath>
            ))}
          </defs>

          <motion.g id="community">
            <motion.path
              className="svg-line"
              d="M975 -25C975 -25 863 41 409 255C-45 469 95 685 -5 915C-105 1145 -277 1145 -277 1145"
              style={{
                opacity: communityLineOpacity,
                pathLength: communityLineProgress,
              }}
            />
            <motion.g
              style={{
                opacity: communityNodeOpacity,
                scale: communityNodeScale,
              }}
            >
              <image
                x={153 - 73}
                y={429 - 73}
                width={146}
                height={146}
                href="/images/themes/community.png"
                clipPath="url(#clip-community)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx="153" cy="429" r="73" className="svg-line" />
            </motion.g>
            <motion.g
              style={{ opacity: communityLabelOpacity, y: communityLabelY }}
            >
              <SvgMultilineLabel
                x={248}
                y={438}
                title="Community water systems"
                lines={[
                  "Whether people and communities",
                  "can reliably access safe drinking water",
                  "for daily life, health, and essential services",
                ]}
                fontSize={theme.typography.body1.fontSize}
                fill={theme.palette.common.white}
              />
            </motion.g>
          </motion.g>

          <motion.g id="groundwater">
            <motion.path
              className="svg-line"
              d="M1115 -25C1115 -25 693 589 439 723C185 857 329 1133 141 1425C-47 1717 -377 1515 -377 1515"
              style={{
                opacity: groundwaterLineOpacity,
                pathLength: groundwaterLineProgress,
              }}
            />
          </motion.g>

          <motion.g id="salmon">
            <motion.path
              className="svg-line"
              d="M1205 -47C1205 -47 895 567 853 867C811 1167 1115 1175 797 1507C479 1839 989 2099 1231 2007C1473 1915 2069 2127 2069 2127"
              style={{
                opacity: salmonLineOpacity,
                pathLength: salmonLineProgress,
              }}
            />
            <motion.g
              style={{ opacity: salmonNodeOpacity, scale: salmonNodeScale }}
            >
              <image
                x={924 - 73}
                y={1220 - 73}
                width={146}
                height={146}
                href="/images/themes/salmon.png"
                clipPath="url(#clip-salmon)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx="924" cy="1220" r="73" className="svg-line" />
            </motion.g>
            <motion.g style={{ opacity: salmonLabelOpacity, y: salmonLabelY }}>
              <SvgMultilineLabel
                x={829}
                y={1229}
                title="Rivers, salmon, and the Delta ecosystem"
                lines={[
                  "Whether rivers, salmon, and the Delta estuary ",
                  "receive the flows they need to remain functional and resilient",
                ]}
                fontSize={theme.typography.body1.fontSize}
                fill={theme.palette.common.white}
                textAnchor="end"
              />
            </motion.g>
          </motion.g>

          <motion.g id="delta">
            <motion.path
              className="svg-line"
              d="M1337 -35C1329 -27 1041 653 1171 1037C1301 1421 1453 1331 1361 1603C1269 1875 1993 1791 1993 1791"
              style={{
                opacity: deltaLineOpacity,
                pathLength: deltaLineProgress,
              }}
            />
          </motion.g>

          <motion.g id="operations">
            <motion.path
              className="svg-line"
              d="M1421 -47C1421 -47 1733 447 1511 961C1289 1475 2051 1485 2051 1485"
              style={{
                opacity: operationsLineOpacity,
                pathLength: operationsLineProgress,
              }}
            />
            <motion.g
              style={{
                opacity: operationsNodeOpacity,
                scale: operationsNodeScale,
              }}
            >
              <image
                x={1586 - 73}
                y={655 - 73}
                width={146}
                height={146}
                href="/images/themes/operations.png"
                clipPath="url(#clip-operations)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx="1586" cy="655" r="73" className="svg-line" />
            </motion.g>
            <motion.g
              style={{ opacity: operationsLabelOpacity, y: operationsLabelY }}
            >
              <SvgMultilineLabel
                x={1491}
                y={664}
                title="Operations and impacts"
                lines={[
                  "How water management decisions",
                  "affect trade-offs, equity, and resilience",
                ]}
                fontSize={theme.typography.body1.fontSize}
                fill={theme.palette.common.white}
                textAnchor="end"
              />
            </motion.g>
          </motion.g>

          <motion.g id="groundwater-top">
            <motion.g
              style={{
                opacity: groundwaterNodeOpacity,
                scale: groundwaterNodeScale,
              }}
            >
              <image
                x={282 - 73}
                y={909 - 73}
                width={146}
                height={146}
                href="/images/themes/farm.png"
                clipPath="url(#clip-groundwater)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx="282" cy="909" r="73" className="svg-line" />
            </motion.g>
            <motion.g
              style={{ opacity: groundwaterLabelOpacity, y: groundwaterLabelY }}
            >
              <SvgMultilineLabel
                x={377}
                y={918}
                title="Farms and groundwater"
                lines={[
                  "Whether agricultural water deliveries ",
                  "can sustain food protection, ",
                  "while preventing over-draft of groundwater basins",
                ]}
                fontSize={theme.typography.body1.fontSize}
                fill={theme.palette.common.white}
              />
            </motion.g>
          </motion.g>

          <motion.g id="delta-top">
            <motion.g
              style={{ opacity: deltaNodeOpacity, scale: deltaNodeScale }}
            >
              <image
                x={1364 - 73}
                y={1683 - 73}
                width={146}
                height={146}
                href="/images/themes/delta.png"
                clipPath="url(#clip-delta)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle cx="1364" cy="1683" r="73" className="svg-line" />
            </motion.g>
            <motion.g style={{ opacity: deltaLabelOpacity, y: deltaLabelY }}>
              <SvgMultilineLabel
                x={1269}
                y={1692}
                title="The Delta as a living place"
                lines={[
                  "Whether the Delta is a place ",
                  "where communities, farms, and ecosystems coexist and thrive",
                ]}
                fontSize={theme.typography.body1.fontSize}
                fill={theme.palette.common.white}
                textAnchor="end"
              />
            </motion.g>
          </motion.g>
        </SVGLineContainer>
      </Box>
    </Box>
  )
}

export function Conclusion() {
  const theme = useTheme()

  return (
    <Box
      width="100%"
      height="100vh"
      sx={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layer 1: Gradient background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `linear-gradient(to bottom, ${theme.palette.brand.water}, ${theme.palette.brand.panelLight})`,
        }}
      />

      {/* Layer 2: Background image */}
      <motion.img
        src="/images/2025_08_28_KJ_3517_Delta_Aerials.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "auto",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          px: theme.space.panel.padding,
          pt: theme.space.panel.topOffset,
          pb: theme.space.panel.padding,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          height: "100%",
          boxSizing: "border-box",
          alignItems: "center",
          width: "100%",
          pointerEvents: "auto",
          color: theme.palette.text.primary,
        }}
      >
        <Stack spacing={2} direction="column" alignItems="center">
          <Box width="100%" className="paragraph" component="article">
            <Typography variant="body1">{"In the years ahead,"}</Typography>
            <Typography variant="body1">
              {
                "California will keep getting hotter, with more severe droughts, less snowpack in the mountains, and higher sea levels."
              }
            </Typography>
            <Typography variant="body1">
              {"This will change "}
              <span style={{ fontWeight: "bold" }}>
                {"when and how much water we have"}
              </span>
              {" to allocate to different uses."}
            </Typography>
          </Box>
          <Box width="100%" className="paragraph" component="article">
            <Typography variant="body1">
              {
                "By exploring different scenarios about the future of water in California, "
              }
            </Typography>
            <Typography variant="body1">
              {
                "we can better plan for the challenges ahead and search for solutions that work for everyone."
              }
            </Typography>
          </Box>
          <Box width="100%" className="paragraph" component="article">
            <Typography variant="body1">
              {
                "Are you curious about how these scenarios will affect your specific water needs? "
              }
            </Typography>
            <Typography variant="body1">
              {"You can start "}
              <strong>
                <a
                  href="https://dev.coeqwal.org/?tab=explore"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  explore specific scenarios
                </a>
              </strong>{" "}
              <LibraryBooksIcon
                sx={{
                  fontSize: theme.typography.body1.fontSize,
                  verticalAlign: "middle",
                }}
              />
              {
                " and think about how you can help California adapt to our changing climate."
              }
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
