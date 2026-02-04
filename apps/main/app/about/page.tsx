"use client"

/**
 * About Page - Information about the COEQWAL project
 *
 * Provides background information on funding and methodology
 */

import React, { useState, useEffect } from "react"
import {
    Box,
    Typography,
    Container,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    IconButton,
    CircularProgress,
    SelectChangeEvent,
    Alert,
} from "@repo/ui/mui"
import { Header } from "../components/Header"
import { CenterImageText } from "../components/CenterImageText"
import { TieredImageText } from "../components/TieredImageText"
import { ArrowHead } from "@repo/ui"
import { useTheme } from "@repo/ui/mui"
import { MainContent } from "../components/MainContent"

export default function AboutPage() {
    const theme = useTheme()

    useEffect(() => {
        console.log('about page')
    }, [])

    return (
        <>
            <MainContent>
                <Header />
                <CenterImageText
                    id="intro"
                    ariaLabel="intro"
                    backgroundColor="#3D7DB5"
                    bodyTextBold="COEQWAL – the Collaboratory for Equity in Water Allocation"
                    bodyText="- is a collaborative, community-engaged research project aimed at delivering actionable information for water management planning in California. 
                    Until now, water planning tools used by the state have been inaccessible to most communities, especially to those historically excluded from decision-making. 
                    COEQWAL is working to change that. "
                    scrollToId=""
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
            </MainContent >
        </>
    )
}
