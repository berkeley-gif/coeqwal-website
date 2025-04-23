"use client"

import storyline from "../../public/locales/english.json" assert { type: "json" }
import markers from "../../public/data/variability_marker.json" assert { type: "json" }
import SectionContainer from "./helpers/SectionContainer"
import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { useState, useCallback, useRef } from "react"
import { Marker, Popup, useMap, MapLayerType } from "@repo/map"
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
  anchor: string
}

const riverLayerStyle = {
  type: "line",
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-color": "#9acbcf",
    "line-width": 3,
    "line-opacity": 0,
  },
}

function SectionWaterSource() {
  return (
    <>
      <Precipitation />
      <Variability />
      <Snowpack />
      <WaterFlow />
    </>
  )
}

function Precipitation() {
  const content = storyline.precipitation
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container
  const { mapRef, addSource, addLayer, setPaintProperty, getStyle } = useMap() // 👈 methods are in MapContext in the map package

  function loadPrecipitation() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    // mapRef.current?.addSource("precipitation", {
    addSource("precipitation", {
      type: "raster",
      url: "mapbox://coeqwal.82rnru99",
      tileSize: 256,
    })
    //mapRef.current?.addLayer({
    addLayer(
      "precipitation-layer",
      "precipitation",
      "raster" as MapLayerType,
      {
        "raster-opacity": 0,
      }
    )
    // mapRef.current
    // ?.getMap()
    // ?.getMap()
    // ?.setPaintProperty("precipitation-layer", "raster-opacity", 1)
    setPaintProperty("precipitation-layer", "raster-opacity", 1)
  }

  function unloadPrecipitation() {
    // const mapInst = mapRef.current?.getMap()
    // if (!mapInst) return
    
    // const layers = mapInst.getStyle().layers.map((layer) => layer.id)
    const layers = getStyle().layers.map(layer => layer.id)
    if (!layers.includes("precipitation-layer")) return
    
    // mapRef.current
    // ?.getMap()
    // ?.getMap()
    // ?.setPaintProperty("precipitation-layer", "raster-opacity", 0)
    setPaintProperty("precipitation-layer", "raster-opacity", 0)
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        loadPrecipitation()
      } else {
        unloadPrecipitation()
      }
    },
    {
      threshold: 0.5,
    },
  )

  return (
    <SectionContainer id="variability">
      <Box
        ref={ref}
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
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

function Variability() {
  const content = storyline.variability
  const visRef = useInViewVisibility()
  // const { mapRef } = useMap()
  const { mapRef, setMotionChildren } = useMap() // 👈

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
                anchor={data.anchor as mapboxgl.Anchor}
                closeOnClick={true}
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
    // if (mapRef.current) {
    //   mapRef.current?.setMotionChildren(null)
    if (setMotionChildren) {
      setMotionChildren(null)
      setSelectedYear(null) // Reset selected year when removing markers
    }
    // }, [mapRef])
  }, [setMotionChildren])

  const addMarkersToMap = useCallback(() => {
    // if (mapRef.current) {
    if (setMotionChildren) {
      // Only add markers if a year is selected
      const pointsToShow = selectedYear ? markers[selectedYear] : []
      const markerToAdd = prepareMarkers(pointsToShow)
      // mapRef.current?.setMotionChildren(markerToAdd)
      setMotionChildren(markerToAdd)
    }
    // }, [mapRef, prepareMarkers, selectedYear])
  }, [setMotionChildren, prepareMarkers, selectedYear])

  const getSelectedYear = useCallback(
    (year: keyof typeof markers) => {
      setSelectedYear(year)
      // We need to wait for the state to update before adding markers
      setTimeout(() => {
        // if (mapRef.current) {
        if (setMotionChildren) {
          const markerToAdd = prepareMarkers(markers[year])
          // mapRef.current?.setMotionChildren(markerToAdd)
          setMotionChildren(markerToAdd)
        }
      }, 0)
    },
    // [mapRef, prepareMarkers],
    [setMotionChildren, prepareMarkers],
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
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container
  const { mapRef, addSource, addLayer, setPaintProperty, flyTo, getStyle } = useMap() // 👈

  function loadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return

    // mapRef.current?.addSource("river-sac", {
    addSource("river-sac", {
      type: "geojson",
      data: "/rivers/SacramentoRiver_wo.geojson",
    })

    // mapRef.current?.addLayer({
    addLayer(
      "river-sac-layer",
      "river-sac",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout
    )

    // mapRef.current?.addSource("river-sanjoaquin", {
    addSource("river-sanjoaquin", {
      type: "geojson",
      data: "/rivers/SanJoaquinRiver.geojson",
    })

    // mapRef.current?.addLayer({
    addLayer(
      "river-sanjoaquin-layer",
      "river-sanjoaquin",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout
    )

    // mapRef.current
    //   ?.getMap()
    //   ?.getMap()
    //   ?.setPaintProperty("river-sac-layer", "line-opacity", 1)
    // mapRef.current
    //   ?.getMap()
    //   ?.getMap()
    //   ?.setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
    setPaintProperty("river-sac-layer", "line-opacity", 1)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
  }

  function unloadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    
    // const mapInst = mapRef.current?.getMap()
    // if (!mapInst) return
    // const layers = mapInst.getStyle().layers.map((layer) => layer.id)

    const layers = getStyle().layers.map(layer => layer.id)
    if (!layers.includes("river-sac-layer")) return
    
    // mapRef.current
    //   ?.getMap()
    //   ?.getMap()
    //   ?.setPaintProperty("river-sac-layer", "line-opacity", 0)
    // mapRef.current
    //   ?.getMap()
    //   ?.getMap()
    //   ?.setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
  }

  const closeMapViewState = {
    latitude: 38.8309,
    longitude: -124.8652,
    zoom: 7,
  }

  function moveTo() {
    if (!mapRef.current?.getMap()) return
    
        // mapRef.current?.flyTo(
    //   closeMapViewState.longitude,
    //   closeMapViewState.latitude,
    //   closeMapViewState.zoom,
    //   0,
    //   0,
    //   3500,
    // )
    flyTo({
      longitude: closeMapViewState.longitude,
      latitude: closeMapViewState.latitude,
      zoom: closeMapViewState.zoom,
      transitionOptions: {
        duration: 3500
      }
    })
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        loadRivers()
        moveTo()
      } else {
        unloadRivers()
      }
    },
    { threshold: 0 },
  )

  return (
    <>
      <SectionContainer id="water-flow">
        <Box ref={ref} className="container" height="100vh">
          <Box className="paragraph">
            <Typography variant="h3" gutterBottom>
              {content.title}
            </Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">{content.p1}</Typography>
            <Typography variant="body1">
              {content.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">{content.p3}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">{content.p4}</Typography>
          </Box>
        </Box>
      </SectionContainer>
      <SectionContainer id="valley">
        <Box className="container" height="100vh">
          <Box className="paragraph">
            <Typography variant="body1">{content.valley.p1}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">
              {content.valley.p2}{" "}
              <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">
              {content.valley.p3}{" "}
              <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">{content.valley.p4}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">{content.transition.p1}</Typography>
            <Typography variant="body1">{content.transition.p2}</Typography>
          </Box>
        </Box>
      </SectionContainer>
    </>
  )
}

export default SectionWaterSource
