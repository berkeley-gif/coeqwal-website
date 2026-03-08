import { AnimatePresence, motion } from "@repo/motion"
import React, { useState } from "react"
import Image from "next/image"
import {
  Box,
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  Typography,
  FiberManualRecordIcon,
} from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { appActions } from "../../store"
import { TooltipType } from "../map/setup/LayerOrchestrator"

//TODO: Update the tooltip style
export function FloatImageTooltip({ marker }: { marker: TooltipType }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const images = marker.images || [] // Fallback to single image if no array
  const { project } = useMap()
  const coordinates = project(marker.longitude, marker.latitude) ?? {
    x: 0,
    y: 0,
  }
  const transformClass = `popup-${marker.anchor || "top"}`

  const nextImage = () => {
    setCurrentImgIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const closeTooltip = () => appActions.setTooltipContent(null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ top: coordinates.y, left: coordinates.x }}
      className={`popup ${transformClass}`}
    >
      <button className="popup-close-button" onClick={closeTooltip}>
        ×
      </button>

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          color: "common.white",
        }}
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

      <Box sx={{ color: "text.primary", mt: 1, mb: 1 }}>
        <Typography variant="h6">{marker.name}</Typography>
        <Typography variant="caption">{marker.year}</Typography>
        <Typography variant="body1" sx={{ marginTop: 2 }}>
          {marker.captions ? marker.captions[currentImgIndex] || "" : ""}
        </Typography>
      </Box>
    </motion.div>
  )
}

export function ImageTooltip({ marker }: { marker: TooltipType }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0)
  const images = marker.images || [] // Fallback to single image if no array

  const nextImage = () => {
    setCurrentImgIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  return (
    <Box className="popup">
      <Box sx={{ position: "relative", overflow: "hidden", width: "100%" }}>
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

      <Box>
        <Typography variant="h3">{marker.name}</Typography>
        <Typography variant="caption">
          {marker.captions ? marker.captions[currentImgIndex] || "" : ""}
        </Typography>
      </Box>
    </Box>
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
