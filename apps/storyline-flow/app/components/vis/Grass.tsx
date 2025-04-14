import React, { useEffect } from "react"
import "./grass.css"

function createStars() {
  const starsContainer = document.getElementById("stars")
  if (starsContainer) {
    for (let i = 0; i < 100; i++) {
      const star = document.createElement("div")
      star.style.left = `${Math.random() * 100}vw`
      star.style.top = `${Math.random() * 100}vh`
      star.style.animationDelay = `${Math.random() * 2}s`
      starsContainer.appendChild(star)
    }
  }
}

function getRandomColor() {
  const greys: string[] = [
    "rgba(255, 255, 255, 0.3)", // White, 40% opacity
    "rgba(220, 220, 220, 0.3)", // Very light gray
    "rgba(190, 190, 190, 0.3)", // Light gray
    "rgba(160, 160, 160, 0.3)", // Medium gray
    "rgba(130, 130, 130, 0.3)", // Darker gray
  ]
  return greys[Math.floor(Math.random() * greys.length)] as string
}

function createGrass(
  layerId: string,
  bladeHeight: number,
  grassDensity: number,
  baseSwaySpeed: number,
): void {
  const grassContainer = document.getElementById(layerId)
  if (grassContainer) {
    for (let i = 0; i < grassDensity; i++) {
      const blade = document.createElement("div")
      blade.classList.add("blade")

      // Randomly position each blade and randomize the height more dynamically.
      blade.style.left = `${Math.random() * 100}%`
      blade.style.height = `${bladeHeight * (0.5 + Math.random() * 0.7)}px`
      blade.style.backgroundColor = getRandomColor()

      // Set random sway angles.
      const startAngle = -10 - Math.random() * 10
      const endAngle = 10 + Math.random() * 10
      blade.style.setProperty("--start-angle", `${startAngle}deg`)
      blade.style.setProperty("--end-angle", `${endAngle}deg`)

      // Randomly stagger the animation start.
      const delay = Math.random() * 2
      blade.style.animationDelay = `-${delay}s`

      // Increase randomness by multiplying the base sway speed by a random factor.
      const durationRandomFactor = 0.5 + Math.random() * 1.5 // Random factor between 0.5 and 2.
      blade.style.animationDuration = `${baseSwaySpeed * durationRandomFactor}s`

      grassContainer.appendChild(blade)

      // Occasionally add a flower.
      if (Math.random() > 0.95) {
        const flower = document.createElement("div")
        flower.classList.add("flower")
        flower.style.transform = `rotate(${360 * Math.random()}deg)`
        blade.appendChild(flower)
      }
    }
  }
}

function Grass() {
  useEffect(() => {
    createStars()

    // Adjust the grass density (if needed, you may change the divisor).
    const densityQuarter = Math.floor(window.innerWidth / 20)

    // Create grass for the left and right containers.
    // Here, the baseSwaySpeed is set to 4 seconds, and each blade's duration will vary more randomly.
    createGrass("grass-layer-left", 240, densityQuarter, 20)
    createGrass("grass-layer-right", 240, densityQuarter, 20)
  }, [])

  return (
    <>
      <div className="grass-layer left" id="grass-layer-left"></div>
      <div className="grass-layer right" id="grass-layer-right"></div>
    </>
  )
}

export default Grass
