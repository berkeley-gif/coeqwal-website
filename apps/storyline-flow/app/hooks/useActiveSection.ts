import { useEffect, useRef } from "react"
import { useInView } from "@repo/motion"
import useStory from "../story/useStory"

const useActiveSection = (
  sectionName: string,
  inViewOptions = { amount: 0.5 },
) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, inViewOptions)
  const { setActiveSection } = useStory()

  useEffect(() => {
    if (isInView) {
      setActiveSection(sectionName)
    }
  }, [isInView, setActiveSection, sectionName])

  return sectionRef
}

export default useActiveSection
