import type { MapboxMapRef } from "@repo/map"

// Define interface for map properties
interface MapProps {
  center: [number, number]
  zoom: number
  bearing: number
  pitch: number
}

/**
 * KenBurnsMapEffect - Creates smooth animated panning and zooming effects for maps
 * Inspired by the Ken Burns effect for photos (slow pan and zoom)
 */
export class KenBurnsMapEffect {
  private map: MapboxMapRef | null = null
  private mapRef: React.RefObject<MapboxMapRef | null>
  private animationFrameId: number | null = null
  private isPlaying = false
  private sequence: Array<{
    center: [number, number]
    zoom: number
    bearing?: number
    pitch?: number
    duration: number
  }> = []
  private currentIndex = 0
  private lastTimestamp: number | null = null
  private currentDuration = 0
  private startProps: MapProps | null = null
  private targetProps: MapProps | null = null

  constructor(mapRef: React.RefObject<MapboxMapRef | null>) {
    this.mapRef = mapRef
    this.map = mapRef.current
    console.log(
      "🗺️ KenBurnsMapEffect initializing with map:",
      this.map ? "Valid map instance" : "No map instance yet",
    )

    // We'll now assume the map is available when this constructor is called
    // The calling component (HeroSection) is responsible for ensuring map availability
  }

  /**
   * Add a keyframe to the animation sequence
   */
  addKeyframe(
    center: [number, number],
    zoom: number,
    duration: number = 5000,
    bearing: number = 0,
    pitch: number = 0,
  ) {
    this.sequence.push({ center, zoom, bearing, pitch, duration })
    return this
  }

  /**
   * Start the animation sequence
   */
  start() {
    if (this.isPlaying) return this

    // Get the current map reference - it might have changed
    this.map = this.mapRef.current

    this.isPlaying = true
    this.currentIndex = 0

    if (this.map && this.sequence.length > 0) {
      console.log("▶️ Starting Ken Burns effect with map - IMMEDIATE")

      // Apply tiny immediate movement to provide instant visual feedback
      // This helps overcome any perception of delay
      const currentCenter = this.map.getCenter()
      const microShift = 0.0002 // Extremely small movement
      this.map.jumpTo({
        center: [
          currentCenter.lng + microShift,
          currentCenter.lat - microShift,
        ],
      })

      // Start animation immediately
      requestAnimationFrame(() => {
        this.playCurrentKeyframe()
      })
    } else {
      console.warn(
        "⚠️ Cannot start Ken Burns effect - map or sequence not available",
      )
      if (!this.map) console.warn("  - Map is not available")
      if (this.sequence.length === 0)
        console.warn("  - No keyframes in sequence")
    }

    return this
  }

  /**
   * Set up and play the current keyframe in the sequence
   */
  private playCurrentKeyframe() {
    if (!this.map || !this.isPlaying) return

    const currentKeyframe = this.sequence[this.currentIndex]

    // Ensure we have a valid keyframe
    if (!currentKeyframe) {
      this.stop()
      return
    }

    // Get current map properties
    const currentCenter = this.map.getCenter()
    const currentZoom = this.map.getZoom()
    const currentBearing = this.map.getBearing()
    const currentPitch = this.map.getPitch()

    // Set start and target properties
    this.startProps = {
      center: [currentCenter.lng, currentCenter.lat],
      zoom: currentZoom,
      bearing: currentBearing,
      pitch: currentPitch,
    }

    this.targetProps = {
      center: currentKeyframe.center,
      zoom: currentKeyframe.zoom,
      bearing: currentKeyframe.bearing ?? 0,
      pitch: currentKeyframe.pitch ?? 0,
    }

    // Initialize animation
    this.currentDuration = currentKeyframe.duration
    this.lastTimestamp = null

    // Start the animation loop
    this.animateFrame()
  }

