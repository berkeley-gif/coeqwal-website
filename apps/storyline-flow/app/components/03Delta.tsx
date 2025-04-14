import { Box, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import markers from "../../public/data/delta_marker.json" assert { type: "json" }
import { useRef, useState } from "react"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { motion } from "@repo/motion"
import { stateMapViewState } from "./helpers/mapViews"

import { Marker, Popup } from "@repo/map"
import Bird from "./vis/Bird"
import Grass from "./vis/Grass"

type MarkerType = {
  name: string
  coordinates: number[]
  caption: string
}

function SectionDelta() {
  return (
    <>
      <Delta />
      <Transition />
    </>
  )
}

//TODO: instead of scrolling away, make it disappear
function Transition() {
  const content = storyline.delta
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container

  return (
    <Box style={{ width: "100%", height: "100%", zIndex: 1 }}>
      <Box
        ref={ref}
        className="container-center"
        height="120vh"
        width="100vw"
        sx={{ backgroundColor: "#031a35", width: "100vw" }}
      >
        <Box className="paragraph">
          <Typography variant="h2">{content.transition}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

//TODO: this part disppeared when overflow-hidden is applied to the container in provider.tsx, related to how I set up sticky div
//TODO: add animation for these graphics
//TODO: show up by sentence
function Delta() {
  const content = storyline.delta
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container
  const [popupInfo, setPopupInfo] = useState<MarkerType | null>(null)
  const { mapRef } = useMap() // from our context
  const [toStick, setToStick] = useState(true)

  function moveToDelta() {
    setToStick(true)
    if (mapRef.current) {
      mapRef.current?.flyTo(-121.8427, 37.708, 9)
      const markerToAdd = prepareMarkers(markers)
      mapRef.current?.setMotionChildren(markerToAdd)
    }
  }

  function moveBackToCA() {
    setToStick(false)
    if (mapRef.current) {
      mapRef.current?.flyTo(
        stateMapViewState.longitude,
        stateMapViewState.latitude,
        stateMapViewState.zoom,
      )
      mapRef.current?.setMotionChildren(null)
    }
  }

  function prepareMarkers(points: MarkerType[] = markers) {
    return points.map((data: MarkerType, idx) => {
      return (
        <Marker
          latitude={data.coordinates[1] as number}
          longitude={data.coordinates[0] as number}
          key={data.name}
          onClick={(e) => {
            e.originalEvent.stopPropagation() // Prevent map click event
            setPopupInfo(data) // Set the popup info
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }} // Define exit animation
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            className="marker"
          ></motion.div>

          {popupInfo && popupInfo.name === data.name && (
            <Popup
              latitude={data.coordinates[1] as number}
              longitude={data.coordinates[0] as number}
              anchor="left"
              closeOnClick={false}
              offset={{
                bottom: [0, -10],
              }}
              onClose={() => setPopupInfo(null)}
            >
              <div className="popup">
                <h3>{data.name}</h3>
                <img width="100%" src="/sealtester.jpg" />
                <p>{data.caption}</p>
              </div>
            </Popup>
          )}
        </Marker>
      )
    })
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        console.log("into Delta")
        moveToDelta()
      } else {
        console.log("away from Delta")
        moveBackToCA()
      }
    },
    { threshold: 0.1 },
  )

  return (
    <Box id="delta" style={{ height: "100%", zIndex: 1 }}>
      <Box
        ref={ref}
        className="container"
        height="150vh"
        width="1px"
        sx={{ pointerEvents: "none" }}
      ></Box>
      <motion.div
        id="holder"
        className="container-center"
        style={{
          position: "sticky",
          bottom: 0,
          height: "50vh",
          backgroundColor: "#031a35",
          overflowY: "hidden",
          overflowX: "hidden",
        }}
      >
        <Bird />
        <Grass />
        <Box className="paragraph">
          <Typography variant="body1">
            {content.p11}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p12}</span>
            {""}
            {content.p13}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p2}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p3}</Typography>
          <Typography variant="body1">{content.p4}</Typography>
          <Typography variant="body1">{content.p5}</Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default SectionDelta
