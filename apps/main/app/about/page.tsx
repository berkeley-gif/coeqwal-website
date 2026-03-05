"use client"

/**
 * About Page - Information about the COEQWAL project
 *
 * Provides background information on funding and methodology
 */

import React, { useEffect } from "react"
import { useTheme } from "@repo/ui/mui"
import { Header } from "../components/Header"
import { CenterImageText } from "../components/CenterImageText"
import { TieredImageText } from "../components/TieredImageText"
import { ScrollImageTextBlocks } from "../components/ScrollImageTextBlocks"
import { LogoGrid } from "../components/LogoGrid"
import { CenteredTextSection } from "../components/CenteredTextSection"
import type { ImageTextBlock } from "../components/ScrollImageTextBlocks"
import type { GridLogo } from "../components/LogoGrid"

export default function AboutPage() {
  const theme = useTheme()

  const imageTextBlocks: ImageTextBlock[] = [
    {
      imgSrc: "/images/about/approach-person-whiteboard.png",
      imgAlt: "A person writing on a whiteboard",
      text: "Our work is structured around a participatory scenario planning approach. It is an iterative process that involves the use of a water resources planning model (CalSim) to develop and analyze a broad range of alternative water management scenarios for the state.",
      imagePosition: "left",
    },
    {
      imgSrc: "/images/about/approach-person-projector.png",
      imgAlt: "A person on a podium with a projection behind",
      text: "We next share the results of the scenarios – describing patterns and amounts of water allocated to different water users and the environment – with community partners, who provide feedback on the specific scenarios that were run, how they were evaluated, and the manner in which they were presented. ",
      imagePosition: "right",
    },
    {
      imgSrc: "/images/about/approach-discussion-field.png",
      imgAlt: "Three people discussing on the field",
      text: "Community feedback is then used to refine our scenarios and inform the next phase of work, which again, is shared with our partners for additional input. This is an intensive, collaborative process that has involved engagement with over 60 representatives from state and federal agencies, water districts, NGOs, community-based organizations, academic institutions, and Native American Tribes. ",
      imagePosition: "left",
    },
  ]

  const logos: GridLogo[] = [
    {
      src: "/images/about/logos/agwa.png",
      alt: "AGWA logo",
      width: 311,
    },
    {
      src: "/images/about/logos/cwc.png",
      alt: "CWC logo",
      width: 380,
    },
    {
      src: "/images/about/logos/noaa_fisheries.png",
      alt: "AGWA logo",
      width: 201,
    },
    {
      src: "/images/about/logos/ucdavisunofficialseal_blk.png",
      alt: "UC Davis logo",
      width: 120,
    },

    {
      src: "/images/about/logos/trout-unlimited.png",
      alt: "Trout unlimited logo",
      width: 350,
    },
    {
      src: "/images/about/logos/california-department-of-water-resources.png",
      alt: "Department of water resources logo",
      width: 101,
    },
    {
      src: "/images/about/logos/california-water-boards.png",
      alt: "California Water Boards logo",
      width: 330,
    },
    {
      src: "/images/about/logos/union-concerned-scientists.png",
      alt: "Union of Concerned Scientists logo",
      width: 205,
    },
  ]

  // This effect keeps motion from creating a margin with fadeIn of the first section
  useEffect(() => {
    // Prevent scroll restoration
    window.history.scrollRestoration = "manual"

    // Force scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

  useEffect(() => {
    // Guard required: this effect touches browser-only APIs (window.history, window.scrollTo).
    if (typeof window === "undefined") return

    window.history.scrollRestoration = "manual"
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

    const timer = setTimeout(() => {
        if (window.scrollY > 0) {
            console.log("Page shifted! Scroll position:", window.scrollY)
            window.scrollTo(0, 0)
        }
    }, 100)

    // Clean up the timeout if the component unmounts before it fires.
    // Without this, the callback could run against an unmounted component.
    return () => clearTimeout(timer)
}, [])

  return (
    <>
      <Header />
      <CenterImageText
        id="intro"
        ariaLabel="intro"
        backgroundColor={theme.palette.brand.panelMedium}
        bodyTextBold="COEQWAL – the Collaboratory for Equity in Water Allocation"
        bodyText="- is a collaborative, community-engaged research project aimed at delivering actionable information for water management planning in California. 
                    Until now, water planning tools used by the state have been inaccessible to most communities, especially to those historically excluded from decision-making. 
                    COEQWAL is working to change that. "
        scrollToId="projectGoals"
        imgSrc="/images/about/collage-intro.png"
        imgAlt="A collage showing a person advocating on a podium, birds flying, a river flowing, a farmer holding grapes and a child looking at a salmon inside a fish tank"
        paddingTop={theme.layout.headerHeight}
      />
      <TieredImageText
        id="projectGoals"
        ariaLabel="project goals"
        title="Project Goals"
        body1="Our overall project goal is to democratize access to data used in water planning and decision-making. 
                    Our website invites visitors to learn about California’s water system and explore how alternative water management strategies affect outcomes for cities, 
                    agriculture, and the environment. "
        body2="Tools on the sites are designed to guide visitors to specific scenarios that align with their interests. 
                    We aim to help users to better understand the nature of trade-offs among management objectives and to provide data that empowers communities 
                    to shape our water future."
        imgSrc="/images/about/tiered-image-text-hills.png"
        imgAlt="Photo of hills and farmland in california"
        logoSrc="/images/about/logo-uc-ri.png"
        logoAlt="University of California Research and Innovation"
        logoText="This project is supported by funds from the California Climate Action Seed and Matching Grants of the University of California, 
                    Grant Number R02CM7222. This funding is part of the California Climate Action Initiative, 
                    a $100 million investment in climate action research and innovation projects in the California State Budget Act of 2022-23."
      />
      <ScrollImageTextBlocks
        id="ourApproach"
        ariaLabel="our approach"
        title="Our Approach"
        backgroundSrc="/images/about/image-text-bg"
        imageTextBlocks={imageTextBlocks}
      />
      <LogoGrid
        logos={logos}
        title="Our Partners"
        id="ourPartners"
        ariaLabel="our partners"
      />
      <CenteredTextSection
        title="Get Involved"
        id="getInvolved"
        ariaLabel="get involved"
        text="Do you have questions or feedback about our project? 
                    Would you like to be involved in future phases of this work? Please email: "
        email="coeqwal@berkeley.edu"
      />
    </>
  )
}
