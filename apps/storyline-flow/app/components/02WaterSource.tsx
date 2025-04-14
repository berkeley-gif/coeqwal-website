import storyline from "../../public/locales/english.json" assert { type: "json" }
import markers from "../../public/data/variability_marker.json" assert { type: "json" }
import SectionContainer from "./helpers/SectionContainer"
import { Box, Typography } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { useState, useCallback } from "react"
import { Marker, Popup, useMap } from "@repo/map"
import { motion } from "@repo/motion"
import { opacityVariants } from "@repo/motion/variants"
import { useInViewVisibility } from "../hooks/useInViewVisbility"
import PrecipitationBar from "./vis/PrecipitationBar"
import Image from "next/image"

type MarkerType = {
  id: string
  name: string
  coordinates: number[]
  caption: string
  image: string
}

function SectionWaterSource() {
  return (
    <>
      <Precipitation />
      <Variability />
      <Snowpack />
      <WaterFlow />
      <Valley />
    </>
  )
}

function Precipitation() {
  const content = storyline.precipitation

  return (
    <SectionContainer id="variability">
      <Box className="container" height="90vh">
        <Box className="paragraph">
          <Typography variant="h3" gutterBottom>
            {content.title}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">{content.p2}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

//TODO: fix the public folder
function Variability() {
  const content = storyline.variability
  const visRef = useInViewVisibility()
  const { mapRef } = useMap()

  const [popupInfo, setPopupInfo] = useState<MarkerType | null>(null)
  const [startBarAnimation, setStartBarAnimation] = useState(false)
  const [selectedYear, setSelectedYear] = useState<keyof typeof markers | null>(
    null,
  ) // Default to null

  // Memoize prepareMarkers to properly capture the current popupInfo state
  const prepareMarkers = useCallback(
    (points: MarkerType[] = []) => {
      // Default to empty array
      return points.map((data: MarkerType, idx) => {
        return (
          <Marker
            latitude={data.coordinates[1] as number}
            longitude={data.coordinates[0] as number}
            key={data.id}
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
            {popupInfo && popupInfo.id === data.id && (
              <Popup
                latitude={data.coordinates[1] as number}
                longitude={data.coordinates[0] as number}
                anchor="left"
                closeOnClick={false}
                offset={{ bottom: [0, -10] }}
                onClose={() => setPopupInfo(null)}
              >
                <div className="popup">
                  <h3>{data.name}</h3>
                  <Image
                    src={`/variability/${data.image}`}
                    alt={data.caption}
                    width={470}
                    height={300}
                    style={{ objectFit: "cover" }}
                  />
                  <p>{data.caption}</p>
                </div>
              </Popup>
            )}
          </Marker>
        )
      })
    },
    [popupInfo],
  ) // Include popupInfo in dependencies

  const removeMarkersFromMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current?.setMotionChildren(null)
      setSelectedYear(null) // Reset selected year when removing markers
    }
  }, [mapRef])

  const addMarkersToMap = useCallback(() => {
    if (mapRef.current) {
      // Only add markers if a year is selected
      const pointsToShow = selectedYear ? markers[selectedYear] : []
      const markerToAdd = prepareMarkers(pointsToShow)
      mapRef.current?.setMotionChildren(markerToAdd)
    }
  }, [mapRef, prepareMarkers, selectedYear]) // Add proper dependencies

  const getSelectedYear = useCallback(
    (year: keyof typeof markers) => {
      setSelectedYear(year)
      // We need to wait for the state to update before adding markers
      setTimeout(() => {
        if (mapRef.current) {
          const markerToAdd = prepareMarkers(markers[year])
          mapRef.current?.setMotionChildren(markerToAdd)
        }
      }, 0)
    },
    [mapRef, prepareMarkers],
  )

  useIntersectionObserver(
    visRef.ref,
    (isIntersecting) => {
      if (isIntersecting) {
        addMarkersToMap() // Add markers when the section is in view
      } else {
        removeMarkersFromMap() // Remove markers when the section is out of view
      }
    },
    {
      threshold: 1,
    },
  )

  return (
    <SectionContainer id="variability">
      <Box className="container" height="100vh">
        <Box className="paragraph">
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">{content.p2}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p3}</Typography>
          <Typography variant="body1">{content.p4}</Typography>
        </Box>
        <motion.div
          ref={visRef.ref}
          style={{ height: "40%", width: "70%" }}
          className="paragraph"
          variants={opacityVariants}
          initial="hidden"
          animate={visRef.controls}
          custom={3}
          onAnimationComplete={() => setStartBarAnimation(true)}
        >
          <Typography variant="h6">
            California Annual Precipitation Relative to Historical Average
          </Typography>
          <PrecipitationBar
            startAnimation={startBarAnimation}
            getSelectedYear={getSelectedYear}
          />
        </motion.div>
        <Box className="paragraph">
          <Typography variant="body1" gutterBottom>
            {content.p5}
          </Typography>
          <Typography variant="body1">{content.p6}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

function Snowpack() {
  const content = storyline.snowpack

  return (
    <SectionContainer id="variability">
      <Box className="container" height="100vh">
        <Box className="paragraph">
          <Typography variant="h3" gutterBottom>
            {content.title}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">{content.p2}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p3}</Typography>
        </Box>
        <div className="paragraph image-container">
          <Image
            src="/mockup.png"
            alt="Snowpack"
            width={1000}
            height={588}
            style={{ objectFit: "cover" }}
          />
        </div>
      </Box>
    </SectionContainer>
  )
}

//TODO: add river shapefile
function WaterFlow() {
  const content = storyline.flow

  return (
    <SectionContainer id="water-flow">
      <Box className="container" height="100vh">
        <Box className="paragraph">
          <Typography variant="h3" gutterBottom>
            {content.title}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">{content.p2}</Typography>
          <Typography variant="body1">{content.p3}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p4}</Typography>
        </Box>
        <Box className="paragraph"></Box>
      </Box>
    </SectionContainer>
  )
}

//TODO: figure out the visual support
function Valley() {
  const content = storyline.flow

  return (
    <SectionContainer id="valley">
      <Box className="container" height="100vh">
        <Box className="paragraph">
          <Typography variant="body1">{content.valley.p1}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.valley.p2}</Typography>
          <Typography variant="body1">{content.valley.p3}</Typography>
          <Typography variant="body1">{content.valley.p4}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.transition.p1}</Typography>
          <Typography variant="body1">{content.transition.p2}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

export default SectionWaterSource
