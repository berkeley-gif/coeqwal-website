/**
 * Standard map styles for consistent appearance across applications
 */

export const MAP_STYLES = {
  /**
   * River style with blue line
   */
  river: {
    type: 'line' as const,
    paint: {
      'line-color': '#9acbcf',
      'line-width': 3,
      'line-opacity': 1
    },
    layout: {
      'line-cap': 'round' as const,
      'line-join': 'round' as const
    }
  },

  /**
   * Lake/water body style with blue fill
   */
  water: {
    type: 'fill' as const,
    paint: {
      'fill-color': '#9acbcf',
      'fill-opacity': 0.8,
      'fill-outline-color': '#7ba9ae'
    }
  },

  /**
   * Precipitation raster layer style
   */
  precipitation: {
    type: 'raster' as const,
    paint: {
      'raster-opacity': 0.7,
      'raster-fade-duration': 500
    }
  },

  /**
   * Watershed boundary style
   */
  watershed: {
    type: 'line' as const,
    paint: {
      'line-color': '#455a64',
      'line-width': 2,
      'line-opacity': 0.8,
      'line-dasharray': [2, 1]
    },
    layout: {
      'line-join': 'round' as const
    }
  },

  /**
   * Point/marker style for locations
   */
  point: {
    type: 'circle' as const,
    paint: {
      'circle-radius': 6,
      'circle-color': '#ef6c00',
      'circle-opacity': 0.9,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    }
  },

  /**
   * Background state boundary style
   */
  stateBoundary: {
    type: 'line' as const,
    paint: {
      'line-color': '#78909c',
      'line-width': 1,
      'line-opacity': 0.5
    }
  }
}

/**
 * Mapbox style URLs for different themes
 */
export const MAP_THEME_URLS = {
  light: 'mapbox://styles/digijill/cl122pj52001415qofin7bb1c',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12'
}

/**
 * Common transitions for map animations
 */
export const MAP_TRANSITIONS = {
  quick: {
    duration: 1000,
    easing: (t: number) => t * (2 - t)
  },
  smooth: {
    duration: 2000,
    easing: (t: number) => t * (2 - t)
  },
  dramatic: {
    duration: 3500,
    easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }
} 