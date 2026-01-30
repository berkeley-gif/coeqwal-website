"use client"

/**
 * Center Image Text - Centered image with text underneath
 *
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic <section> with aria-label
 * - WCAG 2.3.3: Reduced motion handled globally via MotionConfig in ThemeRegistry
 * - WCAG 2.4.7: Focus-visible on scroll button (via ScrollToButton)
 * - WCAG 4.1.2: Proper aria-labels on interactive elements
 * - Responsive: Same layout behavior as VideoHero (centered on mobile <900px)
 */

import React from "react"
import { motion } from "@repo/motion"
import { ScrollToButton, DisplayBlock, Panel } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"

const MotionBox = motion.create(Box)

export interface CenterImageTextProps {
    /** Panel ID for navigation */
    id: string
    /** Accessible label for the section */
    ariaLabel: string
    /** Background color (theme color or CSS value) */
    backgroundColor: string
    /** Padding for the top (optional) */
    paddingTop: number
    /** Body text bolded section (optional) */
    bodyTextBold?: string
    /** Body text for the DisplayBlock (required for "default" variant) */
    bodyText?: string
    /** ID of element to scroll to (optional) */
    scrollToId?: string
    /** Text color for headline (defaults to white) */
    textColor?: string
    /** Whether to apply text shadows (default: false for solid backgrounds) */
    textShadow?: boolean
    /** Image source */
    imgSrc: string
}

export function CenterImageText({
    id,
    ariaLabel,
    backgroundColor,
    bodyTextBold,
    bodyText,
    scrollToId,
    paddingTop = 0,
    textColor = "common.white",
    textShadow = false,
    imgSrc = ''
}: CenterImageTextProps) {
    const theme = useTheme()

    // Animation variants - MotionConfig in ThemeRegistry handles reduced motion automatically
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" },
        },
    }


    return (
        <Panel
            id={id}
            ariaLabel={ariaLabel}
            backgroundColor={backgroundColor}
            sx={{
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                paddingTop: `${paddingTop + 25}px`,
                boxSizing: "border-box",
                height: "auto",
                gap: "55px"
            }}
        >

            {/* Image — centered on mobile and desktop */}
            <Box
                component="img"
                src={imgSrc}
                alt="Collage featuring"
                sx={{ width: "100%", maxWidth: "33vw", height: "auto", }}
            />

            {/* Action items — bottom-right on desktop, centered on mobile */}
            <Box
                component="ul"
                sx={{
                    listStyle: "none",
                    p: 0,
                    m: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 4, md: 4 },
                    maxWidth: "600px",
                }}
            >

                <motion.div variants={fadeIn}>

                    {/* Body */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: textColor,
                        }}
                    >
                        <strong>{bodyTextBold}</strong>
                        {bodyText}
                    </Typography>

                </motion.div>

            </Box>

            {/* Scroll indicator (optional) */}
            {
                scrollToId && (
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: "clamp(24px, 4vh, 48px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: theme.zIndex.heroScrollIndicator,
                        }}
                    >
                        <ScrollToButton
                            color="rgba(255, 255, 255, 0.85)"
                            size={52}
                            scrollToId={scrollToId}
                            ariaLabel="Scroll down to continue"
                        />
                    </Box>
                )
            }
        </Panel >
    )
}
