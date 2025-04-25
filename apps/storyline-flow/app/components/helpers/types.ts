export type MarkerType = {
  id: string
  name: string
  coordinates: number[]
  caption: string
  image: string
  anchor: string
}

export interface Point {
  latitude: number
  longitude: number
  caption?: string
}
