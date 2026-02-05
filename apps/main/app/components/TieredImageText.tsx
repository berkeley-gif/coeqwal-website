"use client"

/**
 * Tiered Image Text - This block contains a title with text on the side, and image, 
 * and a footer section with a logo and some text. See side pages Figma mockups for an example. 
 * https://www.figma.com/design/WJCxjC4u6o2Ruv5Bh1N1ZL/COEQWAL-Side-pages?node-id=0-1&t=U1LJ3H4cm1kLAxwm-1
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text for images
 * - WCAG 1.3.1: Semantic <section> with aria-label
 */

import React from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { fadeIn } from "../lib/constants/motionAnimations"

export interface TieredImageTextProps {
    /** Panel ID for navigation */
    id: string
    /** Accessible label for the section */
    ariaLabel: string
    /** Title for the section */
    title: string
    /** First body paragraph */
    body1: string
    /** Second body paragraph (optional) */
    body2: string
    /** Footer logo */
    logoSrc: string
    /** Footer logo alt text */
    logoAlt: string
    /** Footer logo paragraph */
    logoText: string
    /** Image source */
    imgSrc: string
    /** Image alt text */
    imgAlt: string
}

export function TieredImageText({
    id,
    ariaLabel,
    title,
    body1,
    body2,
    logoSrc,
    logoAlt,
    logoText,
    imgSrc = '',
    imgAlt = '',
}: TieredImageTextProps) {
    const theme = useTheme()

    return (
        <Box
            component="section"
            id={id}
            aria-label={ariaLabel}
            sx={{
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                paddingTop: "130px",
                height: "auto",
                backgroundColor: theme.palette.blue.pale,
            }}
        >
            {/* Title and text */}
            <motion.div
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "row",
                    gap: "45px",
                    color: theme.palette.blue.darkest,
                    width: "50vw",
                }}
                initial="hidden"
                whileInView="show"
                variants={fadeIn}
            >

                {/* Title */}
                <Typography
                    variant="h4"
                    sx={{
                        maxWidth: "150px"
                    }}
                >

                    {title}
                </Typography>

                <Box
                    component="div"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                        gap: "30px",
                    }}
                >
                    {/* Body text 1 */}
                    <Typography
                        variant="body1"
                        sx={{
                            flex: "1 1 0",
                            minWidth: 0,
                        }}
                    >

                        {body1}
                    </Typography>

                    {/* Body text 2 */}
                    <Typography
                        variant="body1"
                        sx={{
                            flex: "2 1 0",
                            minWidth: 0,
                        }}
                    >

                        {body2}
                    </Typography>

                </Box>

            </motion.div>



            {/* Image — at the bottom */}
            <Box
                component="div"
                id="bottomImage"
                sx={{
                    position: "relative",
                    width: "100%",
                    height: "clamp(220px, 35vw, 420px)",
                    overflow: "hidden"
                }}
            >
                <Box
                    component="img"
                    src={imgSrc}
                    alt={imgAlt}
                    sx={{
                        width: "100%",
                        inset: 0,
                        height: { md: "150%", lg: "215%" },
                        objectFit: "cover",
                        objectPosition: "center-bottom",
                        position: "absolute",
                    }}
                />
            </Box>

            {/* Footer with logo content */}
            <Box
                component="div"
                id="footerTiered"
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.palette.brand.panelDark,
                    color: theme.palette.common.white
                }}
            >
                { /* Footer content */}
                <Box
                    component="div"
                    sx={{
                        maxWidth: "60vw",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        margin: "75px 0",
                    }}
                >
                    <Box
                        component="img"
                        src={logoSrc}
                        alt={logoAlt}
                        sx={{
                            width: "305px",
                            height: "auto",
                            objectFit: "contain",
                        }}
                    />
                    {/* Body text 2 */}
                    <Typography
                        variant="body1"
                    >
                        {logoText}
                    </Typography>
                </Box>

            </Box>
        </Box >
    )
}
