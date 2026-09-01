"use client"

import { Paragraph, StorylineOpener, Text } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { motion, useReducedMotion } from "@repo/motion"
import { packEnclose, packSiblings } from "@repo/viz"
import ScrollIndicator from "./helpers/ScrollIndicator"

const MotionBox = motion.create(Box)
const MotionCircle = motion.circle
const MotionGroup = motion.g

// Metadata for each source file: `aspect` is its declared viewBox aspect
// ratio, and `contentFill` compensates for the file's built-in padding — the
// fraction of the declared render box the visible artwork actually fills
// along its wider axis (measured from the file's own bounding box).
const wetlandIcon = {
  iconSrc: "/map-icons/wetland.svg",
  iconAspect: 1,
  iconContentFill: 0.762,
} as const
const urbanIcon = {
  iconSrc: "/map-icons/urban.svg",
  iconAspect: 1,
  iconContentFill: 0.75,
} as const
const agricultureIcon = {
  iconSrc: "/map-icons/agriculture.svg",
  iconAspect: 1,
  iconContentFill: 0.746,
} as const
const salmonIcon = {
  iconSrc: "/map-icons/salmon.svg",
  iconAspect: 70.85 / 37.19,
  iconContentFill: 0.81,
} as const

const bubbles = [
  { radius: 16, color: "#315B9A", ...urbanIcon },
  { radius: 10, color: "#F2A900", ...agricultureIcon },
  { radius: 18, color: "#9B4D96", ...urbanIcon },
  { radius: 11, color: "#2AB7CA", ...salmonIcon },
  { radius: 17, color: "#2923A9", ...agricultureIcon },
  { radius: 10, color: "#E45C96", ...wetlandIcon },
  { radius: 13, color: "#72B7B2", ...wetlandIcon },
] as const

const packedBubbles = (() => {
  // Reserve enough space for each circle's small independent drift.
  const gap = 1.5
  const circles = bubbles.map((bubble) => ({
    x: 0,
    y: 0,
    r: bubble.radius + gap,
    bubble,
  }))

  packSiblings(circles)
  const enclosure = packEnclose(circles)
  const scale = 46 / enclosure.r

  return circles.map((circle) => ({
    cx: 50 + (circle.x - enclosure.x) * scale,
    cy: 50 + (circle.y - enclosure.y) * scale,
    r: circle.bubble.radius * scale,
    color: circle.bubble.color,
    iconSrc: "iconSrc" in circle.bubble ? circle.bubble.iconSrc : undefined,
    iconAspect: "iconAspect" in circle.bubble ? circle.bubble.iconAspect : 1,
    iconContentFill:
      "iconContentFill" in circle.bubble ? circle.bubble.iconContentFill : 1,
  }))
})()

// How much of the circle's diameter the icon's visible artwork should span
// along its longer axis. `contentFill` compensates for built-in padding in
// the source file so the actual artwork (not its padded render box) hits
// this target, rather than the declared aspect ratio alone.
const ICON_TARGET_FILL = 0.9

function getIconBox(r: number, aspect: number, contentFill: number) {
  const target = 2 * r * ICON_TARGET_FILL

  if (aspect >= 1) {
    const width = target / contentFill
    return { width, height: width / aspect }
  }

  const height = target / contentFill
  return { width: height * aspect, height }
}

