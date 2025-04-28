import { AnimatePresence, motion } from "@repo/motion"
import React, { useEffect, useRef, useState } from "react"
import rough from "roughjs"
import Image from "next/image"
import { Marker, Popup } from "@repo/map"
import {
  Box,
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  Typography,
  FiberManualRecordIcon,
} from "@repo/ui/mui"

export type MarkerType = {
  id: string
  name: string
  latitude: number
  longitude: number
  captions?: string[]
  source?: string
  images?: string[]
  anchor?: string
}

//TODO: fix exit animation
export function MarkersLayer({
  markers,
  styledMarker = RoughCircleMarker,
}: {
  markers: MarkerType[]
  styledMarker?: React.FC<{ idx: number; radius?: number }>
}) {
  return (
    <>
      {markers.map((child, idx) => (
        <MarkerWithPopup
          key={idx}
          marker={child as MarkerType}
          StyledMarker={styledMarker}
        />
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
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [currentImgIndex, setCurrentImgIndex] = useState(0)

  const images = marker.images || [] // Fallback to single image if no array

  const nextImage = () => {
    console.log("you clicked next")
    setCurrentImgIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    console.log("you clicked prev")
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }

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
            <Box className="popup">
              <Box
                sx={{ position: "relative", overflow: "hidden", width: "100%" }}
              >
                <ImageContainer
                  images={images as string[]}
                  currentImgIndex={currentImgIndex}
                  captions={marker.captions || [""]}
                />

                {images.length > 1 && (
                  <CarouselNavigation
                    images={images as string[]}
                    currentImgIndex={currentImgIndex}
                    setCurrentImgIndex={setCurrentImgIndex}
                    nextImage={nextImage}
                    prevImage={prevImage}
                  />
                )}
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="h6">{marker.name}</Typography>
                <Typography variant="body2">
                  {marker.captions
                    ? marker.captions[currentImgIndex] || ""
                    : ""}
                </Typography>
              </Box>
            </Box>
          </Popup>
        )}
      </Marker>
    </>
  )
}

function ImageContainer({
  images,
  currentImgIndex,
  captions,
}: {
  images: string[]
  currentImgIndex: number
  captions: string[]
}) {
  return (
    <Box className="carousel-container">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentImgIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          style={{ width: "100%" }}
        >
          <Image
            src={`${images[currentImgIndex]}`}
            alt={captions[currentImgIndex] || "Caption not available"}
            width={500}
            height={300}
            style={{ objectFit: "cover" }}
          />
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}

function CarouselNavigation({
  images,
  currentImgIndex,
  setCurrentImgIndex,
  nextImage,
  prevImage,
}: {
  images: string[]
  currentImgIndex: number
  setCurrentImgIndex: (index: number) => void
  nextImage: () => void
  prevImage: () => void
}) {
  return (
    <>
      <IconButton
        className="nav-button"
        onClick={(e) => {
          e.stopPropagation()
          prevImage()
        }}
        sx={{ left: 8 }}
        size="small"
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        className="nav-button"
        onClick={(e) => {
          e.stopPropagation()
          nextImage()
        }}
        sx={{ right: 8 }}
        size="small"
      >
        <ChevronRightIcon />
      </IconButton>

      <Box className="indicator-dots">
        {images.map((_, index) => (
          <IconButton
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentImgIndex(index)
            }}
            className={`dot ${currentImgIndex === index ? "active" : ""}`}
            size="small"
          >
            <FiberManualRecordIcon sx={{ fontSize: 10 }} />
          </IconButton>
        ))}
      </Box>
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
        d={path}
        stroke="#f2f0ef"
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
