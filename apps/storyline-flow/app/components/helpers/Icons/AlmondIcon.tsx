import React, { useId } from "react"

interface IconProps {
  fillPercentage?: number
  size?: number
  style?: React.CSSProperties
  reversed?: boolean
}

//TODO: figure out scaling
function AlmondIcon({
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
        d="M25.0369 0C38.9837 11.7936 41.3044 21.9764 41.3044 30.9735C41.3045 39.4082 35.6113 48.6968 26.8329 49.8802C26.2595 49.9576 25.6728 49.9984 25.0737 50C24.4746 49.9984 23.8874 49.9576 23.3128 49.8802C14.5183 48.6968 8.69571 39.4082 8.69575 30.9735C8.69578 21.9764 11.0165 11.7936 24.9633 0H25.0369ZM38.3601 30.8008C38.3601 23.7005 35.9377 12.847 24.9188 3.53983H24.8606C13.8417 12.847 11.7137 23.7005 11.7137 30.8008C11.7137 37.4573 16.6083 45.7267 23.5566 46.6607C24.0104 46.7217 24.4742 46.7539 24.9475 46.7552C25.4206 46.7539 25.8848 46.7217 26.3378 46.6607C33.2733 45.7267 38.3601 37.4573 38.3601 30.8008Z"
        fill="white"
        clipPath={`url(#${clipID})`}
      />

      <path
        d="M26.2146 47.5664V3.46608H23.5647V47.5664H26.2146Z"
        fill="white"
        clipPath={`url(#${clipID})`}
      />
      <path
        d="M21.1355 3.68732C17.9126 19.7133 13.8319 27.9366 20.9883 49.2626H23.491C16.1874 27.9366 20.4153 19.7133 23.6382 3.68732H21.1355Z"
        fill="white"
        clipPath={`url(#${clipID})`}
      />
      <path
        d="M28.6494 3.83481C31.8723 19.8608 35.9531 28.0841 28.7967 49.4101H26.294C33.5976 28.0841 29.3696 19.8608 26.1467 3.83481H28.6494Z"
        fill="white"
        clipPath={`url(#${clipID})`}
      />
    </svg>
  )
}

export default AlmondIcon
