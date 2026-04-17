"use client"

import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@repo/ui/mui"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import MapContainer from "./MapContainer"
import { useEffect, useState } from "react"
import { FreshWaterColor } from "./helpers/colorPalette"
import useStoryStore from "../store"
import { useMap } from "@repo/map"
import { Tunnel, SuisanMarsh } from "./helpers/mapAnnotations"
import StickyContainer from "./helpers/StickyContainer"

function SectionDelta() {
  return (
    <>
      <Delta />
    </>
  )
}

const paragraphVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.5, ease: "easeIn" } },
}
const textHeight = "35%"

function Delta() {
  const { sectionRef } = useActiveSection("delta", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const setMapReady = useStoryStore((state) => state.setMapReady)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const setCancelTextLayer = useStoryStore((state) => state.setCancelTextLayer)

  const { setPaintProperty } = useMap()
  const [strategy, setStrategy] = useState<
    "tunnel" | "ecomachine" | "bolster" | "watershed" | "reserve"
  >("tunnel")

  const onStrategyChange = (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: "tunnel" | "ecomachine" | "bolster" | "watershed" | "reserve",
  ) => {
    setStrategy(newStrategy)
    switch (newStrategy) {
      case "tunnel":
        setPaintProperty("delta-tunnel-layer", "line-opacity", 1)
        setPaintProperty("delta-ecomachine-layer", "fill-opacity", 0)
        setTextMarkers([Tunnel], "text")
        return
      case "ecomachine":
        setPaintProperty("delta-ecomachine-layer", "fill-opacity", 1)
        setPaintProperty("delta-tunnel-layer", "line-opacity", 0)
        setTextMarkers([SuisanMarsh], "text")
        return
      default:
        setPaintProperty("delta-tunnel-layer", "line-opacity", 0)
        setPaintProperty("delta-ecomachine-layer", "fill-opacity", 0)
        setTextMarkers([], "text")
        return
    }
  }

  const [displaySection, setDisplaySection] = useState<"issue" | "adaptation">(
    "issue",
  )
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setDisplaySection(latest < 0.6 ? "issue" : "adaptation")
    setPaintProperty(
      "salinity-export-arrow-layer",
      "line-opacity",
      latest < 0.6 ? 1 : 0,
    )
    setCancelTextLayer(latest < 0.6 ? "" : "pumping")
    if (latest >= 0.6 && strategy === "tunnel") {
      setPaintProperty("delta-tunnel-layer", "line-opacity", 1)
      setTextMarkers([Tunnel], "text")
    } else {
      setPaintProperty("delta-tunnel-layer", "line-opacity", 0)
      setTextMarkers([], "text")
    }
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      console.log("latest", latest)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  return (
    <StickyContainer
      sectionID="delta"
      sectionRef={sectionRef}
      stickyRollHeight="400vh"
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          top: textHeight,
          height: "65%",
          width: "100%",
          zIndex: 0,
          pointerEvents: "none",
          marginTop: "5px",
        }}
      >
        <MapContainer
          onLoad={() => {
            setMapReady(true)
          }}
        />
        <AnimatePresence mode="wait">
          {displaySection === "adaptation" && (
            <MapControl strategy={strategy} onChange={onStrategyChange} />
          )}
        </AnimatePresence>
      </Box>
      <Box
        className="text-section"
        width="100%"
        height={textHeight}
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <AnimatePresence mode="wait">
          {displaySection === "issue" ? (
            <IssueParagraph />
          ) : (
            <AdaptationParagraph />
          )}
        </AnimatePresence>
      </Box>
    </StickyContainer>
  )
}
/*
function DeprecatedDelta() {
  const { sectionRef } = useActiveSection("delta", { amount: 0.5 })
  const setMapReady = useStoryStore((state) => state.setMapReady)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const setCancelTextLayer = useStoryStore((state) => state.setCancelTextLayer)
  const [hasSetMarkers, setHasSetMarkers] = useState(false)
  const { setPaintProperty } = useMap()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.55) {
      if (hasSetMarkers) return
      setPaintProperty("delta-tunnel-layer", "line-opacity", 1)
      setTextMarkers([Tunnel], "text")
      setPaintProperty("sac-arrow-layer", "line-opacity", 0)
      setPaintProperty("joaquin-arrow-layer", "line-opacity", 0)
      setPaintProperty("salinity-export-arrow-layer", "line-opacity", 0)
      setCancelTextLayer("pumping")
      if (!hasSetMarkers) setHasSetMarkers(true)
    } else {
      setCancelTextLayer("")
      setPaintProperty("delta-tunnel-layer", "line-opacity", 0)
      setPaintProperty("sac-arrow-layer", "line-opacity", 1)
      setPaintProperty("joaquin-arrow-layer", "line-opacity", 1)
      setPaintProperty("salinity-export-arrow-layer", "line-opacity", 1)
      setTextMarkers([], "text")
      setHasSetMarkers(false)
    }
  })

  const topIssueOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.4, 0.55],
    [0, 1, 1, 0],
  )
  const bottomIssueOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.25, 0.4, 0.55],
    [0, 1, 1, 0],
  )
  const topAdaptationOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.75],
    [0, 1],
  )
  const bottomAdaptationOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.85],
    [0, 1],
  )

  return (
    <Box id="delta" className="container-left" tabIndex={-1} role="region">
      <Box
        ref={sectionRef}
        height="450vh" // control this to determine the height
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box className="sticky-container">
        <motion.div
          style={{
            width: "100%",
            height: "30vh",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <motion.div
            className="top-paragraph-container text-container-left"
            style={{ height: "30vh", width: "100%", opacity: topIssueOpacity }}
          >
            <IssueTopParagraph />
          </motion.div>
          <motion.div
            className="top-paragraph-container text-container-left"
            style={{ height: "30vh", opacity: topAdaptationOpacity }}
          >
            <AdaptationTopParagraph />
          </motion.div>
        </motion.div>
        <Box
          style={{
            marginTop: "5px",
            marginBottom: "5px",
            width: "100%",
            height: "40vh",
            left: 0,
            position: "relative",
          }}
        >
          <MapContainer
            onLoad={() => {
              setMapReady(true)
            }}
          />
        </Box>
        <motion.div
          className="text-container-left"
          style={{ width: "100%", height: "30vh" }}
        >
          <motion.div
            className="bottom-paragraph-container text-container-left"
            style={{
              height: "30vh",
              opacity: bottomIssueOpacity,
              paddingTop: "2rem",
            }}
          >
            <IssueBottomParagraph />
          </motion.div>
          <motion.div
            className="bottom-paragraph-container text-container-left"
            style={{
              height: "30vh",
              opacity: bottomAdaptationOpacity,
              paddingTop: "2rem",
            }}
          >
            <AdaptationBottomParagraph />
          </motion.div>
        </motion.div>
      </Box>
    </Box>
  )
}
   */

