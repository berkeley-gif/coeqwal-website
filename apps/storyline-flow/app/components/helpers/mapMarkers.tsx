import { motion } from "@repo/motion"
import React, { useEffect, useRef, useState } from "react"
import rough from "roughjs"
import Image from "next/image"
import { Marker, Popup } from "@repo/map"
import {
  InfrastructureColor,
  OceanWaterColor,
  OffWhiteColor,
} from "./colorPalette"
import { ImageTooltip } from "./Tooltip"
import useStoryStore from "../../store"

export type MarkerType = {
  id: string
  name: string
  latitude: number
  longitude: number
  captions?: string[]
  source?: string
  images?: string[]
  anchor?: string
  rotation?: number
}

export function DamLayer({ markers }: { markers: MarkerType[] }) {
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
              cursor: "pointer",
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

export function TextMarkersLayer({
  markers,
  styledMarker = TextMarker,
}: {
  markers: MarkerType[]
  styledMarker?: React.FC<{ text: string }>
}) {
  return (
    <>
      {markers.map((child, idx) => (
        <Marker key={idx} longitude={child.longitude} latitude={child.latitude}>
          {React.createElement(styledMarker, { text: child.name })}
        </Marker>
      ))}
    </>
  )
}

export function TooltipLayer({
  markers,
  StyledMarker = RoughCircleMarker,
}: {
  markers: MarkerType[]
  StyledMarker?: React.FC<{ idx: number }>
}) {
  const setTooltipContent = useStoryStore((state) => state.setTooltipContent)

  return (
    <>
      {markers.map((child, idx) => (
        <Marker
          key={idx}
          longitude={child.longitude}
          latitude={child.latitude}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setTooltipContent(child)
          }}
        >
          <StyledMarker idx={0} />
        </Marker>
      ))}
    </>
  )
}

export function CarouselLayer({
  markers,
  styledMarker = RoughCircleMarker,
}: {
  markers: MarkerType[]
  styledMarker?: React.FC<{ idx: number }>
}) {
  return (
    <>
      {markers.map((child, idx) => (
        <MarkerWithCarouselPopup
          key={idx}
          marker={child as MarkerType}
          StyledMarker={styledMarker}
        />
      ))}
    </>
  )
}

export function MarkerWithCarouselPopup({
  marker,
  StyledMarker,
}: {
  marker: MarkerType
  StyledMarker: React.FC<{ idx: number }>
}) {
  const [isPopupVisible, setIsPopupVisible] = useState(true)
  return (
    <>
      <Marker
        longitude={marker.longitude}
        latitude={marker.latitude}
        onClick={(e) => {
          e.originalEvent.stopPropagation()
          setIsPopupVisible(!isPopupVisible)
          console.log("Marker clicked", marker.name)
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
            <ImageTooltip marker={marker} />
          </Popup>
        )}
      </Marker>
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
  const [isPopupVisible, setIsPopupVisible] = useState(true)

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
                src={`${marker.images ? marker.images[0] : ""}`}
                alt={"Marker image"}
                width={600}
                height={400}
                style={{ objectFit: "cover" }}
              />
              <h3>{marker.name}</h3>
              <p>{""}</p>
            </div>
          </Popup>
        )}
      </Marker>
    </>
  )
}

export default function CircleMarker({ idx = 0 }: { idx: number }) {
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

export function TextMarker({ text }: { text: string }) {
  return (
    <motion.div
      style={{
        fontFamily: "akzidenz-grotesk-next-pro",
        position: "relative", // Parent container for positioning
        display: "inline-block",
        backgroundColor: `${OceanWaterColor}`, // Background color
        padding: "4px 8px", // Padding to create space around the text
        color: "white", // Text color
        fontSize: "1rem", // Font size
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
