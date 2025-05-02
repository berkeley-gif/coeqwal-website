"use client"

import { FlubberInterpolate } from "@repo/motion"
import {
  animate,
  motion,
  MotionValue,
  useMotionValue,
  useTransform,
} from "@repo/motion"
import { useEffect, useState } from "react"

export default function PathMorphing() {
  const [pathIndex, setPathIndex] = useState(0)
  const progress = useMotionValue(pathIndex)
  const fill = useTransform(progress, paths.map(getIndex), colors)
  const path = useFlubber(progress, paths)

  useEffect(() => {
    console.log("huh")
    const animation = animate(progress, pathIndex, {
      duration: 1,
      ease: "easeInOut",
      onComplete: () => {
        if (pathIndex === paths.length - 1) {
          progress.set(0)
          setPathIndex(1)
        } else {
          setPathIndex(pathIndex + 1)
        }
      },
    })

    return () => animation.stop()
  }, [pathIndex, progress])

  return (
    <svg width="400" height="400">
      <g transform="translate(10 10) scale(17 17)">
        <motion.path fill={fill} d={path} />
      </g>
    </svg>
  )
}

/**
 * ==============   Utils   ================
 */

const getIndex = (_: string, index: number) => index

function useFlubber(progress: MotionValue<number>, paths: string[]) {
  return useTransform(progress, paths.map(getIndex), paths, {
    mixer: (a, b) => FlubberInterpolate(a, b, { maxSegmentLength: 0.1 }),
  })
}

/**
 * ==============   Shape data   ================
 */

// Paths taken from https://github.com/veltman/flubber/blob/master/demos/basic-svg.html
const hand =
  "M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"
const plane =
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
const lightning = "M7 2v11h3v9l7-12h-4l4-8z"

const paths = [lightning, hand, plane]
const colors = ["#fff312", "#ff0088", "#9911ff"]
