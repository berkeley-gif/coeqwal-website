"use client"

import { Box } from "@repo/ui/mui"
import { motion, useReducedMotion } from "@repo/motion"
import { packEnclose, packSiblings } from "@repo/viz"
import { useEffect, useId, useState } from "react"

const MotionBox = motion.create(Box)
const MotionGroup = motion.g

// Matches `body { background-color }` in app/main.css. Blended onto the
// (already-grayscale) photos with mix-blend-mode "color" so they read as a
// blue duotone — hue/saturation from this color, luminance from the photo —
// rather than a flat gradient overlay.
const PHOTO_TINT_COLOR = "#172a48"
// Backing fill behind each photo circle, so the ring never shows raw page
// background through it — independent of the clip-path, which can drift out
// of sync with the ring by a hair during the per-bubble drift animation.
const PHOTO_BACKING_COLOR = "#f2f0ef"

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

// One bubble per photo in public/photos, grouped by theme (delta -> wetland,
// farm -> agriculture, salmon -> salmon, urban -> urban) so the matching map
// icon can stand in for the photo wherever icons are shown instead (e.g. the
// tier-tinted circles in the conclusion, or once photos fade to icons here).
const bubbles = [
  {
    radius: 20,
    photoSrc: "/photos/urban_bottled_water.png",
    ...urbanIcon,
  },
  { radius: 16, photoSrc: "/photos/delta_recreation.png", ...wetlandIcon },
  {
    radius: 12,
    photoSrc: "/photos/delta_sacvalley_redfox.png",
    ...wetlandIcon,
  },
  {
    radius: 11,
    photoSrc: "/photos/farm_market_worker.png",
    ...agricultureIcon,
  },
  {
    radius: 17,
    photoSrc: "/photos/farm_farmer.png",
    ...agricultureIcon,
  },
  { radius: 14, photoSrc: "/photos/farm_worker.png", ...agricultureIcon },
  { radius: 13, photoSrc: "/photos/salmon_boy.png", ...salmonIcon },
  { radius: 10, photoSrc: "/photos/salmon_fish_culture.png", ...salmonIcon },
  { radius: 17, photoSrc: "/photos/salmon_eel_sign.png", ...salmonIcon },
  { radius: 11, photoSrc: "/photos/salmon_fisher.png", ...salmonIcon },
  { radius: 14, photoSrc: "/photos/urban_athlete.png", ...urbanIcon },
  { radius: 10, photoSrc: "/photos/urban_water_heat.png", ...urbanIcon },
  { radius: 12, photoSrc: "/photos/urban_kid_swimmers.png", ...urbanIcon },
  { radius: 15, photoSrc: "/photos/delta_cranes.png", ...wetlandIcon },
] as const

export const packedBubbles = (() => {
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
    photoSrc: circle.bubble.photoSrc,
    iconSrc: circle.bubble.iconSrc,
    iconAspect: circle.bubble.iconAspect,
    iconContentFill: circle.bubble.iconContentFill,
  }))
})()

// The fixed on-screen box the cluster is centered in when `align="center"`
// (see ConclusionVisual/OpenerVisual): `top: 15dvh, right: -1dvw, width:
// 45dvw, height: 85dvh`, expressed as fractions of viewport size. Kept here
// so map-side code (which draws in real screen pixels, not this component's
// own CSS) can compute the exact same on-screen target rect without a DOM
// measurement — single source of truth for both.
const BUBBLES_OUTER_BOX = { top: 0.15, right: -0.01, width: 0.45, height: 0.85 }
const BUBBLES_SIZE_MAX_PX = 52 * 16 // 52rem, assuming a 16px root font size

export function getBubblesClusterRect(
  viewportWidth: number,
  viewportHeight: number,
) {
  const outerWidth = BUBBLES_OUTER_BOX.width * viewportWidth
  const outerHeight = BUBBLES_OUTER_BOX.height * viewportHeight
  const outerRight = viewportWidth - BUBBLES_OUTER_BOX.right * viewportWidth
  const outerLeft = outerRight - outerWidth
  const outerTop = BUBBLES_OUTER_BOX.top * viewportHeight
  const size = Math.min(
    Math.min(0.45 * viewportWidth, 0.72 * viewportHeight),
    BUBBLES_SIZE_MAX_PX,
  )
  const centerX = outerLeft + outerWidth / 2
  const centerY = outerTop + outerHeight / 2

  return {
    x: centerX - size / 2,
    y: centerY - size / 2,
    width: size,
    height: size,
  }
}

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

