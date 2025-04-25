"use client"

import { useMap } from "@repo/map"
import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { riverLayerStyle } from "./helpers/mapLayerStyle"
import useStory from "../story/useStory"
import useActiveSection from "../hooks/useActiveSection"

/*const getMarker = (point: Point, idx: number) => (
  <Marker latitude={point.latitude} longitude={point.longitude} key={idx}>
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }} // Define exit animation
      transition={{ duration: 0.5 }}
      className="impact-marker"
    ></motion.div>
  </Marker>
)*/

function SectionHuman() {
  return (
    <>
      <Header />
      <Irrigation />
      <Drinking />
    </>
  )
}

function Header() {
  const { storyline } = useStory()
  const content = storyline?.economy
  const sectionRef = useActiveSection("goldrush", { amount: 0.5 })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="h3" gutterBottom>
          {content?.title}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1">
          {content?.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
      </Box>
    </Box>
  )
}

function Irrigation() {
  const { storyline } = useStory()
  const content = storyline?.economy.irrigation
  const sectionRef = useActiveSection("irrigation", { amount: 0.5 })

  return (
    <Box className="container" height="100vh" sx={{ justifyContent: "center" }}>
      <Box ref={sectionRef} className="paragraph">
        <Typography variant="body1">
          {content?.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">{content?.p2}</Typography>
      </Box>
    </Box>
  )
}

function Drinking() {
  const { storyline } = useStory()
  const content = storyline?.economy.drinking
  const sectionRef = useActiveSection("drinking", { amount: 0.5 })
  const { mapRef, addSource, addLayer, setPaintProperty } = useMap()

  function loadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return

    addSource("river-combined", {
      type: "geojson",
      data: "/rivers/combinedRivers.geojson",
    })

    addLayer(
      "river-combined-layer",
      "river-combined",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )

    setPaintProperty("river-combined-layer", "line-opacity", 1)
  }

  function unLoadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return

    setPaintProperty("river-combined-layer", "line-opacity", 0)
  }

  /*
  const markers = [
    { longitude: -114.596, latitude: 33.61, caption: "Colorado River" },
    { longitude: -118.3951, latitude: 37.3686, caption: "Lake Mead" },
    { longitude: -119.7862, latitude: 37.9481, caption: "Lake Powell" },
  ]
  */

  useIntersectionObserver(
    sectionRef,
    ["drinking"],
    ["irrigation"],
    loadRivers,
    unLoadRivers,
    { threshold: 0.5 },
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="body1">
          {content?.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">
          {content?.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">{content?.p3}</Typography>
      </Box>
    </Box>
  )
}

export default SectionHuman
