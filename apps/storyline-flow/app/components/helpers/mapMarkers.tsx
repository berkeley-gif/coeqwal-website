import { motion } from "@repo/motion"
import React, { useEffect, useRef, useState } from "react"
import rough from "roughjs"
import Image from "next/image"
import { Marker, Popup } from "@repo/map"

export type MarkerType = {
  id: string
  name: string
  latitude: number
  longitude: number
  caption?: string
  image?: string
  anchor: string
}

//TODO: fix exit animation
export function MarkersLayer({ markers }: { markers: MarkerType[] }) {
  return (
    <>
      {markers.map((child, idx) => (
        <MarkerWithPopup
          key={idx}
          marker={child as MarkerType}
          StyledMarker={RoughCircleMarker}
        />
      ))}
    </>
  )
}

export function MarkerWithPopup({
  marker,
  StyledMarker,
}: {
  marker: MarkerType
  StyledMarker: React.FC<{ idx: number }>
}) {
  const [isPopupVisible, setIsPopupVisible] = useState(false)

  return (
    <>
      <Marker
        longitude={marker.longitude}
        latitude={marker.latitude}
        onClick={(e) => {
          e.originalEvent.stopPropagation()
          setIsPopupVisible(!isPopupVisible)
        }}
      >
        <StyledMarker idx={0} />
        {isPopupVisible && (
          <Popup
            longitude={marker.longitude}
            latitude={marker.latitude}
            closeButton={true}
            closeOnClick={true}
            onClose={() => setIsPopupVisible(false)}
            anchor={marker.anchor as mapboxgl.Anchor}
            offset={{ bottom: [0, -10] }}
          >
            <div className="popup">
              <Image
                src={`/variability/${marker.image}`}
                alt={marker.caption || "Marker image"}
                width={470}
                height={300}
                style={{ objectFit: "cover" }}
              />
              <p>{marker.caption}</p>
            </div>
          </Popup>
        )}
      </Marker>
    </>
  )
}

export default function CircleMarker({ idx }: { idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.2 }}
      className="marker"
    ></motion.div>
  )
}

export function RoughCircleMarker({ idx }: { idx: number }) {
  const svgRef = useRef<SVGSVGElement | null>(null) // Create a ref for the SVG element
  const [path, setPath] = useState<string>("") // State to hold the path data

  useEffect(() => {
    if (svgRef.current) {
      const rc = rough.svg(svgRef.current) // Use Rough.js with the SVG element
      const roughCircle = rc.circle(50, 50, 40, {
        strokeWidth: 3,
      })
      const pathElement = roughCircle.querySelectorAll("path")[0]
      if (pathElement instanceof SVGPathElement) {
        setPath(pathElement.getAttribute("d") || "") // Extract the 'd' attribute
      }
    }
  }, [])

  return (
    <svg
      ref={svgRef} // Attach the ref to the SVG element
      width="100"
      height="100"
      viewBox="0 0 100 100"
      style={{ cursor: "pointer", position: "absolute", top: 0, left: 0 }}
    >
      <motion.path
        d={path}
        stroke="#f2f0ef"
        style={{ strokeWidth: 3 }}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        exit={{ pathLength: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: idx * 0.2 }}
      />
    </svg>
  )
}

export function TextMarker({ text }: { text: string }) {
  return (
    <motion.div
      style={{
        fontFamily: "akzidenz-grotesk-next-pro",
        position: "relative", // Parent container for positioning
        display: "inline-block",
        backgroundColor: "rgba(3, 26, 53, 0.7)", // Background color
        padding: "4px 8px", // Padding to create space around the text
        color: "white", // Text color
        fontSize: "14px", // Font size
        lineHeight: "1", // Ensures the text height matches its line height
        textAlign: "center", // Centers the text horizontally
        textAnchor: "middle", // Centers the text vertically
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      {text}
    </motion.div>
  )
}
