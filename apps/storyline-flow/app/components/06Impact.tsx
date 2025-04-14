import { Box, Typography } from "@repo/ui/mui"
import SectionContainer from "./helpers/SectionContainer"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import population from "../../public/data/city_population.json" assert { type: "json" }
import { LibraryBooksIcon } from "@repo/ui/mui"
import Pictogram from "./vis/Pictogram"
import PeopleIcon from "./helpers/PeopleIcon"
import { useMemo } from "react"
import RiceIcon from "./helpers/RiceIcon"
import AlmondIcon from "./helpers/AlmondIcon"
import Image from "next/image"

function SectionImpact() {
  return (
    <>
      <City />
      <Agriculture />
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
      </Box>
    </SectionContainer>
  )
}

function Agriculture() {
  const content = storyline.impact

  return (
    <SectionContainer id="agriculture">
      <Box
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
            title={"Almond"}
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
            title={"Rice"}
            rowCount={10}
            size={55}
            reversed
          />
        </div>
      </Box>
    </SectionContainer>
  )
}

function Salmon() {
  const content = storyline.impact.salmon
  return (
    <>
      <SectionContainer id="salmon">
        <Box
          className="container"
          height="100vh"
          sx={{ justifyContent: "center" }}
        >
          <Box className="paragraph">
            <Typography variant="body1">{content.p1}</Typography>
            <Typography variant="body1">{content.p2}</Typography>
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

  return (
    <>
      <SectionContainer id="delta">
        <Box
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
              {content.p3} {content.p4}
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

  return (
    <>
      <SectionContainer id="groundwater">
        <Box
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

  return (
    <>
      <SectionContainer id="drinking">
        <Box
          className="container"
          height="50vh"
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

  return (
    <>
      <SectionContainer id="climate">
        <Box
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
