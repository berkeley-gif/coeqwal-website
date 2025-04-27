"use client"

import { Box, Slider, Typography } from "@repo/ui/mui"
import { useState, useCallback, useRef, useEffect } from "react"
import { useMap } from "@repo/map/client"
import { useFetchData } from "../hooks/useFetchData"
import PrecipitationBar from "./vis/PrecipitationBar"
import { precipitationPaintStyle } from "./helpers/mapLayerStyle"
import useActiveSection from "../hooks/useActiveSection"
import { MarkerType } from "./helpers/mapMarkers"
import useStoryStore from "../store"

import AnimatedCurve from "./vis/AnimatedCurve"
import { Sentence } from "@repo/motion/components"
import { MONTHS, selectedMonths } from "./helpers/constants"
import { stateMapViewState } from "./helpers/mapViews"

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
    </>
  )
}

//TODO: current onEnter() will be triggered twice, but it could just be strict mode or something
function Precipitation() {
  const { addLayer, addSource, setPaintProperty } = useMap()
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.precipitation
  const { sectionRef, isSectionActive } = useActiveSection("precipitation", {
    amount: 0.2,
  })
  const hasSeen = useRef(false)

  const init = useCallback(() => {
    console.log("here")
    addSource("precipitation-vector", {
      type: "vector",
      url: "mapbox://yskuo.9zuvqy7z",
    })

    addLayer(
      "precipitation-vector-layer",
      "precipitation-vector",
      "fill",
      precipitationPaintStyle,
      {},
      { "source-layer": "region" },
    )
  }, [addSource, addLayer])

  //TODO: there is two times re-render here, in case we have performance issues
  const load = useCallback(() => {
    console.log("bebug/loop")
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 1)
  }, [setPaintProperty])

  const unload = useCallback(() => {
    setPaintProperty("precipitation-vector-layer", "fill-opacity", 0)
  }, [setPaintProperty])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        console.log("initialize stuff")
        init()
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        console.log("unload stuff")
        unload()
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, init, load, unload])

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
        <Sentence
          variant="h3"
          gutterBottom
          options={{ amount: 0.1 }}
          custom={0}
        >
          {content?.title}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>{content?.p1}</Sentence>
        <Sentence custom={2}>{content?.p2}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={3}>{content?.p3}</Sentence>
        <Sentence custom={4}>{content?.p4}</Sentence>
      </Box>
    </Box>
  )
}

function Variability({ markers }: { markers: Record<string, MarkerType[]> }) {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.variability
  const { sectionRef, isSectionActive } = useActiveSection("variability", {
    amount: 0.5,
  })
  const hasSeen = useRef(false)

  const [startBarAnimation, setStartBarAnimation] = useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const getSelectedYear = (year: string) => {
    const points = markers[year] || []
    setMarkers(points, "rough-circle")
  }

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
        setMarkers([], "rough-circle")
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, setMarkers])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence custom={0}>{content?.p1}</Sentence>
        <Sentence custom={1}>{content?.p2}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={2}>{content?.p3}</Sentence>
        <Sentence custom={3}>{content?.p4}</Sentence>
      </Box>
      <Box className="paragraph" style={{ height: "100%", width: "100%" }}>
        <Sentence
          variant="h6"
          custom={4}
          onAnimationComplete={() => setStartBarAnimation(true)}
        >
          California Rainfall Deviation from Average
        </Sentence>
        <PrecipitationBar
          yearLabels={Object.keys(markers).map((key) => parseInt(key))}
          startAnimation={startBarAnimation}
          getSelectedYear={getSelectedYear}
        />
      </Box>
    </Box>
  )
}

//TODO: add snowpack
function Snowpack() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.snowpack
  const { sectionRef, isSectionActive } = useActiveSection("snowpack", {
    amount: 0.5,
  })
  const [startAnimation, setStartAnimation] = useState(false)
  const [monthIdx, setMonthIdx] = useState(0)
  const hasSeen = useRef(false)
  const { flyTo, setPaintProperty } = useMap()
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const load = useCallback(() => {
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
    setMarkers([], "text")
  }, [flyTo, setPaintProperty, setMarkers])

  useEffect(() => {
    if (isSectionActive) {
      if (!hasSeen.current) {
        //console.log('initialize stuff')
      }
      hasSeen.current = true
      load()
    } else {
      if (hasSeen.current) {
        //console.log('unload stuff')
      } else {
        //console.log('not seen yet, dont do anything')
        return
      }
    }
  }, [isSectionActive, load])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph">
        <Sentence variant="h3" gutterBottom custom={0}>
          {content?.title}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1}>{content?.p1}</Sentence>
        <Sentence custom={2}>{content?.p2}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          custom={3}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          {content?.p3}
        </Sentence>
      </Box>
      <Box className="paragraph" style={{ height: "100%", width: "100%" }}>
        <Sentence custom={3} variant="h6">
          {"From Snow to Snowmelt \u2014 an Illustration"}
        </Sentence>
        <AnimatedCurve
          startAnimation={startAnimation}
          selectedMonth={monthIdx}
        />
        <div id="month-slider">
          <Slider
            min={0}
            max={11}
            value={monthIdx}
            track={false}
            onChange={(e, newValue) => setMonthIdx(newValue as number)}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => MONTHS[value]}
            marks={MONTHS.filter((d) => selectedMonths.includes(d)).map(
              (each) => ({
                value: MONTHS.indexOf(each),
                label: (
                  <span
                    style={{
                      fontWeight:
                        MONTHS.indexOf(each) === monthIdx ? "bold" : "normal",
                    }}
                  >
                    {each}
                  </span>
                ),
              }),
            )}
            step={1}
          />
          <Typography variant="h6" gutterBottom>
            Months in a Water Year
          </Typography>
        </div>
      </Box>
    </Box>
  )
}

export default SectionWaterSource
