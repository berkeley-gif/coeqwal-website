"use client"

import React, { useRef } from "react"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import { Box, Typography, VisibilityIcon } from "@repo/ui/mui"
import { LibraryBooksIcon } from "@repo/ui/mui"
import SectionContainer from "./helpers/SectionContainer"
import { MapTransitions, useMap } from "@repo/map"
import { stateMapViewState } from "./helpers/mapViews"
import { useIntersectionObserver } from "../hooks/useIntersectionObserver"

function SectionTransformation() {
  return (
    <>
      <Transformation />
    </>
  )
}

//TODO: pop up those
// Use waterdrop for dams
function Transformation() {
  const content = storyline.transformation
  const viewState = stateMapViewState
  const ref = useRef<HTMLDivElement>(null) // Reference to the component's container
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
    <SectionContainer id="transformation">
      <Box
        ref={ref}
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
        <Box className="paragraph">
          <Typography variant="h2" gutterBottom>
            {content.subtitle}
          </Typography>
        </Box>
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
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {content.p21}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p22}</span>{" "}
            {content.p23} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">
            {content.p31}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p32}</span>{" "}
            {content.p33} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
          <Typography variant="body1">
            {content.p41}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p42}</span>{" "}
            {content.p43} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.transition}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

export default SectionTransformation