const strategyContent = {
  tunnel:
    "This scenario will model the Delta Conveyance Project. Specifically it will research the preferred alternative - the Bethany Reservoir Alignment - to see how it potentially affects Delta salinity, particularly under future drought and sea level rise conditions, in comparison to the other scenarios.",
  ecomachine:
    "This scenario will test the capacity of in-Delta tidal restoration to attenuate salinity and provide additional ecological and recreational benefits.",
  bolster:
    "This scenario will test the capacity of in-Delta infrastructure to attenuate salinity intrusion and convey freshwater.",
  watershed:
    "This scenario tests the benefits of upstream watershed restoration (for flood attenuation, water infiltration and storage, and other benefits) as well as tidal restoration and non-tidal restoration/regenerative land uses within the Delta. Overall, the scenario tests the potential for transition to a green, equitable economy, and for eco-cultural restoration and indigenous sovereignty.",
  reserve:
    "This scenario focuses on large reservoirs - such as Shasta and Oroville - which are critical tools in managing California water and Delta salinity. This scenario will explore the capacities and limitations of changes in reservoir operations and management - primarily the release and timing of flows - to manage salinity, foster ecological benefits, and improve drought resiliency.",
}

function MapControl({
  strategy,
  onChange,
}: {
  strategy: "tunnel" | "ecomachine" | "bolster" | "watershed" | "reserve"
  onChange: (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: "tunnel" | "ecomachine" | "bolster" | "watershed" | "reserve",
  ) => void
}) {
  return (
    <motion.div
      variants={paragraphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: "absolute",
        inset: 0,
        width: "50%",
        height: "100%",
        paddingTop: "10px",
        paddingBottom: "10px",
        paddingLeft: "3rem",
        pointerEvents: "auto",
      }}
    >
      <Stack direction="column" spacing={2} alignItems="flex-start">
        <Box>
          <h3 className="stroked-text" style={{}}>
            {
              "Just Transitions in the Delta: Drought, Salinity, and Sea Level Rise"
            }
          </h3>
        </Box>
        <ToggleButtonGroup
          color="primary"
          exclusive
          value={strategy}
          onChange={onChange}
          orientation="vertical"
          size="large"
          sx={{
            color: "#fcfbfa",
            "& .MuiToggleButton-root": {
              borderColor: "#fcfbfa",
              color: "#fcfbfa",
              padding: "10px 16px", // controls visual size
              fontSize: "1.2rem", // controls visual size
              borderRadius: 0,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(242,240,239,0.06)",
              },
            },
            // selected state
            "& .MuiToggleButton-root.Mui-selected": {
              backgroundColor: "#fcfbfa",
              color: "#104472",
              "&:hover": {
                color: "#3c71a0ff",
                backgroundColor: "#fcfbfa",
              },
            },
            "& .MuiToggleButton-root:first-of-type": {
              borderTopRightRadius: "10px",
              borderTopLeftRadius: "10px",
            },
            "& .MuiToggleButton-root:last-of-type": {
              borderBottomLeftRadius: "10px",
              borderBottomRightRadius: "10px",
            },
          }}
        >
          <ToggleButton value="tunnel">A Tunnel</ToggleButton>
          <ToggleButton value="ecomachine">Eco Machine</ToggleButton>
          <ToggleButton value="bolster">{"Bolster & Fortify"}</ToggleButton>
          <ToggleButton value="watershed">{"New Green Watershed"}</ToggleButton>
          <ToggleButton value="reserve">{"Calling on Reserves"}</ToggleButton>
        </ToggleButtonGroup>
        <Box
          width="80%"
          sx={{
            backgroundColor: "#10447280",
            borderRadius: "10px",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "#fcfbfa", fontSize: "1.4rem" }}>
            {strategyContent[strategy]}
          </p>
        </Box>
      </Stack>
    </motion.div>
  )
}

