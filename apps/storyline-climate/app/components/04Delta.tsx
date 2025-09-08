"use client"

import { Box, Typography } from "@repo/ui/mui"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import MapContainer from "./MapContainer"
import { useState } from "react"
import { FreshWaterColor } from "./helpers/colorPalette"
import useStoryStore from "../store"
import { useMap } from "@repo/map"
import { Tunnel } from "./helpers/mapAnnotations"

function SectionDelta() {
  return (
    <>
      <Delta />
    </>
  )
}

function Delta() {
  const { sectionRef } = useActiveSection("delta", { amount: 0.5 })
  const setMapReady = useStoryStore((state) => state.setMapReady)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
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
      if (!hasSetMarkers) setHasSetMarkers(true)
    } else {
      setPaintProperty("delta-tunnel-layer", "line-opacity", 0)
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
    <Box
      id="delta"
      className="container-center"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="450vh" // control this to determine the height
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box className="container-center sticky-container">
        <motion.div style={{ width: "100%", height: "30vh" }}>
          <motion.div
            className="top-paragraph-container"
            style={{ height: "30vh", opacity: topIssueOpacity }}
          >
            <IssueTopParagraph />
          </motion.div>
          <motion.div
            className="top-paragraph-container"
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
          {/* <Box style={{
            width: '100px', height: '100px', backgroundColor: 'teal',
            position: 'absolute', top: 0, left: '30%'
          }}></Box>*/}
        </Box>
        <motion.div style={{ width: "100%", height: "30vh" }}>
          <motion.div
            className="bottom-paragraph-container"
            style={{
              height: "30vh",
              opacity: bottomIssueOpacity,
              paddingTop: "2rem",
            }}
          >
            <IssueBottomParagraph />
          </motion.div>
          <motion.div
            className="bottom-paragraph-container"
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

function IssueTopParagraph() {
  return (
    <>
      <Box className="paragraph" component="article">
        <Typography variant="h4" gutterBottom>
          {"Rising seas, rising risks"}
        </Typography>
        <Typography variant="body1">
          {
            "You may be aware that climate change melts polar ice, raising sea levels worldwide. But do you know how this will affect California?"
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "One of the most vulnerable places to rising sea levels is the Delta, where two of the state’s largest rivers \u2014 "
          }
          <span style={{ color: FreshWaterColor, fontWeight: "bold" }}>
            {"the Sacramento and San Joaquin"}
          </span>
          {" \u2014 meet the San Francisco Bay."}
        </Typography>
        <Typography variant="body1">
          {
            "This area is home to many communities and farms. It is also where huge pumps move freshwater south to supply cities and farms across the state."
          }
        </Typography>
      </Box>
    </>
  )
}

function IssueBottomParagraph() {
  return (
    <>
      <motion.div>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "As the sea level rises, salty ocean water extends further into the Delta."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "The saltier water threatens local Delta communities and farms. It also puts water exports to San Joaquin Valley farms and cities in Southern California at risk."
            }
          </Typography>
          <Typography variant="body1">
            {
              "To address the threat of sea level rise, several strategies are being considered."
            }
          </Typography>
        </Box>
      </motion.div>
    </>
  )
}

function AdaptationTopParagraph() {
  return (
    <>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "For example, the state has proposed to construct a large tunnel, known as the Delta Conveyance Project, to move water from the Sacramento River to the Delta pumps."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "in order to limit the risks of rising sea levels to water exports. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "Opponents of this project argue that it would harm Delta communities and ecosystems."
          }
        </Typography>
      </Box>
    </>
  )
}

function AdaptationBottomParagraph() {
  return (
    <>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "Other adaptation strategies are also being explored that involve ‘nature-based solutions.’ "
          }
        </Typography>
        <Typography variant="body1">
          {
            "Setting back levees along rivers to restore floodplain habitats, for example, gives rivers more room to safely flood and promotes groundwater recharge."
          }
        </Typography>
      </Box>
    </>
  )
}

export default SectionDelta
