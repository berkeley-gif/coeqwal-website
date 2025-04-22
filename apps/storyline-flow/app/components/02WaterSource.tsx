"use client"

import storyline from "../../public/locales/english.json" assert { type: "json" }
import markers from "../../public/data/variability_marker.json" assert { type: "json" }
import SectionContainer from "./helpers/SectionContainer"
import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { useState, useCallback, useRef, useEffect } from "react"
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
  const ref = useRef(null)
  const { addSource, addLayer, setPaintProperty } = useMap()

  function loadPrecipitation() {
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

  function unloadPrecipitation() {
    try {
      setPaintProperty("precipitation-layer", "raster-opacity", 0)
    } catch (e) {
      console.warn("⚠️ Skipping unloadPrecipitation because style not ready")
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      isIntersecting ? loadPrecipitation() : unloadPrecipitation()
    },
    { threshold: 0.5 },
  )

  return (
    <SectionContainer id="precipitation">
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
  const [startBarAnimation, setStartBarAnimation] = useState(false)
  const [selectedYear, setSelectedYear] = useState<keyof typeof markers | null>(
    "2021",
  )
  const [popupInfo, setPopupInfo] = useState<MarkerType | null>(null)

  const getSelectedYear = useCallback((year: keyof typeof markers) => {
    setSelectedYear(year)
  }, [])

  useIntersectionObserver(
    visRef.ref,
    (isIntersecting) => {
      if (!isIntersecting) {
        setSelectedYear(null)
        setPopupInfo(null)
      }
    },
    { threshold: 1 },
  )

  const visibleMarkers: MarkerType[] = selectedYear ? markers[selectedYear] : []

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

        {/* 🎯 Directly render animated, geolocated markers here */}
        {visibleMarkers.map((data, idx) => (
          <Marker
            latitude={data.coordinates[1]}
            longitude={data.coordinates[0]}
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
            />
            {popupInfo?.id === data.id && (
              <Popup
                latitude={data.coordinates[1]}
                longitude={data.coordinates[0]}
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
        ))}
      </Box>
    </SectionContainer>
  )
}

function Snowpack() {
  const content = storyline.snowpack
  return (
    <SectionContainer id="snowpack">
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

function WaterFlow() {
  const content = storyline.flow
  const ref = useRef(null)
  const { addSource, addLayer, setPaintProperty, flyTo } = useMap()

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        addSource("river-sac", {
          type: "geojson",
          data: "/rivers/SacramentoRiver_wo.geojson",
        })
        addLayer(
          "river-sac-layer",
          "river-sac",
          "line",
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
          "line",
          riverLayerStyle.paint,
          riverLayerStyle.layout,
        )

        setPaintProperty("river-sac-layer", "line-opacity", 1)
        setPaintProperty("river-sanjoaquin-layer", "line-opacity", 1)

        flyTo(-124.8652, 38.8309, 7, 0, 0, 3500)
      } else {
        setPaintProperty("river-sac-layer", "line-opacity", 0)
        setPaintProperty("river-sanjoaquin-layer", "line-opacity", 0)
      }
    },
    { threshold: 0 },
  )

  return (
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
  )
}

export default SectionWaterSource
