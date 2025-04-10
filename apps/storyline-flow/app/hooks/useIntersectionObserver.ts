import { useEffect, RefObject } from "react"

type IntersectionCallback = (() => void) | ((isIntersecting: boolean) => void)

export function useIntersectionObserver(
  ref: RefObject<HTMLElement | null>,
  callback: IntersectionCallback,
  options: IntersectionObserverInit = { threshold: 0.5 },
) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      if (typeof callback === "function") {
        if (callback.length === 0) {
          // If the callback takes no arguments, call it directly
          if (entry?.isIntersecting) {
            ;(callback as () => void)()
          }
        } else {
          // If the callback takes an argument, pass isIntersecting
          ;(callback as (isIntersecting: boolean) => void)(
            entry?.isIntersecting ?? false,
          )
        }
      }
    }, options)

    observer.observe(element)

    // Cleanup the observer when the component unmounts
    return () => {
      observer.disconnect()
    }
  }, [ref, callback, options])
}
