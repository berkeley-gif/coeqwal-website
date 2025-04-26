"use client"

import { Box, Typography, VisibilityIcon, LibraryBooksIcon } from "@repo/ui/mui"
import population from "../../public/data/city_population.json" assert { type: "json" }
import Pictogram from "./vis/Pictogram"
import PeopleIcon from "./helpers/Icons/PeopleIcon"
import { useMemo } from "react"
import RiceIcon from "./helpers/Icons/RiceIcon"
import AlmondIcon from "./helpers/Icons/AlmondIcon"
import {
  cityMapViewState,
  impactMapViewState,
  valleyMapViewState,
} from "./helpers/mapViews"
import { useMap } from "@repo/map"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import useStory from "../story/useStory"
import useActiveSection from "../hooks/useActiveSection"

/*
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
)*/

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
  const { storyline } = useStory()
  const content = storyline?.impact
  const sectionRef = useActiveSection("city", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveTo() {
    if (!mapRef.current?.getMap()) return
    flyTo({
      longitude: cityMapViewState.longitude,
      latitude: cityMapViewState.latitude,
      zoom: cityMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  /*
  const markersToAdd = () => {
    return Object.entries(population).map(([key, chunk]) => {
      const { coordinates } = chunk as { coordinates: [number, number] }
      const [longitude, latitude] = coordinates
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
  }*/

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

  useIntersectionObserver(
    sectionRef,
    ["city"],
    ["transformation", "agriculture"],
    moveTo,
    () => {},
    { threshold: 0.5 },
  )

  return (
    <Box
      ref={sectionRef}
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
        <Typography variant="body1">{content?.benefits.p1}</Typography>
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
  )
}

function Agriculture() {
  const { storyline } = useStory()
  const content = storyline?.impact
  const sectionRef = useActiveSection("agriculture", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveTo() {
    if (!mapRef.current?.getMap()) return
    flyTo({
      longitude: valleyMapViewState.longitude,
      latitude: valleyMapViewState.latitude,
      zoom: valleyMapViewState.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(
    sectionRef,
    ["agriculture"],
    ["city", "salmon"],
    moveTo,
    () => {},
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
        <Typography variant="body1">{content?.benefits.p2}</Typography>
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
  )
}

function Transition() {
  const { storyline } = useStory()
  const content = storyline?.impact.benefits
  const sectionRef = useActiveSection("economy", { amount: 0.5 })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="body1" gutterBottom>
          {content?.p3}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {content?.p4}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1" gutterBottom sx={{ fontWeight: "bold" }}>
          {content?.transition}
        </Typography>
      </Box>
    </Box>
  )
}

function Salmon() {
  const { storyline } = useStory()
  const content = storyline?.impact.salmon
  const sectionRef = useActiveSection("impact-salmon", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveToSalmon() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    flyTo({
      longitude: impactMapViewState.salmon.longitude,
      latitude: impactMapViewState.salmon.latitude,
      zoom: impactMapViewState.salmon.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(
    sectionRef,
    ["impact-salmon"],
    [],
    moveToSalmon,
    () => {},
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
        <Typography variant="body1">
          {content?.p31}{" "}
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p32}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p33}
        </Typography>
      </Box>
    </Box>
  )
}

function Delta() {
  const { storyline } = useStory()
  const content = storyline?.impact.delta
  const sectionRef = useActiveSection("impact-delta", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveTo() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    flyTo({
      longitude: impactMapViewState.delta.longitude,
      latitude: impactMapViewState.delta.latitude,
      zoom: impactMapViewState.delta.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(sectionRef, ["impact-delta"], [], moveTo, () => {}, {
    threshold: 0.5,
  })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="body1">
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Typography>
        <Typography variant="body1">{content?.p2}</Typography>
        <Typography variant="body1">
          {content?.p3} {content?.p4}{" "}
          <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">{content?.p5}</Typography>
      </Box>
      <div className="paragraph"></div>
    </Box>
  )
}

function Groundwater() {
  const { storyline } = useStory()
  const content = storyline?.impact.groundwater
  const sectionRef = useActiveSection("impact-groundwater", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveTo() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    flyTo({
      longitude: impactMapViewState.groundwater.longitude,
      latitude: impactMapViewState.groundwater.latitude,
      zoom: impactMapViewState.groundwater.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(
    sectionRef,
    ["impact-groundwater"],
    [],
    moveTo,
    () => {},
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
        <Typography variant="body1">{content?.p1}</Typography>
        <Typography variant="body1">
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p22}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />
          {""}
          {content?.p23}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.p3}</Typography>
      </Box>
    </Box>
  )
}

function Drinking() {
  const { storyline } = useStory()
  const content = storyline?.impact.drinking
  const sectionRef = useActiveSection("impact-water", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveTo() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    flyTo({
      longitude: impactMapViewState.drinkingwater.longitude,
      latitude: impactMapViewState.drinkingwater.latitude,
      zoom: impactMapViewState.drinkingwater.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(sectionRef, ["impact-water"], [], moveTo, () => {}, {
    threshold: 0.5,
  })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="90vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="body1">{content?.p1}</Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p22}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />
          {""}
          {content?.p23}
        </Typography>
      </Box>
    </Box>
  )
}

function Climate() {
  const { storyline } = useStory()
  const content = storyline?.impact.climate
  const sectionRef = useActiveSection("impact-climate", { amount: 0.5 })
  const { mapRef, flyTo } = useMap()

  function moveTo() {
    const mapInst = mapRef.current?.getMap()
    if (!mapInst) return
    flyTo({
      longitude: impactMapViewState.climate.longitude,
      latitude: impactMapViewState.climate.latitude,
      zoom: impactMapViewState.climate.zoom,
      transitionOptions: {
        duration: 2000,
      },
    })
  }

  useIntersectionObserver(sectionRef, ["impact-water"], [], moveTo, () => {}, {
    threshold: 0.5,
  })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="body1">
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Typography>
        <Typography variant="body1">
          {content?.p2} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">{content?.p3}</Typography>
      </Box>
    </Box>
  )
}

export default SectionImpact
