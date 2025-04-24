"use client"

import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import SectionContainer from "./helpers/SectionContainer"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import population from "../../public/data/city_population.json" assert { type: "json" }
import impactMarker from "../../public/data/impact_marker.json" assert { type: "json" }
import { LibraryBooksIcon } from "@repo/ui/mui"
import Pictogram from "./vis/Pictogram"
import PeopleIcon from "./helpers/PeopleIcon"
import { useMemo, useRef } from "react"
import RiceIcon from "./helpers/RiceIcon"
import AlmondIcon from "./helpers/AlmondIcon"
import Image from "next/image"
import {
  cityMapViewState,
  impactMapViewState,
  valleyMapViewState,
} from "./helpers/mapViews"
import { MapTransitions, Marker, useMap } from "@repo/map"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { motion } from "@repo/motion"

interface Point {
  latitude: number
  longitude: number
}

const getMarker = (point: Point) => (
  <Marker latitude={point.latitude} longitude={point.longitude}>
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }} // Define exit animation
      transition={{ duration: 0.5 }}
      className="impact-marker"
    ></motion.div>
  </Marker>
)

function SectionImpact() {
  return (
    <>
      <City />
      <Agriculture />
      <Transition />
      <Salmon />
      <Delta />
      <Groundwater />
      <Drinking />
      <Climate />
    </>
  )
}

function City() {
  const content = storyline.impact
  const viewState = cityMapViewState
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveTo() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      ...MapTransitions.SMOOTH,
    })

    const markers = markersToAdd()
    if (setMotionChildren) {
      setMotionChildren(markers)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveTo()
      }
    },
    { threshold: 0.5 },
  )

  const markersToAdd = () => {
    return Object.entries(population).map(([key, chunk]) => {
      const [longitude, latitude] = chunk["coordinates"]
      return (
        <Marker
          latitude={latitude as number}
          longitude={longitude as number}
          key={key}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }} // Define exit animation
            transition={{ duration: 0.5 }}
            className="city-marker"
          ></motion.div>
        </Marker>
      )
    })
  }

  const data = useMemo(() => {
    const norcal = ["sanfrancisco", "sanjose"]
    const socal = ["losangeles", "sandiego"]
    const norCal = norcal.reduce(
      (acc, city) => {
        const cityData = population[city as keyof typeof population]
        return {
          pastPopulation:
            acc.pastPopulation + (parseInt(cityData?.population["1940"]) || 0),
          currentPopulation:
            acc.currentPopulation +
            (parseInt(cityData?.population["2024"]) || 0),
          cities: [...acc.cities, cityData?.city],
        }
      },
      { pastPopulation: 0, currentPopulation: 0, cities: [] as string[] },
    )
    const soCal = socal.reduce(
      (acc, city) => {
        const cityData = population[city as keyof typeof population]
        return {
          pastPopulation:
            acc.pastPopulation + (parseInt(cityData?.population["1940"]) || 0),
          currentPopulation:
            acc.currentPopulation +
            (parseInt(cityData?.population["2024"]) || 0),
          cities: [...acc.cities, cityData?.city],
        }
      },
      { pastPopulation: 0, currentPopulation: 0, cities: [] as string[] },
    )

    return {
      norcal: {
        ...norCal,
        title: "NorCal",
      },
      socal: {
        ...soCal,
        title: "SoCal",
      },
    }
  }, [])

  return (
    <SectionContainer id="city">
      <Box
        ref={ref}
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
        <div style={{ height: "12%", width: "80%" }} className="paragraph">
          <Pictogram
            partialValue={data.norcal.pastPopulation}
            totalValue={data.norcal.currentPopulation}
            unit={50000}
            Icon={PeopleIcon}
            title={data.norcal.title}
            reversed
            rowCount={20}
            labels={data.norcal.cities}
          />
        </div>
        <Box className="paragraph">
          <Typography variant="body1">{content.benefits.p1}</Typography>
        </Box>
        <div style={{ height: "24%", width: "80%" }} className="paragraph">
          <Pictogram
            partialValue={data.socal.pastPopulation}
            totalValue={data.socal.currentPopulation}
            unit={50000}
            Icon={PeopleIcon}
            title={data.socal.title}
            reversed
            rowCount={20}
            labels={data.socal.cities}
          />
        </div>
        <Typography variant="body2" gutterBottom sx={{ fontStyle: "italic" }}>
          {
            "*Grayed out icons represent population in 1940s. Filled icons show the population growth by 2024. One icon represents 50,000 people."
          }
        </Typography>
      </Box>
    </SectionContainer>
  )
}