// Scroll fraction (through this component's own position in the page) over
// which photo bubbles cross-fade into their matching icon.
const PHOTO_TO_ICON_RANGE: [number, number] = [0, 0.15]

// Opener is a fixed 100vh hero section at the very top of the page (see
// app/page.tsx), so scrollY / viewport height is a reliable stand-in for
// "how far we've scrolled through it". Polls on every frame rather than
// listening for the `scroll` event — both framer-motion's own scroll
// tracking and a plain event listener failed to react to scroll changes
// reliably in testing, so this sidesteps event-dispatch entirely.
function useOpenerScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frameId = 0
    let lastValue = -1

    const tick = () => {
      const value = window.innerHeight
        ? Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
        : 0
      if (value !== lastValue) {
        lastValue = value
        setProgress(value)
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return progress
}

export function FloatingBubbles({
  iconColorsBySrc = {},
  showPhotos = false,
  align = "right",
  iconProgress,
}: {
  iconColorsBySrc?: Partial<Record<string, string>>
  showPhotos?: boolean
  align?: "right" | "center"
  // Externally-driven photo/icon crossfade (0 = full photo, 1 = full icon),
  // for callers whose own scroll timeline should control the fade instead of
  // this component's built-in opener-scroll behavior. Omit to keep the
  // default (page-top scroll-driven, photo -> icon) used by the opener.
  iconProgress?: number
} = {}) {
  const prefersReducedMotion = useReducedMotion()
  const clipIdPrefix = useId().replace(/:/g, "")
  const scrollProgress = useOpenerScrollProgress()
  const fadeT =
    iconProgress ??
    Math.min(
      1,
      Math.max(
        0,
        (scrollProgress - PHOTO_TO_ICON_RANGE[0]) /
          (PHOTO_TO_ICON_RANGE[1] - PHOTO_TO_ICON_RANGE[0]),
      ),
    )
  const photoOpacity = 1 - fadeT
  const iconOpacity = fadeT

  return (
    <Box
      aria-hidden="true"
      sx={{
        display: { xs: "none", md: "block" },
        position: "absolute",
        top: "50%",
        width: "min(45dvw, 72dvh)",
        maxWidth: "52rem",
        aspectRatio: "1 / 1",
        ...(align === "center"
          ? { left: "50%", transform: "translate(-50%, -50%)" }
          : { right: "-1dvw", transform: "translateY(-50%)" }),
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

            const { width, height } = getIconBox(
              bubble.r,
              bubble.iconAspect,
              bubble.iconContentFill,
            )
            const iconColor = iconColorsBySrc[bubble.iconSrc]
            const iconElement = iconColor ? (
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
            )

            return (
              <MotionGroup
                key={index}
                animate={animation}
                transition={transition}
                style={{
                  filter: "drop-shadow(0 2px 3px rgba(5, 20, 42, 0.3))",
                }}
              >
                {showPhotos ? (
                  <>
                    <defs>
                      <clipPath id={`${clipIdPrefix}-bubble-photo-${index}`}>
                        <circle cx={bubble.cx} cy={bubble.cy} r={bubble.r} />
                      </clipPath>
                    </defs>
                    <g opacity={photoOpacity}>
                      <circle
                        cx={bubble.cx}
                        cy={bubble.cy}
                        r={bubble.r}
                        fill={PHOTO_BACKING_COLOR}
                      />
                      <foreignObject
                        x={bubble.cx - bubble.r}
                        y={bubble.cy - bubble.r}
                        width={bubble.r * 2}
                        height={bubble.r * 2}
                        clipPath={`url(#${clipIdPrefix}-bubble-photo-${index})`}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <Box
                            component="img"
                            src={bubble.photoSrc}
                            alt=""
                            sx={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor: PHOTO_TINT_COLOR,
                              mixBlendMode: "color",
                            }}
                          />
                        </Box>
                      </foreignObject>
                    </g>
                    <g opacity={iconOpacity}>{iconElement}</g>
                  </>
                ) : (
                  iconElement
                )}
                <circle
                  cx={bubble.cx}
                  cy={bubble.cy}
                  r={bubble.r}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth={0.38}
                />
              </MotionGroup>
            )
          })}
        </Box>
      </MotionBox>
    </Box>
  )
}