export function FloatingBubbles({
  iconColorsBySrc = {},
}: {
  iconColorsBySrc?: Partial<Record<string, string>>
} = {}) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <Box
      aria-hidden="true"
      sx={{
        display: { xs: "none", lg: "block" },
        position: "absolute",
        right: "-1dvw",
        top: "50%",
        width: "42dvw",
        maxWidth: "52rem",
        aspectRatio: "1 / 1",
        transform: "translateY(-50%)",
      }}
    >
      <MotionBox
        animate={
          prefersReducedMotion
            ? undefined
            : {
                x: [0, 5, 0, -4, 0],
                y: [0, -7, 0, 5, 0],
                rotate: [0, 0.6, 0, -0.5, 0],
              }
        }
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
        sx={{ width: "100%", height: "100%" }}
      >
        <Box
          component="svg"
          viewBox="0 0 100 100"
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          {packedBubbles.map((bubble, index) => {
            const driftX = index % 2 === 0 ? 0.7 : -0.65
            const driftY = index % 3 === 0 ? -0.8 : 0.65

            const animation = prefersReducedMotion
              ? undefined
              : {
                  x: [0, driftX, 0, -driftX * 0.55, 0],
                  y: [0, driftY, 0, -driftY * 0.5, 0],
                }
            const transition = {
              duration: 5.8 + (index % 4) * 0.7,
              delay: index * 0.16,
              ease: "easeInOut" as const,
              repeat: Infinity,
            }

            if (bubble.iconSrc) {
              const { width, height } = getIconBox(
                bubble.r,
                bubble.iconAspect,
                bubble.iconContentFill,
              )
              const iconColor = iconColorsBySrc[bubble.iconSrc]

              return (
                <MotionGroup
                  key={index}
                  animate={animation}
                  transition={transition}
                  style={{
                    filter: "drop-shadow(0 2px 3px rgba(5, 20, 42, 0.3))",
                  }}
                >
                  <circle
                    cx={bubble.cx}
                    cy={bubble.cy}
                    r={bubble.r}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth={0.38}
                  />
                  {iconColor ? (
                    <foreignObject
                      x={bubble.cx - width / 2}
                      y={bubble.cy - height / 2}
                      width={width}
                      height={height}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: iconColor,
                          mask: `url(${bubble.iconSrc}) center / contain no-repeat`,
                          WebkitMask: `url(${bubble.iconSrc}) center / contain no-repeat`,
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <image
                      href={bubble.iconSrc}
                      x={bubble.cx - width / 2}
                      y={bubble.cy - height / 2}
                      width={width}
                      height={height}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}
                </MotionGroup>
              )
            }

            return (
              <MotionCircle
                key={index}
                cx={bubble.cx}
                cy={bubble.cy}
                r={bubble.r}
                fill={bubble.color}
                stroke="rgba(255, 255, 255, 0.95)"
                strokeWidth={0.38}
                animate={animation}
                transition={transition}
                style={{
                  filter: "drop-shadow(0 2px 3px rgba(5, 20, 42, 0.2))",
                }}
              />
            )
          })}
        </Box>
      </MotionBox>
    </Box>
  )
}

const openerText = {
  en: {
    title: {
      text: "How to reach a more equitable water future for California?",
    },
    subtitle: {
      text: "Exploring equitable and resilient water futures with COEQWAL",
    },
    paragraphs: [
      [
        {
          text: "Understanding equity in California water begins with a few fundamental questions:",
        },
      ],
      [
        { text: "Whose needs are being met … and who is left behind?" },
        {
          text: "Who bears the cost when water is scarce … and who benefits?",
        },
        {
          text: "How does our history, infrastructure and decision-making influence who has access to water, and when?",
        },
      ],
      [
        {
          text: "By exploring water equity across future what-if scenarios, COEQWAL begins to answer a bigger question:",
        },
        {
          text: "How can all Californians access the water they need to survive and thrive for generations to come?",
        },
      ],
    ],
  },
} as const

export default function Opener() {
  const copy = openerText.en

  return (
    <StorylineOpener
      title={<Text value={copy.title} />}
      subtitle={<Text value={copy.subtitle} />}
      alignment="left"
      sx={{
        width: "100%",
        maxWidth: "none",
        px: "0 !important",
        "& > .MuiTypography-h1, & > .MuiTypography-h3": {
          maxWidth: { xs: "100%", lg: "58dvw" },
        },
      }}
      scrollIndicator={<ScrollIndicator animationComplete />}
    >
      <FloatingBubbles />
      <Box
        className="text-section"
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: { xs: "75ch", lg: "56dvw" },
        }}
      >
        <Stack component="section" spacing={2}>
          {copy.paragraphs.map((sentences, index) => (
            <Box key={index} component="article">
              <Paragraph blocks={sentences} />
            </Box>
          ))}
        </Stack>
      </Box>
    </StorylineOpener>
  )
}
