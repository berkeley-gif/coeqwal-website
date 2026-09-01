"use client"

import { useEffect, useState } from "react"

/**
 * Stays false until `active` first becomes true, then stays true for good.
 * Lets a heavy map Source defer mounting until its section is actually
 * reached, without unmounting (and re-tiling) it again on scroll-back.
 */
export function useLazyMount(active: boolean): boolean {
  const [mounted, setMounted] = useState(active)

  useEffect(() => {
    if (active) setMounted(true)
  }, [active])

  return mounted
}
