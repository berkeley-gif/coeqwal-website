export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  bearing: number
  pitch: number
  padding?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  transitionDuration?: number
  transitionEasing?: (t: number) => number
  bounds?: [[number, number], [number, number]] // [southwest, northeast] corners
  animationOptions?: {
    duration?: number
    easing?: (t: number) => number
  }
}
