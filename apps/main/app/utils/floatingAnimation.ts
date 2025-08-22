/**
 * Generate animation parameters for floating effect, scaled by element size
 * 
 * Creates proportional movement for floating elements where larger elements
 * move more dramatically (feeling closer) and smaller elements move subtly
 * (feeling farther away), to create depth.
 * 
 * @param sizeVw - The viewport width size of the element (e.g., 18 for "18vw")
 * @returns Framer Motion animation configuration object
 */
export const generateFloatingAnimation = (sizeVw = 14) => {
  // Scale movement based on size (18vw is largest, gets scale of 1.0)
  const sizeScale = sizeVw / 18

  const bobDelay = Math.random() * 3 // 0-3 seconds
  const driftDelay = Math.random() * 5 // 0-5 seconds
  const baseBobAmount = 8 + Math.random() * 8 // 8-16px base vertical movement
  const baseDriftAmount = 15 + Math.random() * 15 // 15-30px base horizontal drift
  const bobDuration = 3 + Math.random() * 2 // 3-5 seconds
  const driftDuration = 8 + Math.random() * 6 // 8-14 seconds

  // Scale movement amounts by size
  const bobAmount = baseBobAmount * sizeScale
  const driftAmount = baseDriftAmount * sizeScale
  const rotateAmount = 1 * sizeScale

  return {
    animate: {
      y: [0, -bobAmount, 0],
      x: [-driftAmount / 2, driftAmount / 2, -driftAmount / 2],
      rotate: [-rotateAmount, rotateAmount, -rotateAmount],
    },
    transition: {
      y: {
        duration: bobDuration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: bobDelay,
      },
      x: {
        duration: driftDuration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: driftDelay,
      },
      rotate: {
        duration: bobDuration * 1.3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: bobDelay * 0.7,
      },
    },
  }
}
