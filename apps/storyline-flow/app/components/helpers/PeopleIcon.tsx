import React, { useId } from "react"

interface IconProps {
  fillPercentage?: number
  size?: number
  style?: React.CSSProperties
  reversed?: boolean
}

//TODO: figure out scaling
function PeopleIcon({
  fillPercentage = 100,
  size = 50,
  reversed = false,
  style,
}: IconProps) {
  const id = useId()

  // Calculate the clip width based on the fillPercentage and the SVG width (50)
  const clipWidth = (fillPercentage / 100) * size
  const clipID = `clip-${id}`
  const start = Math.min(clipWidth, size - clipWidth)
  const end = Math.max(clipWidth, size - clipWidth)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", ...style }}
    >
      <defs>
        <clipPath id={clipID}>
          {reversed ? (
            <rect x={start} y="0" width={end} height={size} />
          ) : (
            <rect x="0" y="0" width={clipWidth} height={size} />
          )}
        </clipPath>
      </defs>
      <path
        d="M10 10C10 4.475 14.475 0 20 0C25.525 0 30 4.475 30 10C30 15.525 25.525 20 20 20C14.475 20 10 15.525 10 10Z"
        fill="white"
        clipPath={`url(#${clipID})`}
      />

      <path
        d="M20 25C8.95 25 0 29.5 0 35V40H40V35C40 29.5 31.05 25 20 25Z"
        fill="white"
        clipPath={`url(#${clipID})`}
      />
    </svg>
  )
}

export default PeopleIcon
