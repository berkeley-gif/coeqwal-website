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
  //const markSectionAsLoaded = useStoryStore((state) => state.markSectionAsLoaded);

  useEffect(() => {
    if (isInView) {
      setActiveSection(sectionName) // Update the active section in the store
      console.log("📝 section is now active:", sectionName)
      //markSectionAsLoaded(sectionName); // Mark the section as loaded
    }
  }, [isInView, setActiveSection, sectionName])

  // Triggers when first loading everyone, but later on works as expected
  useEffect(() => {
    if (!isSectionActive) {
      //console.log("📝 section is now inactive:", sectionName);
    }
  }, [isSectionActive, sectionName])

  return {
    sectionRef,
    isSectionActive,
  }
}

export default useActiveSection