function Agriculture() {
  const content = storyline.impact
  const viewState = valleyMapViewState
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveTo() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      ...MapTransitions.SMOOTH,
    })

    if (setMotionChildren) {
      setMotionChildren(null)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveTo()
      }
    },
    { threshold: 0.5 },
  )

  return (
    <SectionContainer id="agriculture">
      <Box
        ref={ref}
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
        <Box className="paragraph">
          <Typography variant="body1">{content.benefits.p2}</Typography>
        </Box>
        <div style={{ height: "15vh", width: "80%" }} className="paragraph">
          <Pictogram
            partialValue={7.5}
            totalValue={24}
            unit={1}
            Icon={AlmondIcon}
            title={"Mockup"}
            rowCount={10}
            size={55}
            reversed
          />
        </div>
        <div style={{ height: "20vh", width: "80%" }} className="paragraph">
          <Pictogram
            partialValue={11.12}
            totalValue={34.11}
            unit={1}
            Icon={RiceIcon}
            title={"Mockup"}
            rowCount={10}
            size={55}
            reversed
          />
        </div>
      </Box>
    </SectionContainer>
  )
}

function Transition() {
  const content = storyline.impact.benefits

  return (
    <SectionContainer id="transition">
      <Box
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
        <Box className="paragraph">
          <Typography variant="body1" gutterBottom>
            {content.p3}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {content.p4}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1" gutterBottom sx={{ fontWeight: "bold" }}>
            {content.transition}
          </Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

function Salmon() {
  const content = storyline.impact.salmon
  const marker = impactMarker.salmon
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveToSalmon() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [
        impactMapViewState.salmon.longitude,
        impactMapViewState.salmon.latitude,
      ],
      zoom: impactMapViewState.salmon.zoom,
      ...MapTransitions.SMOOTH,
    })

    const markerToAdd = getMarker(marker)
    if (setMotionChildren) {
      setMotionChildren(markerToAdd)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveToSalmon()
      }
    },
    { threshold: 0.5 },
  )

  return (
    <>
      <SectionContainer id="salmon">
        <Box
          ref={ref}
          className="container"
          height="100vh"
          sx={{ justifyContent: "center" }}
        >
          <Box className="paragraph">
            <Typography variant="body1">
              {content.p1} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">
              {content.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">
              {content.p31}{" "}
              <span style={{ fontWeight: "bold" }}>
                <u>{content.p32}</u>
              </span>{" "}
              <LibraryBooksIcon
                sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
              />{" "}
              {content.p33}
            </Typography>
          </Box>
          <div className="paragraph">
            <Image
              src="/impact/salmon.jpg"
              alt="Salmon"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </div>
        </Box>
      </SectionContainer>
    </>
  )
}

function Delta() {
  const content = storyline.impact.delta
  const marker = impactMarker.delta
  const viewState = impactMapViewState.delta
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveToDelta() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      ...MapTransitions.SMOOTH,
    })

    const markerToAdd = getMarker(marker)
    if (setMotionChildren) {
      setMotionChildren(markerToAdd)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveToDelta()
      }
    },
    { threshold: 0.5 },
  )

  return (
    <>
      <SectionContainer id="delta">
        <Box
          ref={ref}
          className="container"
          height="100vh"
          sx={{ justifyContent: "center" }}
        >
          <Box className="paragraph">
            <Typography variant="body1">
              <span style={{ fontWeight: "bold" }}>
                <u>{content.p11}</u>
              </span>{" "}
              <LibraryBooksIcon
                sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
              />{" "}
              {content.p12}
            </Typography>
            <Typography variant="body1">{content.p2}</Typography>
            <Typography variant="body1">
              {content.p3} {content.p4}{" "}
              <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">{content.p5}</Typography>
          </Box>
          <div className="paragraph">
            <Image
              src="/impact/delta.jpg"
              alt="Delta"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </div>
        </Box>
      </SectionContainer>
    </>
  )
}

