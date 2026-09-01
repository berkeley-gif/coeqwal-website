"use client"

import {
  Box,
  LibraryBooksIcon,
  Stack,
  useTheme,
  type Theme,
} from "@repo/ui/mui"
import { Paragraph, SectionTitle, Visualization, getExploreUrl } from "@repo/ui"
import { useRef } from "react"
import { motion, useScroll, useTransform } from "@repo/motion"
import HydroClimateContainer from "./vis/HydroClimate"
import SVGLineContainer from "./helpers/SVGLineContainer"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"

const coeqwalIntro = [
  {
    text: "Using a water planning model called CalSim, COEQWAL helps us understand how the actions we take could affect California's communities, farms, and ecosystems under current and future climates.",
  },
]

const hydroclimateDescription = [
  {
    segments: [
      {
        text: "COEQWAL explores the effects of climate change on California's water system by evaluating four alternative ",
      },
      { text: "hydroclimates", mark: "strong" },
      {
        text: " - specific changes in temperature, precipitation, and streamflow from historical climate conditions - that we may experience by the middle of the century.",
      },
    ],
  },
  {
    segments: [
      { text: "These hydroclimates represent " },
      { text: "different levels of risk to our water system", mark: "yellow" },
      {
        text: ' that we should be prepared for. For example, a "moderate stress" hydroclimate future represents a change in conditions that are likely to occur, while the "extreme stress" hydroclimate future is less likely, but possible.',
      },
    ],
  },
]

const hydroclimateTransitionTitle = [
  { text: "While we can't control the climate, we can " },
  { text: "take actions", mark: "yellowStrong" },
  { text: " to limit the impacts of climate change." },
]

const hydroclimateTransitionText = [
  [
    { text: "COEQWAL explores " },
    { text: "different strategies for managing water.", mark: "strong" },
  ],
]

const hydroclimateContentMaxWidth = {
  xs: "100%",
  md: "64rem",
  lg: "78rem",
  xl: "112rem",
} as const

const hydroclimateChartHeight = {
  xs: "20rem",
  md: "24rem",
  lg: "31rem",
  xl: "34rem",
} as const

const conclusionOpening = [
  {
    segments: [
      {
        text: "In the years ahead,\nCalifornia's climate will continue to change. ",
      },
      { text: "How we manage water must also change.", mark: "strong" },
    ],
  },
]

const conclusionScenarios = [
  {
    text: "By exploring different scenarios for California's water future, we can evaluate options and identify solutions that will allow us to thrive.",
  },
]

const conclusionLink = [
  <>
    Are you curious about how these scenarios might affect you?
    <br />
    You can start{" "}
    <strong>
      <a
        href={getExploreUrl()}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "inherit", textDecoration: "underline" }}
      >
        exploring scenarios
      </a>
    </strong>{" "}
    <LibraryBooksIcon sx={{ verticalAlign: "middle" }} /> and consider how you
    can chart a pathway to a water future that benefits all.
  </>,
]

export function CoeqwalCallout() {
  return (
    <Box
      id="coeqwal-callout"
      className="container-center"
      minHeight="75vh"
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#172a48",
        color: "common.white",
        px: { xs: 3, md: 8 },
      }}
    >
      <SVGLineContainer viewBox="0 0 1728 720" preserveAspectRatio="none">
        <motion.path
          className="svg-line glow-effect"
          d="M-32 354C242 165 496 474 762 296C1028 118 1215 194 1395 292C1575 390 1746 327 1772 312"
          pathLength={1}
          style={{ opacity: 0.65 }}
        />
      </SVGLineContainer>
      <Box
        className="paragraph"
        component="article"
        sx={{ position: "relative", zIndex: 1, textShadow: "0 2px 18px #000" }}
      >
        <SectionTitle
          variant="h1"
          text={[
            { text: "This is where " },
            { text: "COEQWAL", mark: "highlight" },
            { text: " comes in." },
          ]}
        />
      </Box>
    </Box>
  )
}

export function Hydroclimate() {
  return (
    <StickyScrollSection
      id="hydroclimate"
      ariaLabel="COEQWAL planning hydroclimates"
      height="200vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <HydroclimateContent />
    </StickyScrollSection>
  )
}

