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
                    bodyText="- is a collaborative, community-engaged research project aimed at delivering actionable information for water management planning in California. Until now, water planning tools used by the state have been inaccessible to most communities, especially to those historically excluded from decision-making. COEQWAL is working to change that. "
                    scrollToId=""
                    imgSrc="/images/about/collage_Learn_full.png"
                    paddingTop={theme.layout.headerHeight}
                />
            </MainContent >
        </>
    )
}
