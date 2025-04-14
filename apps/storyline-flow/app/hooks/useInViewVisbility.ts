import { useInView, useAnimation } from "@repo/motion"
import { useEffect, useRef } from "react"

export const useInViewVisibility = () => {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return { ref, controls }
}