function HydroclimateContent() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.12, 0.28], [0, 1])
  const paragraphOneOpacity = useScrollValue(progress, [0.22, 0.38], [0, 1])
  const paragraphTwoOpacity = useScrollValue(progress, [0.32, 0.5], [0, 1])

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: "3rem", md: "3.5rem", lg: "4rem" },
        "@media (min-width: 750px) and (max-width: 1399.95px)": {
          pt: "3.5rem",
          pb: "0.75rem",
        },
      }}
    >
      <Box
        className="text-section"
        sx={{
          position: "relative",
          width: "100%",
          boxSizing: "border-box",
          pointerEvents: "auto",
          "@media (min-width: 750px) and (max-width: 1399.95px)": {
            display: "grid",
            gridTemplateColumns: "minmax(0, 46%) minmax(0, 54%)",
            columnGap: "1.5rem",
            alignItems: "center",
          },
        }}
      >
        <Stack
          direction="column"
          sx={{
            width: "100%",
            maxWidth: hydroclimateContentMaxWidth,
            textAlign: "left",
            gap: { xs: 1, md: 1, lg: 2 },
            "@media (min-width: 750px) and (max-width: 1399.95px)": {
              gridColumn: 1,
            },
          }}
        >
          <motion.div style={{ opacity: titleOpacity }}>
            <Box className="paragraph" component="article">
              <SectionTitle
                variant="h4"
                text="COEQWAL: Planning for the future"
              />
            </Box>
          </motion.div>
          <motion.div
            style={{ opacity: paragraphOneOpacity, maxWidth: "73ch" }}
          >
            <Box className="paragraph" component="article">
              <Paragraph blocks={coeqwalIntro} />
            </Box>
          </motion.div>
          <motion.div style={{ opacity: paragraphTwoOpacity }}>
            <Box className="paragraph" component="article">
              <Paragraph
                blocks={hydroclimateDescription}
                markSx={{
                  yellow: {
                    color: "#ffb347",
                    fontWeight: "inherit",
                  },
                }}
              />
            </Box>
          </motion.div>
        </Stack>

        <Visualization
          title="Streamflow Changes under Different Hydroclimates"
          caption="Changes in total average streamflow by month for each hydroclimate based on the period 1922 - 2021."
          sx={{
            width: "100%",
            "@media (min-width: 750px) and (max-width: 1399.95px)": {
              gridColumn: 2,
              gridRow: 1,
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: hydroclimateChartHeight,
              display: "flex",
              justifyContent: "flex-start",
              "@media (min-width: 750px) and (max-width: 1399.95px)": {
                height: "24rem",
              },
            }}
          >
            <HydroClimateContainer />
          </Box>
        </Visualization>
      </Box>
    </Box>
  )
}

export function HydroclimateTransition() {
  return (
    <StickyScrollSection
      id="hydroclimateTransition"
      ariaLabel="COEQWAL water management strategies"
      height="190vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <HydroclimateTransitionContent />
    </StickyScrollSection>
  )
}

