"use client"

/**
 * Watches the VideoHero's scroll progress and flips `isPastHero` on
 * the Tabs context once the user has scrolled past the midpoint.
 *
 * `isPastHero` controls the Header's transparency transition: while
 * the hero video is mostly on-screen the header reads as transparent
 * over the dark video; once the user has scrolled into the About
 * panel the header swaps to its solid state.
 */

import { useEffect, type RefObject } from "react"
import { useScrollProgress } from "@repo/scrollytelling"
import { useTabs } from "../../context/Tabs"

const PAST_HERO_THRESHOLD = 0.5

export function useHeroScrollObserver(
  videoHeroRef: RefObject<HTMLDivElement | null>,
) {
  const { setIsPastHero } = useTabs()
  const heroScrollProgress = useScrollProgress(videoHeroRef, {
    offset: ["start start", "end start"],
  })

  useEffect(() => {
    let wasPastHero = heroScrollProgress.get() > PAST_HERO_THRESHOLD
    setIsPastHero(wasPastHero)

    return heroScrollProgress.on("change", (p) => {
      const isPast = p > PAST_HERO_THRESHOLD
      if (isPast !== wasPastHero) {
        wasPastHero = isPast
        setIsPastHero(isPast)
      }
    })
  }, [heroScrollProgress, setIsPastHero])
}
