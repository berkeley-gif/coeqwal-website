"use client"

/**
 * Scroll Image Text Blocks - This block has a title and a set of image and text blocks to follow a narrative
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text for images
 * - WCAG 1.3.1: Semantic <section> with aria-label
 */

import React from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { fadeIn, fadeInRight } from "../lib/constants/motionAnimations"

const IMAGE_WIDTH = 450
const TEXT_WIDTH = 485 // Change this to 500, 600, etc.
const OFFSET = 15 // The 15px offset from center
const GAP = 30

export interface ImageTextBlock {
  imgSrc: string
  imgAlt: string
  text: string
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
        backgroundImage: { xs: "none", md: `url(${backgroundSrc}.jpg)` },
        backgroundColor: { xs: theme.palette.common.white, md: "transparent" },
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
          width: { xs: "100%", md: "50%" },
          paddingTop: `${theme.layout.headerHeight + 25}px`,
          paddingBottom: `70px`,
          paddingLeft: { xs: "24px", md: "25%" },
          paddingRight: { xs: "24px", md: "0" },
          position: { xs: "static", md: "sticky" },
          color: theme.palette.blue.darkest,
          top: 0,
          boxSizing: "border-box",
          zIndex: 0,
        }}
        variants={fadeIn}
      >
        <Typography variant="h4">{title}</Typography>
      </Box>

      <Box
        component="div"
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "row",
          gap: "75px",
        }}
      >
        {/* Image Text Blocks */}
        <RenderImageTextBlocks rawBlocks={imageTextBlocks} />
      </Box>
    </Box>
  )
}

function RenderImageTextBlocks({ rawBlocks }: { rawBlocks: ImageTextBlock[] }) {
  const theme = useTheme()

  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        gap: { xs: "64px", md: "175px" },
        paddingX: { xs: "24px", md: "0" },
        paddingBottom: { xs: "48px", md: "0" },
      }}
    >
      {rawBlocks?.map((block, index) => (
        <Box
          key={index}
          component="div"
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
            minHeight: { xs: "auto", md: "400px" }, // Give space for absolute positioning
            flexDirection: { xs: "column", md: "row" },
            position: { xs: "static", md: "relative" },
            gap: { xs: "24px", md: `${GAP}px` },
          }}
        >
          {/* Image on LEFT */}
          {block.imagePosition === "left" && (
            <>
              <Box
                component={motion.img}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={fadeInRight}
                src={block.imgSrc}
                alt={block.imgAlt}
                sx={{
                  width: { xs: "100%", md: `${IMAGE_WIDTH}px` },
                  position: { xs: "static", md: "absolute" },
                  right: { md: `calc(50% - ${OFFSET}px)` },
                  height: "auto",
                  objectFit: "contain",
                }}
              />
              <Box
                component={motion.div}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={fadeInRight}
                sx={{
                  width: { xs: "100%", md: `${TEXT_WIDTH}px` },
                  position: { xs: "static", md: "absolute" },
                  left: { md: `calc(50% + ${GAP - OFFSET}px)` },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: "left",
                    paddingLeft: `${OFFSET}px`,
                    paddingRight: `${OFFSET}px`,
                  }}
                >
                  {block.text}
                </Typography>
              </Box>
            </>
          )}

          {/* Image on RIGHT */}
          {block.imagePosition === "right" && (
            <>
              <Box
                component={motion.div}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={fadeInRight}
                sx={{
                  width: { xs: "100%", md: `${TEXT_WIDTH}px` },
                  position: { xs: "static", md: "absolute" },
                  right: { md: `calc(50% + ${GAP - OFFSET}px)` },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: "left",
                    background: { xs: theme.palette.common.white, md: "white" },
                    paddingTop: "25px",
                    paddingLeft: `${OFFSET}px`,
                    paddingRight: `${OFFSET}px`,
                  }}
                >
                  {block.text}
                </Typography>
              </Box>
              <Box
                component={motion.img}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={fadeInRight}
                src={block.imgSrc}
                alt={block.imgAlt}
                sx={{
                  width: { xs: "100%", md: `${TEXT_WIDTH}px` },
                  position: { xs: "static", md: "absolute" },
                  left: { md: `calc(50% - ${GAP - OFFSET}px)` }, // Left edge at 15px left of center
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </>
          )}
        </Box>
      ))}
    </Box>
  )
}
