/**
 * Configuration for floating image markers in the IntroSection
 * These are the circular crop images that float with halos behind them
 */

interface ImageMarker {
  id: string
  imageSrc: string
  imageSize: number // in vw units
  top: string
  left: string
  /** Optional z-index override for specific markers */
  zIndex?: number
}

/**
 * Floating image markers - circular crop images with halos
 * Positioned to create a dynamic cluster effect across the hero section
 */
export const floatingMarkers: ImageMarker[] = [
  // Main cluster of images
  {
    id: "image-7",
    imageSrc: "/images/circular-crops/8.png",
    imageSize: 14,
    top: "20%",
    left: "42%",
  },
  {
    id: "image-12",
    imageSrc: "/images/circular-crops/12.png",
    imageSize: 10,
    top: "16%",
    left: "78%",
  },
  {
    id: "image-9",
    imageSrc: "/images/circular-crops/9.png",
    imageSize: 12,
    top: "62%",
    left: "68%",
  },
  {
    id: "image-14",
    imageSrc: "/images/circular-crops/14.png",
    imageSize: 10,
    top: "42%",
    left: "80%",
  },
  {
    id: "image-11",
    imageSrc: "/images/circular-crops/4.png",
    imageSize: 16,
    top: "50%",
    left: "46%",
  },

  // Center image - on top of all others
  {
    id: "image-3",
    imageSrc: "/images/circular-crops/3.png",
    imageSize: 18,
    top: "25%",
    left: "60%",
    zIndex: 1, // Higher z-index to appear on top
  },
]
