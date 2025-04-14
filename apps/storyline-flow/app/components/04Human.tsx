import React, { useRef } from "react"
import Image from "next/image"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import SectionContainer from "./helpers/SectionContainer"
import { useMap } from "@repo/map"
import { Box, Typography } from "@repo/ui/mui"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"
import { stateMapViewState } from "./helpers/mapViews"

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
  const content = storyline.economy
  const ref = useRef<HTMLDivElement>(null)
  const { mapRef } = useMap() // from our context

  useIntersectionObserver(
    ref,
    (isInterSecting) => {
      if (isInterSecting && mapRef.current) {
        console.log("hello")
        mapRef.current?.flyTo(
          stateMapViewState.longitude,
          stateMapViewState.latitude,
          stateMapViewState.zoom,
        )
      }
    },
    { threshold: 0 },
  )

  return (
    <SectionContainer id="economy">
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
          <Typography variant="body1">{content.p3}</Typography>
          <Typography variant="body1">{content.p4}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

function Irrigation() {
  const content = storyline.economy.irrigation
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container

  return (
    <>
      <SectionContainer id="irrigation">
        <Box className="container" height="100vh">
          <Box ref={ref} className="paragraph">
            <Typography variant="body1">{content.p1}</Typography>
            <Typography variant="body1">{content.p2}</Typography>
          </Box>
          <Box className="paragraph">
            <Image
              src="/economy/mining.jpg"
              alt="Irrigation"
              width={1000}
              height={600}
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>
      </SectionContainer>
    </>
  )
}

function Drinking() {
  const content = storyline.economy.drinking

  return (
    <>
      <SectionContainer id="drinking">
        <Box className="container" height="100vh">
          <Box className="paragraph">
            <Typography variant="body1">{content.p1}</Typography>
            <Typography variant="body1">{content.p2}</Typography>
          </Box>
          <Box className="paragraph">
            <Image
              src="/economy/water.jpg"
              alt="Drinking"
              width={1000}
              height={700}
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Box>
      </SectionContainer>
    </>
  )
}

export default SectionHuman
