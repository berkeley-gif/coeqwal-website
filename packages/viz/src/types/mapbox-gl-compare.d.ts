// Ambient declarations (no top-level export)
declare module "mapbox-gl-compare" {
  import type mapboxgl from "mapbox-gl"

  export type CompareOrientation = "vertical" | "horizontal"

  export interface CompareOptions {
    orientation?: CompareOrientation
    mousemove?: boolean
    onSwipe?: () => void
  }

  export default class Compare {
    constructor(
      before: mapboxgl.Map,
      after: mapboxgl.Map,
      container: string | HTMLElement,
      options?: CompareOptions,
    )
    setSlider(x: number): void
    getContainer(): HTMLElement
  }
}
