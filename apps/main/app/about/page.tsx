"use client"

/**
 * About page: Information about the COEQWAL project
 *
 * Provides background information on funding and methodology
 */
import React, { useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { fadeIn } from "../lib/constants/motionAnimations"
import { themeValues } from "@repo/ui/themes/theme"
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
      text: "Our work is structured around a participatory scenario planning approach. It is an iterative process that involves the use of a water resources planning model (CalSim3) to develop and analyze a broad range of alternative water management strategies for the state.",
      imagePosition: "left",
    },
    {
      imgSrc: "/images/about/approach-person-projector.png",
      imgAlt: "A person on a podium with a projection behind",
      text: "Using CalSim3, we simulate how these management strategies affect water allocation outcomes – the patterns and amounts of water allocated to different water users and the environment – under a range of possible climate futures. We then convene community partners in workshops to receive feedback on the scenarios that are run and how they are interpreted.",
      imagePosition: "right",
    },
    {
      imgSrc: "/images/about/approach-discussion-field.png",
      imgAlt: "Three people discussing on the field",
      text: "Community feedback is used to refine our scenarios and inform the next phase of work, which again, is shared with our partners for additional input. This is an intensive, collaborative process that has involved engagement with over 60 representatives from state and federal agencies, water districts, NGOs, community-based organizations, academic institutions, and Native American Tribes.",
      imagePosition: "left",
    },
  ]

  const logos: GridLogo[] = []

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
      <CenterImageText
        id="intro"
        ariaLabel="intro"
        backgroundColor={theme.palette.brand.panelMedium}
        bodyTextBold="COEQWAL – the Collaboratory for Equity in Water Allocation - "
        bodyText="is a collaborative, community-engaged project led by researchers at the University of California aimed at delivering actionable information for water management planning in California. Until now, water planning tools used by the state have been inaccessible to most communities, especially to those historically excluded from decision-making. COEQWAL is working to change that."
        scrollToId="projectGoals"
        imgSrc="/images/about/coeqwal-team-collage-hero.jpg"
        imgAlt="A collage showing a person advocating on a podium, birds flying, a river flowing, a farmer holding grapes and a child looking at a salmon inside a fish tank"
        paddingTop={theme.layout.headerHeight}
      />
      <TieredImageText
        id="projectGoals"
        ariaLabel="project goals"
        title="Project Goals"
        body1="Our overall project goal is to make data used in water planning and decision-making more accessible. Our website invites visitors to learn about California's water system and explore how alternative water management strategies affect outcomes for cities, agriculture, and the environment."
        body2="Tools on the sites are designed to guide visitors to specific scenarios that align with their interests. We aim to help users to better understand the nature of trade-offs among management objectives and to provide data that empower communities to shape our water future."
        imgSrc="/images/about/tiered-image-text-hills.png"
        imgAlt="Photo of hills and farmland in california"
        logoSrc="/images/about/logo-uc-ri.png"
        logoAlt="University of California Research and Innovation"
        logoText={
          <>
            This project is supported by funds from the{" "}
            <Typography
              component="a"
              href="https://uckeepresearching.org/california-climate-action/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "inherit", textDecoration: "underline" }}
            >
              California Climate Action Seed
            </Typography>{" "}
            and Matching Grants of the University of California, Grant Number
            R02CM7222. This funding is part of the California Climate Action
            Initiative, a $100 million investment in climate action research and
            innovation projects in the California State Budget Act of
            2022-23.&rdquo;
          </>
        }
      />
      <ScrollImageTextBlocks
        id="ourApproach"
        ariaLabel="our approach"
        title="Our Approach"
        backgroundSrc="/images/about/image-text-bg"
        imageTextBlocks={imageTextBlocks}
      />
      <Box
        component="section"
        id="ourApproachAdditionalText"
        aria-label="our approach additional text"
        sx={{
          pointerEvents: "auto",
          background: theme.palette.blue.pale,
          paddingTop: `${theme.layout.headerHeight + 25}px`,
          paddingBottom: `${theme.layout.headerHeight + 25}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "left",
          justifyContent: "left",
          color: theme.palette.blue.darkest,
          paddingX: { xs: "24px", sm: "40px", md: "0" },
        }}
      >
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="show"
          variants={fadeIn}
          sx={{
            width: "100%",
            maxWidth: "800px", // Max width of grid
            margin: "60px auto", // Centers the grid horizontally
            textAlign: "left",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              maxSize: themeValues.spacing.paragraphMaxWidth.default,
              paddingBottom: "25px",
            }}
          >
            COEQWAL uses CalSim3 in a way that differs from its typical
            application. Agencies generally develop a small number of CalSim3
            model scenarios to inform specific regulatory decisions and planning
            processes. COEQWAL instead takes an exploratory approach, using a
            wide range of scenarios to understand how California&apos;s water
            system responds to different management strategies and climate
            futures.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxSize: themeValues.spacing.paragraphMaxWidth.default,
              paddingBottom: "25px",
            }}
          >
            COEQWAL scenarios reflect generalized variations in system
            operations and climate. They were developed through collaborative
            engagement with community partners. Scenarios are not calibrated to
            specific outcomes, locations, regulatory requirements, or agency
            priorities (beyond those already represented in CalSim3), and are
            not intended for direct use in legal or regulatory proceedings.
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxSize: themeValues.spacing.paragraphMaxWidth.default }}
          >
            COEQWAL is an independent research project that does not advocate
            for any specific policy, water allocation strategy, or action.
            COEQWAL aims to broaden access to CalSim3 model data, build
            understanding of California&apos;s water system, and support broader
            participation in decisions about California&apos;s water future.
          </Typography>
        </Box>
      </Box>
      <LogoGrid
        logos={logos}
        title="Our Partners"
        id="ourPartners"
        ariaLabel="our partners"
      />
      <CenteredTextSection
        title="Contact Us!"
        id="getInvolved"
        ariaLabel="contact us"
        text="Do you have questions or feedback about our project? 
                    Would you like to be involved in future phases of this work? Please contact us at "
        email="coeqwal@berkeley.edu"
      />
    </>
  )
}
