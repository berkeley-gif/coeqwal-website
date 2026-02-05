"use client"

/**
 * Scroll Image Text Blocks - This block has a title and a set of image and text blocks to follow a narrative
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text for images
 * - WCAG 1.3.1: Semantic <section> with aria-label
 */

import React, { useMemo } from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { fadeIn, fadeInRight } from "../lib/constants/motionAnimations"

export interface ImageTextBlock {
    imgSrc: string,
    imgAlt: string,
    text: string,
    imagePosition: "left" | "right" // New prop to control layout
}

export interface ScrollImageTextBlocksProps {
    /** Panel ID for navigation */
    id: string
    /** Accessible label for the section */
    ariaLabel: string
    /** Title for the section */
    title: string
    /** Image text blocks */
    imageTextBlocks: ImageTextBlock[]
    /** Background image */
    backgroundSrc: string
}

export function ScrollImageTextBlocks({
    id,
    ariaLabel,
    title,
    imageTextBlocks,
    backgroundSrc,
}: ScrollImageTextBlocksProps) {
    const theme = useTheme()
    return (
        <Box
            component="section"
            id={id}
            aria-label={ariaLabel}
            sx={{
                pointerEvents: "auto",
                backgroundImage: `url(${backgroundSrc}.jpg)`,
                backgroundSize: "100% auto", // Full width, height stretches with content
                backgroundRepeat: "repeat",
                backgroundPosition: "top center",
                minHeight: "100vh", // Optional: ensures minimum height
                paddingBottom: `${theme.layout.headerHeight + 25}px`,
            }}
        >
            {/* Title */}
            <Box
                component={motion.div}
                initial="hidden"
                whileInView="show"
                sx={{
                    listStyle: "none",
                    width: "50%",
                    paddingTop: `${theme.layout.headerHeight + 25}px`,
                    paddingBottom: `70px`,
                    paddingLeft: "25%",
                    color: theme.palette.blue.darkest,
                    position: "sticky",
                    top: 0,
                    zIndex: 0,
                }}
                variants={fadeIn}

            >
                <Typography
                    variant="h4"
                >
                    {title}
                </Typography>
            </Box>

            <Box
                component="div"
                sx={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "row",
                    gap: "75px"
                }}
            >
                { /* Image Text Blocks */}
                {renderImageTextBlocks(imageTextBlocks)}
            </Box>
        </Box>
    )
}

function renderImageTextBlocks(rawBlocks: ImageTextBlock[]) {
    const theme = useTheme()

    return (
        <Box
            component="div"
            sx={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                gap: "175px", // Spacing between blocks
            }}
        >
            {rawBlocks?.map((block, index) => (
                <Box
                    component={motion.div}
                    initial="hidden"
                    whileInView="show"
                    variants={fadeInRight}
                    key={index}
                    sx={{
                        display: "flex",
                        width: "100%",
                        flexDirection: block.imagePosition === "left" ? "row" : "row-reverse",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "30px", // 30px gap = 15px on each side of center
                        zIndex: 1,
                    }}
                >
                    <Box
                        component="img"
                        src={block.imgSrc}
                        alt={block.imgAlt}
                        sx={{
                            width: "450px",
                            height: "auto",
                            objectFit: "contain",
                            marginRight: block.imagePosition === "left" ? "-15px" : "0",
                            marginLeft: block.imagePosition === "right" ? "-15px" : "0",
                        }}
                    />
                    <Typography
                        variant="body1"
                        sx={{
                            width: "420px",
                            flexShrink: 0, // Prevents it from shrinking below 420px
                            textAlign: "left",
                            background: block.imagePosition === "right" ? theme.palette.common.white : '',
                            paddingTop: block.imagePosition === "right" ? '25px' : '',
                            paddingLeft: block.imagePosition === "left" ? "15px" : "0",
                            paddingRight: block.imagePosition === "right" ? "15px" : "0",
                            fontSize: "1.125rem", // Only change this - increases text size
                            lineHeight: 1.7, // Adjust line spacing for readability
                        }}
                    >
                        {block.text}
                    </Typography>
                </Box>
            ))}
        </Box>
    )
}