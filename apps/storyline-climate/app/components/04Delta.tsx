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
      className="container-left"
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="450vh" // control this to determine the height
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box className="sticky-container">
        <motion.div style={{ width: "100%", height: "30vh", display: 'flex', justifyContent: 'center'}}>
          <motion.div
            className="top-paragraph-container text-container-left" 
            style={{ height: "30vh", width: '100%', opacity: topIssueOpacity }}
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
        <motion.div className='text-container-left' style={{ width: "100%", height: "30vh" }}>
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
              "This area is home to many communities and farms."
            }
          </Typography>
          <Typography variant="body1">
            {
              "It is also where huge pumps move freshwater south of the Delta to supply cities and farms across the state."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "As sea levels rise, salty ocean water can extend further into the Delta through higher tides. "
            }
          </Typography>
          <Typography variant="body1">
            {
              "Increasing salinity threatens local Delta communities and farms. "
            }
          </Typography>
          <Typography variant='body1'>
            {
              "It also puts water exports to San Joaquin Valley farms and cities in Southern California at risk. "
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
            "People are looking for ways to manage salinity and other water system problems brought by climate change."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "For example, "
          }
          <span style={{fontWeight: 'bold'}}><a href="https://delta-just-transitions-ucdavis.hub.arcgis.com/" style={{ color: "#f2f0ef", textDecoration: "underline" }}
          >Just Transitions in the Delta: Drought, Salinity, and Sea Level Rise</a></span>
          , is a research effort studying a wide range of adaptation strategies to address salinity intrusion.
        </Typography>
        <Typography variant="body1">
          {
            "These include physical changes to the Delta itself \u2014 such as restoration and nature-based solutions, which can redirect where and how tides flow into the Delta."
          }
          {
            " These changes can make better conditions for fish and create new recreational opportunities for outdoor recreation."
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
            "The Just Transition project is also exploring possibilities for operable gates, freshwater corridors, and other water conveyance infrastructure."
          }
        </Typography>
        <Typography variant="body1">
          {
            "These options could be combined with policy changes, sending more freshwater into the Delta and running reservoirs differently."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "The proposed "
          }
          <span style={{fontWeight: 'bold'}}>Delta Conveyance Project</span> {" "}
          {
            "would create a large tunnel to move water from the Sacramento River to the Delta pumps. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "This tunnel would protect water exports from rising sea levels. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "However, opponents of this project argue that it would harm Delta communities and ecosystems.  "
          }
        </Typography>
      </Box>
    </>
  )
}

export default SectionDelta
