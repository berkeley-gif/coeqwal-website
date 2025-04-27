import { useEffect, RefObject, useRef } from "react"
import useStoryStore from "../store"

export function useIntersectionObserver(
  ref: RefObject<HTMLElement | null>,
  sectionIds: string[] = [],
  leavingSectionIds: string[] = [],
  onEnter: () => void,
  onLeave: () => void,
  options: IntersectionObserverInit = { threshold: 0.5 },
) {
  const activeSection = useStoryStore((state) => state.activeSection)
  const previousActiveSection = useRef<string | null>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        if (sectionIds.includes(activeSection as string)) {
          onEnter() // Call the onEnter callback when the element enters the viewport
        }
      } else {
        if (
          // To check if we are really scrolling out of the section
          sectionIds.includes(previousActiveSection.current as string) &&
          leavingSectionIds.includes(activeSection as string)
        ) {
          onLeave()
        }
      }

      previousActiveSection.current = activeSection
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [
    ref,
    onEnter,
    onLeave,
    options,
    activeSection,
    sectionIds,
    leavingSectionIds,
  ])
}
