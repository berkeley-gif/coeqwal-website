export const views = {
  // precipitation animation
  arOverview: {
    center: [-135, 35] as [number, number],
    zoom: 4.8,
    pitch: 0,
    bearing: 0,
  },
  // close-up of Sacramento–San Joaquin Delta
  deltaClose: {
    center: [-122.305, 39] as [number, number],
    zoom: 7.82,
    pitch: 60,
    bearing: 45,
  },
} as const

export type ViewKey = keyof typeof views
export type ViewStatePreset = (typeof views)[ViewKey] 