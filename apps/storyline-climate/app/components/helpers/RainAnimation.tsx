import { useState, useEffect } from "react"
import { OffWhiteColor, FreshWaterColor } from "./colorPalette"

export default function RainAnimation() {
  const [drops] = useState(Array(100).fill(null))
  const [intensity, setIntensity] = useState(1)

  useEffect(() => {
    let startTime = Date.now()

    const updateIntensity = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const wave = Math.sin((elapsed * Math.PI) / 10) * 0.5 + 0.5 // between 0 and 1
      const newIntensity = 0.2 + wave * 0.8
      setIntensity(newIntensity)
    }

    updateIntensity()
    const interval = setInterval(updateIntensity, 50) // Update every 50ms for smooth transitions

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div className="rain">
        {drops.map((_, i) => {
          const delay = Math.random() * 5
          const baseDur = 2 + Math.random() * 2
          const dur = baseDur / Math.max(intensity, 0.5)
          const opacity = 0.3 + intensity * 0.7
          const isVisible = Math.random() < intensity

          return (
            <div
              key={i}
              className="drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                opacity: isVisible ? opacity : 0,
                transition: "opacity 0.5s ease-in-out",
              }}
            >
              <div
                className="stem"
                style={{
                  animationDuration: `${dur}s`,
                  animationDelay: `${delay}s`,
                }}
              />
              <div
                className="splat"
                style={{
                  animationDuration: `${dur}s`,
                  animationDelay: `${delay}s`,
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
