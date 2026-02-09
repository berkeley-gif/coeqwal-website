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
        gap: "175px",
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
            gap: `${GAP}px`,
            zIndex: 1,
            position: "relative",
            minHeight: "400px", // Give space for absolute positioning
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
                  width: `${IMAGE_WIDTH}px`,
                  height: "auto",
                  objectFit: "contain",
                  position: "absolute",
                  right: `calc(50% - ${OFFSET}px)`, // Right edge at 15px left of center
                }}
              />
              <Box
                component={motion.div}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={fadeInRight}
                sx={{
                  width: `${TEXT_WIDTH}px`,
                  position: "absolute",
                  left: `calc(50% + ${GAP - OFFSET}px)`, // Starts GAP away from image
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
                  width: `${TEXT_WIDTH}px`,
                  position: "absolute",
                  right: `calc(50% + ${GAP - OFFSET}px)`, // Ends GAP away from image
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: "left",
                    background: theme.palette.common.white,
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
                  width: `${IMAGE_WIDTH}px`,
                  height: "auto",
                  objectFit: "contain",
                  position: "absolute",
                  left: `calc(50% - ${OFFSET}px)`, // Left edge at 15px left of center
                }}
              />
            </>
          )}
        </Box>
      ))}
    </Box>
  )
}
