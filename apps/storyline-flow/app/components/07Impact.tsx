"use client"

import { Box, LibraryBooksIcon } from "@repo/ui/mui"
import { useCallback, useState } from "react"
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
import ScrollIndicator from "./helpers/ScrollIndicator"

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
  const [animationComplete, setAnimationComplete] = useState(false)

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
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.transition}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
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
  const [animationComplete, setAnimationComplete] = useState(false)
  const setMarkers = useStoryStore((state) => state.setMarkers)

  const load = useCallback(() => {
    const marker = {
      id: "1",
      name: "Red Bluff",
      longitude: -122.2358,
      latitude: 40.1786,
    }
    flyTo({
      longitude: mapViewState?.longitude ?? 0,
      latitude: mapViewState?.latitude ?? 0,
      zoom: mapViewState?.zoom ?? 1,
      transitionOptions: {
        duration: 2000,
      },
    })
    setMarkers([marker], "rough-circle")
  }, [flyTo, mapViewState, setMarkers])

  const unload = useCallback(() => {
    setMarkers([], "rough-circle")
  }, [setMarkers])

  useSectionLifecycle(isSectionActive, () => {}, load, unload)

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
        <Sentence
          custom={2}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
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
      <ScrollIndicator animationComplete={animationComplete} />
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
  const [animationComplete, setAnimationComplete] = useState(false)

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
        <Sentence
          custom={3}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.p5}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
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
  const [animationComplete, setAnimationComplete] = useState(false)

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
        <Sentence
          custom={2.5}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.p3}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
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
  const [animationComplete, setAnimationComplete] = useState(false)

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
        <Sentence
          custom={2}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
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
      <ScrollIndicator animationComplete={animationComplete} />
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
  const [animationComplete, setAnimationComplete] = useState(false)

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
        <Sentence
          custom={2}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {content?.p3}
        </Sentence>
      </Box>
      <ScrollIndicator animationComplete={animationComplete} />
    </Box>
  )
}

export default SectionImpact
