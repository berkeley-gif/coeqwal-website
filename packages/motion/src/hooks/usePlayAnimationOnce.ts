import { useState, useEffect } from "react"
import { MotionValue, useTransform } from "@repo/motion"

export function usePlayAnimationOnce(
  scrollYProgress: MotionValue<number>,
  range: [number, number],
  outputRange: [number, number],
) {
  const [animationPlayed, setAnimationPlayed] = useState(false)

  const animatedValue = useTransform(
    scrollYProgress,
    range,
    animationPlayed ? [outputRange[1], outputRange[1]] : outputRange,
  )

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest >= range[1]) {
        setAnimationPlayed(true)
      }
    })

    return () => unsubscribe()
  }, [scrollYProgress, range])

  return animatedValue
}
