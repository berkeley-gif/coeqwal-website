"use client"

import useStory from "../story/useStory"
import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { useState, useCallback, useRef } from "react"
import { Marker, Popup } from "@repo/map"
import { useMap } from "@repo/map/client"
import { motion } from "@repo/motion"
import { opacityVariants } from "@repo/motion/variants"
import { useInViewVisibility } from "../hooks/useInViewVisibility"
import { MarkerType } from "./helpers/types"
import { useFetchData } from "../hooks/useFetchData"
import PrecipitationBar from "./vis/PrecipitationBar"
import { riverLayerStyle } from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import { Paragraph } from "@repo/motion/components"
import { stateMapViewState } from "./helpers/mapViews"
import Image from "next/image"
import { LayerProps } from "@repo/map"

const MotionText = motion.create(Typography)

function SectionWaterSource() {
  const [markers, setMarkers] = useState<Record<string, MarkerType[]>>({}) // Initialize markers as an empty array

  useFetchData<Record<string, MarkerType[]>>(
    "/data/variability_marker.json",
    (data) => {
      setMarkers(data)
    },
  )

  return (
    <>
      <Precipitation />
      <Variability markers={markers} />
      <Snowpack />
      <WaterFlow />
    </>
  )
}

//TODO: current onEnter() will be triggered twice
function Precipitation() {
  const { addLayer, addSource, setPaintProperty, getStyle, mapRef } = useMap()
  const { storyline } = useStory()
  const content = storyline?.precipitation
  const sectionRef = useActiveSection("precipitation", { amount: 0.2 })
  //const isInView = useInView(sectionRef, { amount: 0.75 })

  function loadPrecipitation() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    addSource("precipitation", {
      type: "raster",
      url: "mapbox://coeqwal.82rnru99",
      tileSize: 256,
    })
    addLayer("precipitation-layer", "precipitation", "raster", {
      "raster-opacity": 0,
    })
    setPaintProperty("precipitation-layer", "raster-opacity", 1)
  }

  function unLoadPrecipitation() {
    const layers = getStyle().layers.map((layer) => layer.id)
    if (!layers.includes("precipitation-layer")) return
    setPaintProperty("precipitation-layer", "raster-opacity", 0)
  }

  useIntersectionObserver(
    sectionRef,
    ["precipitation"],
    ["opener", "variability"],
    loadPrecipitation,
    unLoadPrecipitation,
    { threshold: 0.75 },
  )

  const springUpVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { type: "spring", delay: custom * 1.5 },
    }),
  }

  return (
    <Box
      ref={sectionRef}
      id="precipitation"
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1} // Ensure focusable for screen readers
      role="region"
    >
      <Box className="paragraph" component="article">
        <Paragraph
          variant="h3"
          gutterBottom
          variants={springUpVariants}
          custom={1}
          viewport={{ once: true, amount: 1 }}
        >
          {content?.title}
        </Paragraph>
      </Box>
      <Box className="paragraph">
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={1}
        >
          {content?.p1}
        </MotionText>
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={2}
        >
          {content?.p2}
        </MotionText>
      </Box>
      <Box className="paragraph">
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={3}
        >
          {content?.p3}
        </MotionText>
        <MotionText
          variant="body1"
          variants={springUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          custom={4}
        >
          {content?.p4}
        </MotionText>
      </Box>
    </Box>
  )
}

