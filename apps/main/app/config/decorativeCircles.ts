/**
 * Configuration for decorative floating circles in the IntroSection
 * These circles create ambient background movement and visual depth
 */

interface Circle {
  size: number // in vw units
  top: string
  left: string
  color: "white" | "blue"
  opacity?: number
}

/**
 * Decorative background circles - scattered behind content for ambiance
 */
export const decorativeCircles: Circle[] = [
  // White decorative circles
  { size: 10, top: "18%", left: "34%", color: "white" },
  { size: 18, top: "24%", left: "48%", color: "white" },
  { size: 10, top: "66%", left: "60%", color: "white" },
  { size: 12, top: "30%", left: "74%", color: "white" },

  // Blue decorative circles
  { size: 10, top: "18%", left: "35%", color: "blue" },
  { size: 6, top: "62%", left: "78%", color: "blue" },
  { size: 4, top: "32%", left: "86%", color: "blue" },
]
