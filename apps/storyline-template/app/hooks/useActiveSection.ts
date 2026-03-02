"use client"

import { useEffect, useRef } from "react"
import { useInView } from "@repo/motion"
import useStoryStore from "../store"

const useActiveSection = (
  sectionName: string,
  inViewOptions = { amount: 0.5 },
) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, inViewOptions)
  const setActiveSection = useStoryStore((state) => state.setActiveSection)
  const activeSection = useStoryStore((state) => state.activeSection)
  const isSectionActive = sectionName === activeSection

  useEffect(() => {
    if (isInView) {
      setActiveSection(sectionName)
    }
  }, [isInView, setActiveSection, sectionName])

  return {
    sectionRef,
    isSectionActive,
  }
}

export default useActiveSection