function IssueParagraph() {
  return (
    <motion.div
      variants={paragraphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Box className="paragraph" component="article">
        <Typography variant="h4" gutterBottom>
          {"Rising seas, rising risks"}
        </Typography>
        <Typography variant="body1">
          {
            "You may be aware that climate change melts polar ice, raising sea levels worldwide."
          }
        </Typography>
        <Typography variant="body1">
          {"But do you know how this will affect California?"}
        </Typography>
        <Typography variant="body1">
          {
            "One of the most vulnerable places to rising sea levels is the Delta, where two of the state’s largest rivers \u2014 "
          }
          <span style={{ color: FreshWaterColor, fontWeight: "bold" }}>
            {"the Sacramento and San Joaquin"}
          </span>
          {" \u2014 meet the San Francisco Bay."}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "Rising sea levels are pushing saltwater deeper into this area, a home critical to local communities, agriculture, and water supply in Southern California."
          }
        </Typography>
        <Typography variant="body1">
          {
            "Increasing salinity threatens both Delta livelihoods and freshwater exports to farms and cities across California."
          }
        </Typography>
      </Box>
    </motion.div>
  )
}

function AdaptationParagraph() {
  return (
    <motion.div
      variants={paragraphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "People are looking for ways to manage salinity in the Delta, which is becoming more difficult as the climate changes."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {"For example, "}
          <span style={{ fontWeight: "bold" }}>
            <a
              href="https://delta-just-transitions-ucdavis.hub.arcgis.com/"
              style={{ color: "#fcfbfa", textDecoration: "underline" }}
            >
              Just Transitions in the Delta
            </a>
          </span>
          {
            " is a research project examines the implications for local communities, ecosystems, and statewide water systems. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "It explores a wide range of adaptation strategies to address salinity intrusion in the Delta."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          Interact with the map to learn more about the Delta and the strategies
          being considered to manage rising sea levels!
        </Typography>
      </Box>
    </motion.div>
  )
}

export default SectionDelta
