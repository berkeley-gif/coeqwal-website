import { motion } from "@repo/motion"
import { TooltipType } from "../setup/LayerOrchestrator"
import { Marker } from "@repo/map"
import { InfrastructureColor } from "../../helpers/colorPalette"

export function DamLayer({ markers }: { markers: TooltipType[] }) {
  const height = 12.99 // Height for an equilateral triangle with side length 15
  const width = 15 // Side length of the equilateral triangle

  return (
    <>
      {markers.map((marker, idx) => (
        <Marker
          key={idx}
          longitude={marker.longitude}
          latitude={marker.latitude}
        >
          <motion.svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <polygon
              points={`${width / 2},${height} 0,0 ${width},0`}
              fill={InfrastructureColor} // Darker blue color for dams
              strokeWidth="1"
            />
          </motion.svg>
        </Marker>
      ))}
    </>
  )
}
