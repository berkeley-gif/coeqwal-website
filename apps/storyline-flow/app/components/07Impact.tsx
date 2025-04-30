"use client"

import { Box, LibraryBooksIcon } from "@repo/ui/mui"
import { useCallback } from "react"
import {
  impactClimateMapViewState,
  impactDeltaMapViewState,
  impactDrinkingMapViewState,
  impactGroundMapViewState,
  impactSalmonMapViewState,
} from "./helpers/mapViews"
import { useMap } from "@repo/map"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { useSectionLifecycle } from "../hooks/useSectionLifeCycle"
import { Sentence } from "@repo/motion/components"
import { useBreakpoint } from "@repo/ui/hooks"

function SectionImpact() {
  return (
    <>
      <Transition />
      <Salmon />
      <Delta />
      <Groundwater />
      <Drinking />
      <Climate />
    </>
  )
}

function Transition() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.benefits
  const { sectionRef } = useActiveSection("turning", { amount: 0.5 })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence variant="h3" gutterBottom custom={0}>
          {content?.p4}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence
          variant="h3"
          gutterBottom
          sx={{ fontWeight: "bold" }}
          custom={2}
        >
          {content?.transition}
        </Sentence>
      </Box>
    </Box>
  )
}

function Salmon() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.salmon
  const { sectionRef, isSectionActive } = useActiveSection("impact-salmon", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactSalmonMapViewState[breakpoint]

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence custom={0}>{content?.p1}</Sentence>
        <Sentence custom={1}>{content?.p2}</Sentence>
        <Sentence custom={2}>
          {content?.p31}{" "}
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p32}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p33}
        </Sentence>
      </Box>
    </Box>
  )
}

function Delta() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.delta
  const { sectionRef, isSectionActive } = useActiveSection("impact-delta", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactDeltaMapViewState[breakpoint]

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence custom={0}>
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Sentence>
        <Sentence custom={1}>{content?.p2}</Sentence>
        <Sentence custom={2}>
          {content?.p3} {content?.p4}{" "}
        </Sentence>
        <Sentence custom={3}>{content?.p5}</Sentence>
      </Box>
    </Box>
  )
}

function Groundwater() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.groundwater
  const { sectionRef, isSectionActive } = useActiveSection(
    "impact-groundwater",
    { amount: 0.5 },
  )
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactGroundMapViewState[breakpoint]

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence custom={0}>{content?.p1}</Sentence>
        <Sentence custom={1}>
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p22}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />
          {""}
          {content?.p23}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={2.5}>{content?.p3}</Sentence>
      </Box>
    </Box>
  )
}

function Drinking() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.drinking
  const { sectionRef, isSectionActive } = useActiveSection("impact-water", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactDrinkingMapViewState[breakpoint]

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="90vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence custom={1}>{content?.p1}</Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={2}>
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p22}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />
          {""}
          {content?.p23}
        </Sentence>
      </Box>
    </Box>
  )
}

function Climate() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.climate
  const { sectionRef, isSectionActive } = useActiveSection("impact-climate", {
    amount: 0.5,
  })
  const { flyTo } = useMap()
  const breakpoint = useBreakpoint()
  const mapViewState = impactClimateMapViewState[breakpoint]

  const load = useCallback(() => {
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
  }, [flyTo, mapViewState])

  useSectionLifecycle(
    isSectionActive,
    () => {},
    load,
    () => {},
  )

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence custom={0}>
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Sentence>
        <Sentence custom={1}>{content?.p2}</Sentence>
        <Sentence custom={2}>{content?.p3}</Sentence>
      </Box>
    </Box>
  )
}

export default SectionImpact