function Variability({ markers }: { markers: Record<string, MarkerType[]> }) {
  const { setMotionChildren } = useMap()
  const { storyline } = useStory()
  const content = storyline?.variability
  const sectionRef = useActiveSection("variability", { amount: 0.5 })
  const visRef = useInViewVisibility()

  const [popupInfo, setPopupInfo] = useState<MarkerType | null>(null)
  const [startBarAnimation, setStartBarAnimation] = useState(false)
  const [selectedYear, setSelectedYear] = useState<keyof typeof markers | null>(
    null,
  )

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
              e.originalEvent.stopPropagation()
              setPopupInfo(data)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
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
  )

  const removeMarkersFromMap = useCallback(() => {
    if (setMotionChildren) {
      setMotionChildren(null)
      setSelectedYear(null)
    }
  }, [setMotionChildren])

  const addMarkersToMap = useCallback(() => {
    if (setMotionChildren) {
      // Only add markers if a year is selected
      const pointsToShow = selectedYear ? markers[selectedYear] : []
      const markerToAdd = prepareMarkers(pointsToShow)
      // mapRef.current?.setMotionChildren(markerToAdd)
      setMotionChildren(markerToAdd)
    }
  }, [setMotionChildren, selectedYear, markers, prepareMarkers]) // Add proper dependencies

  const getSelectedYear = useCallback(
    (year: keyof typeof markers) => {
      setSelectedYear(year)
      setTimeout(() => {
        if (setMotionChildren) {
          const markerToAdd = prepareMarkers(markers[year])
          setMotionChildren(markerToAdd)
        }
      }, 0)
    },
    [setMotionChildren, prepareMarkers, markers],
  )

  useIntersectionObserver(
    sectionRef,
    ["variability"],
    ["precipitation", "snowpack"],
    addMarkersToMap,
    removeMarkersFromMap,
    { threshold: 0.75 },
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1">{content?.p2}</Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p3}</Typography>
        <Typography variant="body1">{content?.p4}</Typography>
      </Box>
      <motion.div
        ref={visRef.ref}
        style={{ height: "100%", width: "100%" }}
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
          mapData={markers}
          startAnimation={startBarAnimation}
          getSelectedYear={getSelectedYear}
        />
      </motion.div>
    </Box>
  )
}

//TODO: add snowpack
function Snowpack() {
  const { storyline } = useStory()
  const content = storyline?.snowpack
  const sectionRef = useActiveSection("snowpack", { amount: 0.5 })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Typography variant="h3" gutterBottom>
          {content?.title}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1">{content?.p2}</Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p3}</Typography>
      </Box>
      <div
        style={{ height: "40%", width: "100%", backgroundColor: "teal" }}
        className="paragraph"
      ></div>
    </Box>
  )
}

function WaterFlow() {
  const { storyline } = useStory() // Get the storyline from the context
  const content = storyline?.flow
  const sectionRef = useRef<HTMLDivElement>(null)
  const flowSectionRef = useActiveSection("flow", { amount: 0.1 })
  const valleySectionRef = useActiveSection("valley", { amount: 0.5 })
  const { mapRef, addSource, addLayer, setPaintProperty, flyTo, getStyle } =
    useMap() // from our context

  const closeMapViewState = {
    latitude: 38.8309,
    longitude: -124.8652,
    zoom: 7,
  }

  //TODO: delay this the river paintproperty better way
  function loadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    flyTo({
      longitude: closeMapViewState.longitude,
      latitude: closeMapViewState.latitude,
      zoom: closeMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })

    addSource("river-sac", {
      type: "geojson",
      data: "/rivers/SacramentoRiver_wo.geojson",
    })

    addLayer(
      "river-sac-layer",
      "river-sac",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )

    addSource("river-sanjoaquin", {
      type: "geojson",
      data: "/rivers/SanJoaquinRiver.geojson",
    })

    addLayer(
      "river-sanjoaquin-layer",
      "river-sanjoaquin",
      riverLayerStyle.type,
      riverLayerStyle.paint,
      riverLayerStyle.layout,
    )

    setTimeout(() => {
      setPaintProperty("river-sac-layer", "line-opacity", 1)
      setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)
    }, 1000)
  }

  function unLoadRivers() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    const layers = getStyle().layers.map((layer: LayerProps) => layer.id)
    if (!layers.includes("river-sac-layer")) return

    flyTo({
      longitude: stateMapViewState.longitude,
      latitude: stateMapViewState.latitude,
      zoom: stateMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })

    setPaintProperty("river-sac-layer", "line-opacity", 0)
    setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
  }

  useIntersectionObserver(
    sectionRef,
    ["flow"],
    ["snowpack", "delta"],
    loadRivers,
    unLoadRivers,
    { threshold: 0.25 },
  )

  return (
    <div ref={sectionRef}>
      <Box
        ref={flowSectionRef}
        className="container"
        height="100vh"
        tabIndex={-1}
        role="region"
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
          <Typography variant="body1">{content?.p3}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content?.p4}</Typography>
        </Box>
      </Box>
      <Box
        ref={valleySectionRef}
        className="container"
        height="100vh"
        tabIndex={-1}
        role="region"
      >
        <Box className="paragraph">
          <Typography variant="body1">{content?.valley.p1}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {content?.valley.p2}{" "}
            <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">
            {content?.valley.p3}{" "}
            <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">{content?.valley.p4}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content?.transition.p1}</Typography>
          <Typography variant="body1">{content?.transition.p2}</Typography>
        </Box>
      </Box>
    </div>
  )
}

export default SectionWaterSource
