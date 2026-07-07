"use client"

import { useState, useEffect, useRef } from "react"

type Drop = {
  left: number
  delay: number
  baseDur: number
  visibilityThreshold: number
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function createDrop(index: number): Drop {
  const seed = index + 1

  return {
    left: seededRandom(seed) * 100,
    delay: seededRandom(seed * 2) * -5,
    baseDur: 2 + seededRandom(seed * 3) * 2,
    visibilityThreshold: seededRandom(seed * 4),
  }
}

export default function RainAnimation() {
  const [drops] = useState<Drop[]>(() =>
    Array.from({ length: 100 }, (_, index) => createDrop(index)),
  )
  const [intensity, setIntensity] = useState(1)
  const rainRef = useRef<HTMLDivElement | null>(null)
  const [travelPx, setTravelPx] = useState(0)

  useEffect(() => {
    const startTime = Date.now()

    const updateIntensity = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const wave = Math.sin((elapsed * Math.PI) / 10) * 0.5 + 0.5 // between 0 and 1
      const newIntensity = 0.2 + wave * 0.8
      setIntensity(newIntensity)
    }

    updateIntensity()
    const interval = setInterval(updateIntensity, 160)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const el = rainRef.current
    if (!el) return

    const updateTravel = () => {
      setTravelPx(el.getBoundingClientRect().height)
    }

    updateTravel()
    const ro = new ResizeObserver(updateTravel)
    ro.observe(el)

    return () => ro.disconnect()
  }, [])

  return (
    <>
      <div
        ref={rainRef}
        className="rain"
        style={{ ["--rain-travel" as string]: `${travelPx}px` }}
      >
        {drops.map((drop, i) => {
          const dur = drop.baseDur
          const opacity = 0.3 + intensity * 0.7
          const isVisible = drop.visibilityThreshold < intensity

          return (
            <div
              key={i}
              className="drop"
              style={{
                left: `${drop.left}%`,
                animationDuration: `${dur}s`,
                animationDelay: `${drop.delay}s`,
                opacity: isVisible ? opacity : 0,
                transition: "opacity 0.5s ease-in-out",
              }}
            >
              <div
                className="stem"
                style={{
                  animationDuration: `${dur}s`,
                  animationDelay: `${drop.delay}s`,
                }}
              />
              <div
                className="splat"
                style={{
                  animationDuration: `${dur}s`,
                  animationDelay: `${drop.delay}s`,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Intensity Indicator */}
      {/* <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "12px 20px",
          color: OffWhiteColor,
          borderRadius: "8px",
          zIndex: 10,
        }}
      >
        Rain Intensity: {(((intensity - 0.2) / 0.8) * 100).toFixed(0)}%
      </div> */}
    </>
  )
}