function HydroclimateTransitionContent() {
  const progress = useScrollProgress()
  const headingOpacity = useScrollValue(progress, [0.2, 0.45], [0, 1])
  const paragraphOpacity = useScrollValue(progress, [0.34, 0.58], [0, 1])
  const linePath = useScrollValue(progress, [0.5, 0.9], [0, 1])
  const linePathTwo = useScrollValue(progress, [0.6, 0.95], [0, 1])
  const linePathThree = useScrollValue(progress, [0.7, 1], [0, 1])

  return (
    <>
      <SVGLineContainer viewBox="0 0 1728 1117" preserveAspectRatio="none">
        <path d="M1728 0H0" fill="none" stroke="none" />
        <g style={{ opacity: 0.7 }}>
          <motion.path
            className="svg-line"
            pathLength={linePath}
            d="M1471 -2C1471 -2 1583 176 1371 350C1159 524 1255 968 915 1124"
          />
          <motion.path
            className="svg-line"
            pathLength={linePathTwo}
            d="M1472 -3C1472 -3 1584 175 1372 349C1303.46 405.256 1267 490 1267 678C1267 866 1183.32 1008.99 1094 1122"
          />
          <motion.path
            className="svg-line"
            pathLength={linePathThree}
            d="M1472 -3C1472 -3 1584 175 1372 349C1303.45 405.256 1262 502 1297 711C1332 920 1267 933 1177 1126"
          />
          <motion.path
            className="svg-line"
            pathLength={linePathTwo}
            d="M1472 -3C1472 -3 1584 175 1372 349C1303.45 405.256 1283 559 1359 710C1435 861 1404 940 1314 1133"
          />
          <motion.path
            className="svg-line"
            pathLength={linePath}
            d="M1472 -3C1472 -3 1584 175 1372 349C1303.45 405.256 1294 596 1437 754C1580 912 1391 1025 1452 1126"
          />
        </g>
      </SVGLineContainer>

      <Box
        width="100%"
        height="100%"
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <Box
          className="paragraph"
          component="article"
          sx={{
            position: "relative",
            p: { xs: 2, md: 4 },
            textAlign: "center",
            "& .MuiTypography-root": {
              textAlign: "center",
            },
          }}
        >
          <motion.div style={{ opacity: headingOpacity }}>
            <SectionTitle
              text={hydroclimateTransitionTitle}
              markSx={{
                yellowStrong: {
                  color: "#ffb347",
                  fontWeight: "bold",
                },
              }}
            />
          </motion.div>
          <motion.div style={{ opacity: paragraphOpacity }}>
            <Paragraph variant="h3" blocks={hydroclimateTransitionText} />
          </motion.div>
        </Box>
      </Box>
    </>
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
    layoutEffect: false,
  })

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
    [0.3, 0.5],
    [0, 1],
  )

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

  const salmonLineProgress = useTransform(scrollYProgress, [0.52, 0.62], [0, 1])
  const salmonLineOpacity = useTransform(scrollYProgress, [0.52, 0.58], [0, 1])
  const salmonNodeOpacity = useTransform(scrollYProgress, [0.6, 0.68], [0, 1])
  const salmonNodeScale = useTransform(scrollYProgress, [0.6, 0.68], [0.94, 1])
  const salmonLabelOpacity = useTransform(scrollYProgress, [0.66, 0.74], [0, 1])

  const deltaLineProgress = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])
  const deltaLineOpacity = useTransform(scrollYProgress, [0.7, 0.76], [0, 1])
  const deltaNodeOpacity = useTransform(scrollYProgress, [0.78, 0.86], [0, 1])
  const deltaNodeScale = useTransform(scrollYProgress, [0.78, 0.86], [0.94, 1])
  const deltaLabelOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1])

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
          </motion.g>
        </SVGLineContainer>
      </Box>

      {/* Layer 2.5: Text labels overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {/* Community label */}
        <motion.div
          style={{ opacity: communityLabelOpacity }}
          className="label-container"
        >
          <Box
            sx={{
              position: "absolute",
              left: "14.35%",
              top: "17.77%",
              pointerEvents: "auto",
              maxWidth: "400px",
              textAlign: "left",
            }}
          >
            <SectionTitle
              variant="subtitle1"
              text="Community water systems"
              sx={{
                fontWeight: "fontWeightBold",
                color: "#ffb347",
                textAlign: "left",
                width: "100%",
              }}
            />
            <Paragraph
              variant="subtitle1"
              blocks={[
                {
                  segments: [
                    { text: "Prioritizing", mark: "action" },
                    { text: " deliveries to community water systems" },
                  ],
                },
              ]}
              markSx={{
                action: {
                  color: theme.palette.common.white,
                  fontWeight: "fontWeightBold",
                },
              }}
              sx={{
                color: theme.palette.common.white,
                textAlign: "left",
              }}
            />
          </Box>
        </motion.div>

        {/* Groundwater (farms) label */}
        <motion.div
          style={{ opacity: groundwaterLabelOpacity }}
          className="label-container"
        >
          <Box
            sx={{
              position: "absolute",
              left: "21.8%",
              top: "40.1%",
              pointerEvents: "auto",
              maxWidth: "400px",
            }}
          >
            <SectionTitle
              variant="subtitle1"
              text="Farms and groundwater"
              sx={{
                fontWeight: "fontWeightBold",
                color: "#ffb347",
              }}
            />
            <Paragraph
              variant="subtitle1"
              blocks={[
                {
                  segments: [
                    { text: "Limiting", mark: "action" },
                    {
                      text: " groundwater pumping in the Central Valley to sustainable levels",
                    },
                  ],
                },
              ]}
              markSx={{
                action: {
                  color: theme.palette.common.white,
                  fontWeight: "fontWeightBold",
                },
              }}
              sx={{
                color: theme.palette.common.white,
              }}
            />
          </Box>
        </motion.div>

        {/* Salmon label */}
        <motion.div
          style={{ opacity: salmonLabelOpacity }}
          className="label-container"
        >
          <Box
            sx={{
              position: "absolute",
              right: "52%",
              top: "55%",
              pointerEvents: "auto",
              maxWidth: "400px",
              textAlign: "right",
            }}
          >
            <SectionTitle
              variant="subtitle1"
              text="Rivers, salmon, and the Delta ecosystem"
              sx={{
                fontWeight: "fontWeightBold",
                color: "#ffb347",
                textAlign: "right",
                width: "100%",
              }}
            />
            <Paragraph
              variant="subtitle1"
              blocks={[
                {
                  segments: [
                    { text: "Increasing", mark: "action" },
                    {
                      text: " Delta outflows and enhancing flows in Central Valley rivers to improve ecosystem health",
                    },
                  ],
                },
              ]}
              markSx={{
                action: {
                  color: theme.palette.common.white,
                  fontWeight: "fontWeightBold",
                },
              }}
              sx={{
                color: theme.palette.common.white,
                textAlign: "right",
              }}
            />
          </Box>
        </motion.div>

        {/* Operations label */}
        <motion.div
          style={{ opacity: operationsLabelOpacity }}
          className="label-container"
        >
          <Box
            sx={{
              position: "absolute",
              right: "13.8%",
              top: "28.8%",
              pointerEvents: "auto",
              maxWidth: "300px",
              textAlign: "right",
            }}
          >
            <SectionTitle
              variant="subtitle1"
              text="Operations and impacts"
              sx={{
                fontWeight: "fontWeightBold",
                color: "#ffb347",
              }}
            />
            <Paragraph
              variant="subtitle1"
              blocks={[
                {
                  segments: [
                    { text: "Changing", mark: "action" },
                    {
                      text: " operations to maintain freshwater conditions in the Delta",
                    },
                  ],
                },
              ]}
              markSx={{
                action: {
                  color: theme.palette.common.white,
                  fontWeight: "fontWeightBold",
                },
              }}
              sx={{
                color: theme.palette.common.white,
                textAlign: "right",
              }}
            />
          </Box>
        </motion.div>

        {/* Delta label */}
        <motion.div
          style={{ opacity: deltaLabelOpacity }}
          className="label-container"
        >
          <Box
            sx={{
              position: "absolute",
              right: "26.6%",
              top: "77%",
              pointerEvents: "auto",
              maxWidth: "300px",
              textAlign: "right",
            }}
          >
            <SectionTitle
              variant="subtitle1"
              text="Delta exports"
              sx={{
                fontWeight: "fontWeightBold",
                color: "#ffb347",
                textAlign: "right",
                width: "100%",
              }}
            />
            <Paragraph
              variant="subtitle1"
              blocks={[
                {
                  segments: [
                    { text: "Improving", mark: "action" },
                    { text: " reliability of exports from the Delta" },
                  ],
                },
              ]}
              markSx={{
                action: {
                  color: theme.palette.common.white,
                  fontWeight: "fontWeightBold",
                },
              }}
              sx={{
                color: theme.palette.common.white,
                textAlign: "right",
              }}
            />
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}