function Groundwater() {
  const content = storyline.impact.groundwater
  const marker = impactMarker.groundwater
  const viewState = impactMapViewState.groundwater
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveTo() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      ...MapTransitions.SMOOTH,
    })

    const markerToAdd = getMarker(marker)
    if (setMotionChildren) {
      setMotionChildren(markerToAdd)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveTo()
      }
    },
    { threshold: 0.5 },
  )

  return (
    <>
      <SectionContainer id="groundwater">
        <Box
          ref={ref}
          className="container"
          height="100vh"
          sx={{ justifyContent: "center" }}
        >
          <Box className="paragraph">
            <Typography variant="body1">{content.p1}</Typography>
            <Typography variant="body1">
              {content.p21}{" "}
              <span style={{ fontWeight: "bold" }}>
                <u>{content.p22}</u>
              </span>{" "}
              <LibraryBooksIcon
                sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
              />
              {""}
              {content.p23}
            </Typography>
          </Box>
          <div className="paragraph">
            <Image
              src="/impact/groundwater.jpg"
              alt="Groundwater"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </div>
          <Box className="paragraph">
            <Typography variant="body1">{content.p3}</Typography>
          </Box>
        </Box>
      </SectionContainer>
    </>
  )
}

function Drinking() {
  const content = storyline.impact.drinking
  const marker = impactMarker.drinkingwater
  const viewState = impactMapViewState.drinkingwater
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveTo() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      ...MapTransitions.SMOOTH,
    })

    const markerToAdd = getMarker(marker)
    if (setMotionChildren) {
      setMotionChildren(markerToAdd)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveTo()
      }
    },
    { threshold: 0.5 },
  )

  return (
    <>
      <SectionContainer id="drinking">
        <Box
          ref={ref}
          className="container"
          height="90vh"
          sx={{ justifyContent: "center" }}
        >
          <Box className="paragraph">
            <Typography variant="body1">{content.p1}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">
              {content.p21}{" "}
              <span style={{ fontWeight: "bold" }}>
                <u>{content.p22}</u>
              </span>{" "}
              <LibraryBooksIcon
                sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
              />
              {""}
              {content.p23}
            </Typography>
          </Box>
          <div className="paragraph">
            <Image
              src="/impact/drinking-water.jpg"
              alt="Drinking"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </div>
        </Box>
      </SectionContainer>
    </>
  )
}

function Climate() {
  const content = storyline.impact.climate
  const marker = impactMarker.climate
  const viewState = impactMapViewState.climate
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef, setMotionChildren } = useMap()

  function moveTo() {
    if (!mapRef.current) return

    mapRef.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      ...MapTransitions.SMOOTH,
    })

    const markerToAdd = getMarker(marker)
    if (setMotionChildren) {
      setMotionChildren(markerToAdd)
    }
  }

  useIntersectionObserver(
    ref,
    (isIntersecting) => {
      if (isIntersecting) {
        moveTo()
      }
    },
    { threshold: 0.5 },
  )

  return (
    <>
      <SectionContainer id="climate">
        <Box
          ref={ref}
          className="container"
          height="100vh"
          sx={{ justifyContent: "center" }}
        >
          <Box className="paragraph">
            <Typography variant="body1">
              <span style={{ fontWeight: "bold" }}>
                <u>{content.p11}</u>
              </span>{" "}
              <LibraryBooksIcon
                sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
              />{" "}
              {content.p12}
            </Typography>
            <Typography variant="body1">
              {content.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
            </Typography>
            <Typography variant="body1">{content.p3}</Typography>
          </Box>
          <div className="paragraph">
            <Image
              src="/impact/climate-change.jpg"
              alt="Climate"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </div>
        </Box>
      </SectionContainer>
    </>
  )
}

export default SectionImpact