  /**
   * Animate a single frame of the effect
   */
  private animateFrame = (timestamp?: number) => {
    if (!this.isPlaying || !this.map || !this.startProps || !this.targetProps) {
      console.warn(
        "⚠️ Animation frame canceled - isPlaying:",
        this.isPlaying,
        "map available:",
        !!this.map,
      )
      return
    }

    // Initialize timestamp and do first frame animation immediately
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp || performance.now()
      console.log("🎬 Starting animation frames IMMEDIATELY")

      // Apply small initial movement for immediate visual feedback
      // instead of waiting for next animation frame
      const initialProgress = 0.03 // 3% progress for immediate feedback

      // Apply small initial movement
      const newCenter: [number, number] = [
        this.startProps.center[0] +
          (this.targetProps.center[0] - this.startProps.center[0]) *
            initialProgress,
        this.startProps.center[1] +
          (this.targetProps.center[1] - this.startProps.center[1]) *
            initialProgress,
      ]

      const newZoom =
        this.startProps.zoom +
        (this.targetProps.zoom - this.startProps.zoom) * initialProgress
      const newBearing =
        this.startProps.bearing +
        (this.targetProps.bearing - this.startProps.bearing) * initialProgress
      const newPitch =
        this.startProps.pitch +
        (this.targetProps.pitch - this.startProps.pitch) * initialProgress

      // Apply immediate movement
      this.map.jumpTo({
        center: newCenter,
        zoom: newZoom,
        bearing: newBearing,
        pitch: newPitch,
      })

      // Then continue with animation frames
      this.animationFrameId = requestAnimationFrame(this.animateFrame)
      return
    }

    // Calculate progress
    const elapsed = (timestamp || performance.now()) - this.lastTimestamp
    const progress = Math.min(elapsed / this.currentDuration, 1)

    // Interpolate values
    const newCenter: [number, number] = [
      this.startProps!.center[0] +
        (this.targetProps!.center[0] - this.startProps!.center[0]) * progress,
      this.startProps!.center[1] +
        (this.targetProps!.center[1] - this.startProps!.center[1]) * progress,
    ]

    const newZoom =
      this.startProps!.zoom +
      (this.targetProps!.zoom - this.startProps!.zoom) * progress
    const newBearing =
      this.startProps!.bearing +
      (this.targetProps!.bearing - this.startProps!.bearing) * progress
    const newPitch =
      this.startProps!.pitch +
      (this.targetProps!.pitch - this.startProps!.pitch) * progress

    try {
      // Apply to map without causing React state changes
      this.map.jumpTo({
        center: newCenter,
        zoom: newZoom,
        bearing: newBearing,
        pitch: newPitch,
      })

      // Uncomment for detailed logging (warning: generates a lot of console output)
      // if (Math.floor(progress * 100) % 10 === 0) {
      //   console.log(`🔄 Animation progress: ${Math.floor(progress * 100)}%`, { newCenter, newZoom });
      // }
    } catch (err) {
      console.error("❌ Error applying map animation:", err)
      this.stop()
      return
    }

    // Check if current keyframe is done
    if (progress < 1) {
      // Continue animation
      this.animationFrameId = requestAnimationFrame(this.animateFrame)
    } else {
      console.log("✅ Keyframe complete, moving to next")
      // Move to next keyframe or loop back to first
      this.currentIndex = (this.currentIndex + 1) % this.sequence.length

      // Play next keyframe or stop if we're done
      if (this.currentIndex !== 0 || this.loop) {
        this.playCurrentKeyframe()
      } else {
        this.stop()
      }
    }
  }

  /**
   * Stop the animation and clean up resources
   */
  stop() {
    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    return this
  }

  /**
   * Set to loop the animation
   */
  private loop = false
  setLoop(shouldLoop: boolean) {
    this.loop = shouldLoop
    return this
  }
}

/**
 * Create a Ken Burns effect for the hero section
 * @param mapRef Reference to the map instance
 */
export function createHeroKenBurnsEffect(
  mapRef: React.RefObject<MapboxMapRef | null>,
) {
  // California-wide view
  const effect = new KenBurnsMapEffect(mapRef)
    .addKeyframe([-119.4179, 37.7653], 5, 12000) // Start with central California
    .addKeyframe([-123.7104, 39.4621], 7, 10000, 15) // Move to northern California coast with slight rotation
    .addKeyframe([-119.0222, 35.3733], 6.5, 10000) // Pan to central valleys
    .addKeyframe([-115.1391, 36.1699], 8, 10000) // Pan to Las Vegas/Colorado River
    .addKeyframe([-119.4179, 37.7653], 5, 10000) // Return to starting point
    .setLoop(true)

  return effect
}
 