export function Conclusion() {
  const theme = useTheme()
  return (
    <StickyScrollSection
      id="conclusion"
      ariaLabel="Conclusion"
      height="210vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <ConclusionContent theme={theme} />
    </StickyScrollSection>
  )
}

function ConclusionContent({ theme }: { theme: Theme }) {
  const progress = useScrollProgress()
  const paragraphOneOpacity = useScrollValue(progress, [0.2, 0.4], [0, 1])
  const paragraphTwoOpacity = useScrollValue(progress, [0.35, 0.55], [0, 1])
  const paragraphThreeOpacity = useScrollValue(progress, [0.5, 0.7], [0, 1])
  const linePath = useScrollValue(progress, [0.5, 0.9], [0, 1])

  return (
    <>
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

      <SVGLineContainer viewBox="0 -50 1728 518" preserveAspectRatio="xMaxYMax">
        <motion.path
          className="svg-line glow-effect"
          pathLength={linePath}
          d="M0.320129 41.1494C74.3201 53.1494 178.32 133.15 332.32 51.1498C486.32 -30.8502 788.32 109.15 870.32 31.1494C952.32 -46.8515 960.322 49.1494 1160.32 115.149C1360.32 181.149 1564.32 145.149 1694.32 149.149C1824.32 153.149 1464.32 213.149 1442.32 265.149C1420.32 317.149 1486.32 359.149 1504.32 401.149C1522.32 443.149 1432.32 435.149 1408.32 471.149"
        />
      </SVGLineContainer>

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
          <motion.div style={{ opacity: paragraphOneOpacity, width: "100%" }}>
            <Box width="100%" className="paragraph" component="article">
              <Paragraph
                blocks={conclusionOpening}
                sx={{ whiteSpace: "pre-line" }}
              />
            </Box>
          </motion.div>
          <motion.div style={{ opacity: paragraphTwoOpacity, width: "100%" }}>
            <Box width="100%" className="paragraph" component="article">
              <Paragraph blocks={conclusionScenarios} />
            </Box>
          </motion.div>
          <motion.div style={{ opacity: paragraphThreeOpacity, width: "100%" }}>
            <Box width="100%" className="paragraph" component="article">
              <Paragraph
                blocks={conclusionLink}
                sx={{
                  "& .MuiSvgIcon-root": {
                    fontSize: theme.typography.body1.fontSize,
                  },
                }}
              />
            </Box>
          </motion.div>
        </Stack>
      </Box>
    </>
  )
}
