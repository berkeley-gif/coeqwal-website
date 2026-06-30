"use client"

/**
 * TourAnchorContext. A registry that maps a stable string id to a live
 * DOM element, so the tour can find controls (a button, a chart axis)
 * that live anywhere in the app and mount at different times.
 *
 *   register:  useTourAnchor("list.toolbar.search") gives a ref to attach
 *   resolve:   the runner calls resolve("list.toolbar.search")
 *
 * Kept in a ref, not state, so controls registering and unregistering
 * do not re-render the tree. Because the runner may resolve before a
 * control mounts, the registry notifies subscribers on change
 * (subscribe/notify); useTourAnchorResolver listens and re-renders only
 * the runner.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

// Anchors can be any DOM element. Tour consumers only need
// `getBoundingClientRect` (for the HighlightRing) and a Popper
// anchorEl target, both of which accept `Element`. Widened from
// `HTMLElement` so SVG primitives (heatmap cells, chart geometry)
// can also register as anchors.
type AnchorMap = Map<string, Element>

interface TourAnchorContextValue {
  register: (id: string, el: Element | null) => void
  resolve: (id: string) => Element | null
  /** Register a listener that fires whenever any anchor is added,
   *  replaced, or removed. `useTourAnchorResolver` uses this to bump a
   *  version counter and re-render, so readers opt in explicitly and
   *  components that only register anchors avoid unrelated re-renders. */
  subscribe: (listener: () => void) => () => void
}

const TourAnchorContext = createContext<TourAnchorContextValue | null>(null)

interface TourAnchorProviderProps {
  children: React.ReactNode
}

export function TourAnchorProvider({ children }: TourAnchorProviderProps) {
  const mapRef = useRef<AnchorMap>(new Map())
  const listenersRef = useRef<Set<() => void>>(new Set())

  const notify = useCallback(() => {
    listenersRef.current.forEach((l) => l())
  }, [])

  const register = useCallback(
    (id: string, el: Element | null) => {
      const map = mapRef.current
      const existing = map.get(id)
      if (el == null) {
        if (existing) {
          map.delete(id)
          notify()
        }
        return
      }
      if (existing !== el) {
        map.set(id, el)
        notify()
      }
    },
    [notify],
  )

  const resolve = useCallback((id: string) => {
    return mapRef.current.get(id) ?? null
  }, [])

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const value = useMemo<TourAnchorContextValue>(
    () => ({ register, resolve, subscribe }),
    [register, resolve, subscribe],
  )

  return (
    <TourAnchorContext.Provider value={value}>
      {children}
    </TourAnchorContext.Provider>
  )
}

/**
 * Register a DOM element as a tour anchor. Returns a ref callback that
 * must be attached to the anchor element. Safe to call outside of a
 * TourAnchorProvider (the ref callback becomes a no-op), so views can
 * render without tour support enabled.
 */
export function useTourAnchor(id: string) {
  const ctx = useContext(TourAnchorContext)
  return useCallback(
    (el: Element | null) => {
      if (!ctx) return
      ctx.register(id, el)
    },
    [ctx, id],
  )
}

/**
 * Subscribe to the anchor registry from the tour runner. Re-renders the
 * caller whenever any anchor is added, replaced, or removed, so a
 * target that mounts after the runner is still found on next paint.
 */
export function useTourAnchorResolver() {
  const ctx = useContext(TourAnchorContext)
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!ctx) return
    return ctx.subscribe(() => setVersion((v) => v + 1))
  }, [ctx])
  // Keep `resolve` referentially stable. ToolTour and other consumers put
  // it in `useEffect` dependency arrays. A callback that closed over
  // `ctx` and listed `[ctx]` re-ran that effect on every render whenever
  // the provider's value object identity wobbled, which can exceed max
  // update depth. Reading `ctx` from a ref keeps the callback stable while
  // still resolving the latest registry.
  const resolve = useCallback((id: string) => {
    const c = ctxRef.current
    return c ? c.resolve(id) : null
  }, [])
  return { resolve, version }
}
