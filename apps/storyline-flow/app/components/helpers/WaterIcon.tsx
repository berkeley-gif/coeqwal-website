import { motion } from "@repo/motion"

export function WaterDropIcon({
  color = "#f2f0ef",
  transform = "translate(0, 0)",
}: {
  color?: string
  transform?: string
  delay?: number
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 133 133" // Match the dimensions of the path
      width="100%" // Allow scaling
      height="100%" // Allow scaling
      style={{
        display: "block", // Ensure the SVG behaves like a block element
      }}
    >
      <motion.path
        initial={{ fill: "#f2f0ef" }}
        animate={{ fill: color }}
        style={{
          transform: transform,
        }}
        d="M66.9999 11.25C37.2408 36.8438 22.3333 58.95 22.3333 77.625C22.3333 105.638 43.5499 123.75 66.9999 123.75C90.4499 123.75 111.667 105.638 111.667 77.625C111.667 58.95 96.7591 36.8438 66.9999 11.25Z"
      />
    </svg>
  )
}
