import React, { useEffect, useRef, useState } from "react"
import { Marker } from "@repo/map"
import { motion } from "@repo/motion"
import { OffWhiteColor } from "../../helpers/colorPalette"
import rough from "roughjs"
import { appActions } from "../../../store"
import { TooltipType } from "../setup/LayerOrchestrator"

export default function CircleLayer({ markers }: { markers: TooltipType[] }) {
  return (
    <>
      {markers.map((child, idx) => (
        <Marker
          key={idx}
          longitude={child.longitude}
          latitude={child.latitude}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            appActions.setTooltipContent(child)
          }}
        >
          <RoughCircleMarker idx={0} />
        </Marker>
      ))}
    </>
  )
}

export function RoughCircleMarker({
  idx = 0,
  radius = 50,
}: {
  idx: number
  radius?: number
}) {
  const svgRef = useRef<SVGSVGElement | null>(null) // Create a ref for the SVG element
  const [path, setPath] = useState<string>("") // State to hold the path data

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current) // Use Rough.js with the SVG element
      const roughCircle = rc.circle(radius, radius, radius, {
        strokeWidth: 4,
      })
      const pathElement = roughCircle.querySelectorAll("path")[0]
      if (pathElement instanceof SVGPathElement) {
        setPath(pathElement.getAttribute("d") || "") // Extract the 'd' attribute
      }
    }
  }, [radius])

  return (
    <svg
      ref={svgRef} // Attach the ref to the SVG element
      width={radius * 2}
      height={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      style={{
        cursor: "pointer",
        position: "absolute",
        top: 0,
        left: 0,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.path
        className="glow-circle"
        d={path}
        stroke={OffWhiteColor}
        style={{ strokeWidth: 4 }}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        exit={{ pathLength: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: idx * 0.2 }}
      />
    </svg>
  )
}
