"use client"

/**
 * swrTiming.ts - dev-only SWR middleware (flag-gated)
 *
 * Wired into DataProvider's SWRConfig `use` array only when
 * NEXT_PUBLIC_PERF_LOG=1, so the default build carries no middleware.
 *
 * For every useSWR call it records one "swr:data-ready" measure when data
 * first becomes defined for a key: durMs = hook-mount (or key change) to
 * data-defined, detail.cacheState = "cold" when isLoading was observed
 * (a fetch happened) and "warm" when data was served without a loading
 * pass (SWR cache hit). React StrictMode double-mounts can duplicate
 * records in dev; measurement runs use production builds.
 *
 * This is the only seam that sees array-key hooks, whose fetchers bypass
 * DataProvider's global fetcher.
 */

import { useRef } from "react"
import type { Middleware } from "swr"
import { pushPerfRecord } from "./perfLog"

function clock(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}

interface KeyTiming {
  key: string | null
  t0: number
  done: boolean
  sawLoading: boolean
}

export const swrTimingMiddleware: Middleware =
  (useSWRNext) => (key, fetcher, config) => {
    const swr = useSWRNext(key, fetcher, config)
    const keyString =
      typeof key === "string" ? key : key != null ? JSON.stringify(key) : null

    const stateRef = useRef<KeyTiming>({
      key: null,
      t0: 0,
      done: false,
      sawLoading: false,
    })

    if (keyString !== null && stateRef.current.key !== keyString) {
      stateRef.current = {
        key: keyString,
        t0: clock(),
        done: false,
        sawLoading: false,
      }
    }
    if (swr.isLoading) stateRef.current.sawLoading = true
    if (
      keyString !== null &&
      !stateRef.current.done &&
      swr.data !== undefined
    ) {
      stateRef.current.done = true
      pushPerfRecord({
        kind: "measure",
        name: "swr:data-ready",
        t: stateRef.current.t0,
        durMs: clock() - stateRef.current.t0,
        detail: {
          key: keyString,
          cacheState: stateRef.current.sawLoading ? "cold" : "warm",
        },
      })
    }

    return swr
  }
