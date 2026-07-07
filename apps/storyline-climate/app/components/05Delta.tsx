"use client"

import { ImageCaption, Paragraph, SectionTitle } from "@repo/ui"
import { Box, LibraryBooksIcon, Stack, useTheme } from "@repo/ui/mui"
import type { SxProps, Theme } from "@repo/ui/mui"
import { FreshWaterColor } from "./helpers/colorPalette"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { motion } from "@repo/motion"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"

const deltaSeaLevelIntro = [
  {
    text: "You may be aware that climate change melts polar ice, raising sea levels worldwide.",
  },
  { text: "But do you know how this will affect California?" },
]

const deltaLocation = [
  {
    segments: [
      {
        text: "One of the most vulnerable places to rising sea levels is the Delta, where two of the state's largest rivers \u2014 ",
      },
      { text: "the Sacramento and San Joaquin", mark: "freshWater" },
      { text: " \u2014 meet the San Francisco Bay." },
    ],
  },
]

const deltaUses = [
  { text: "This area is home to many small communities and farms." },
  {
    text: "It is also where huge pumps move freshwater south of the Delta to supply large farms in the San Joaquin Valley and cities in Southern California.",
  },
]

const deltaSalinity = [
  {
    text: "As sea levels rise, salty ocean water can extend further into the Delta, limiting freshwater supplies for in-Delta uses and water exports.",
  },
]

const deltaAdaptation = [
  {
    text: "People are exploring ways to manage salinity in the Delta under future droughts and sea level rise.",
  },
  <>
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
    <LibraryBooksIcon sx={{ verticalAlign: "middle" }} /> is a research project
    that examines a wide range of adaptation strategies for addressing salinity
    intrusion in the Delta.
  </>,
]

const deltaTextOverlaySx = {
  width: "fit-content",
  maxWidth: { xs: "calc(100% - 2rem)", md: "70rem", xl: "86rem" },
  px: { xs: 2.25, md: 3, xl: 3.5 },
  py: { xs: 2.25, md: 2.75, xl: 3.25 },
  borderRadius: "8px",
  border: "1px solid rgba(252, 251, 250, 0.16)",
  backgroundColor: "rgba(25, 61, 107, 0.58)",
  boxShadow: "0 18px 56px rgba(0, 0, 0, 0.18)",
  backdropFilter: "blur(3px)",
  color: "#FCFBFA",
  textShadow: "none",
} satisfies SxProps<Theme>

export default function DeltaFarms() {
  return (
    <StickyScrollSection
      id="deltaFarms"
      ariaLabel="Rising seas, rising risks"
      height="200vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <DeltaFarmsContent />
    </StickyScrollSection>
  )
}

function DeltaFarmsContent() {
  const progress = useScrollProgress()
  const linePathLength = useScrollValue(progress, [0.6, 0.9], [0, 1])
  const lineOpacity = useScrollValue(progress, [0.55, 0.7], [0, 1])
  const panelOpacity = useScrollValue(progress, [0.14, 0.28], [0, 1])
  const titleOpacity = useScrollValue(progress, [0.18, 0.32], [0, 1])
  const paragraphOneOpacity = useScrollValue(progress, [0.28, 0.42], [0, 1])
  const paragraphTwoOpacity = useScrollValue(progress, [0.38, 0.54], [0, 1])
  const paragraphThreeOpacity = useScrollValue(progress, [0.48, 0.64], [0, 1])

  return (
    <>
      <ImageCaption
        placement="bottom-left"
        offset={30}
        lines={[
          "Aerial view of farmland and waterways in Sacramento-San Joaquin Delta, California",
          "Source: DWR Gallery, photo by Paul Hames",
        ]}
        sx={{ bottom: "5rem", backgroundColor: "rgba(33, 33, 33, 0.58)" }}
      />
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
        width="100%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          paddingTop: "5rem",
        }}
      >
        <motion.div style={{ opacity: panelOpacity }}>
          <Box
            className="paragraph"
            component="article"
            sx={deltaTextOverlaySx}
          >
            <Stack direction="column" spacing={{ xs: 2, md: 2.25 }}>
              <motion.div style={{ opacity: titleOpacity }}>
                <SectionTitle text="Rising seas, rising risks" />
              </motion.div>
              <motion.div style={{ opacity: paragraphOneOpacity }}>
                <Paragraph blocks={deltaSeaLevelIntro} />
              </motion.div>
              <motion.div style={{ opacity: paragraphTwoOpacity }}>
                <Paragraph
                  blocks={deltaLocation}
                  markSx={{
                    freshWater: { fontWeight: "bold", color: FreshWaterColor },
                  }}
                />
              </motion.div>
              <motion.div style={{ opacity: paragraphThreeOpacity }}>
                <Paragraph blocks={deltaUses} />
              </motion.div>
            </Stack>
          </Box>
        </motion.div>
      </Box>
    </>
  )
}

export function DeltaAqueduct() {
  return (
    <StickyScrollSection
      id="deltaAqueduct"
      ariaLabel="Delta salinity and adaptation"
      height="200vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <DeltaAqueductContent />
    </StickyScrollSection>
  )
}

function DeltaAqueductContent() {
  const theme = useTheme()
  const progress = useScrollProgress()
  const linePathLength = useScrollValue(progress, [0.6, 0.9], [0, 1])
  const lineOpacity = useScrollValue(progress, [0.55, 0.7], [0, 1])
  const panelOpacity = useScrollValue(progress, [0.2, 0.36], [0, 1])
  const paragraphOneOpacity = useScrollValue(progress, [0.24, 0.42], [0, 1])
  const paragraphTwoOpacity = useScrollValue(progress, [0.38, 0.56], [0, 1])

  return (
    <>
      <ImageCaption
        placement="bottom-left"
        offset={30}
        lines={[
          "California Aqueduct near Crows Landing, Stanislaus County, California",
          "Source: DWR Gallery, photo by Nick Shockey",
        ]}
        sx={{ bottom: "5rem", backgroundColor: "rgba(33, 33, 33, 0.58)" }}
      />
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
        }}
      >
        <motion.div style={{ opacity: panelOpacity }}>
          <Box
            className="paragraph"
            component="article"
            sx={{
              ...deltaTextOverlaySx,
              maxWidth: { xs: "calc(100% - 2rem)", md: "54rem", xl: "62rem" },
            }}
          >
            <Stack direction="column" spacing={{ xs: 2, md: 2.25 }}>
              <motion.div style={{ opacity: paragraphOneOpacity }}>
                <Paragraph blocks={deltaSalinity} />
              </motion.div>
              <motion.div style={{ opacity: paragraphTwoOpacity }}>
                <Paragraph
                  blocks={deltaAdaptation}
                  sx={{
                    "& .MuiSvgIcon-root": {
                      fontSize: theme.typography.body1.fontSize,
                    },
                  }}
                />
              </motion.div>
            </Stack>
          </Box>
        </motion.div>
      </Box>
    </>
  )
}
