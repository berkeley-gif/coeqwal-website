interface concentricConfig {
  size: { width: number; height: number }
  shift: [number, number]
  radius: number
}

interface benefitConfig {
  norcal: concentricConfig
  socal: concentricConfig
  agriculture: concentricConfig
  economy: concentricConfig
}

export const concentricTransform: Record<string, benefitConfig> = {
  xs: {
    norcal: {
      size: { width: 300, height: 400 },
      shift: [1, 0.05],
      radius: 40,
    },
    socal: {
      size: { width: 400, height: 400 },
      shift: [1, 0.05],
      radius: 35,
    },
    agriculture: {
      size: { width: 400, height: 400 },
      shift: [0.0, 0.0],
      radius: 40,
    },
    economy: {
      size: { width: 400, height: 400 },
      shift: [0.5, 0.3],
      radius: 40,
    },
  },
  sm: {
    norcal: {
      size: { width: 300, height: 400 },
      shift: [1, 0.05],
      radius: 40,
    },
    socal: {
      size: { width: 400, height: 400 },
      shift: [1, 0.05],
      radius: 35,
    },
    agriculture: {
      size: { width: 400, height: 400 },
      shift: [0.0, 0.0],
      radius: 40,
    },
    economy: {
      size: { width: 400, height: 400 },
      shift: [0.5, 0.3],
      radius: 40,
    },
  },
  md: {
    norcal: {
      size: { width: 300, height: 400 },
      shift: [1, 0.05],
      radius: 40,
    },
    socal: {
      size: { width: 400, height: 400 },
      shift: [1, 0.05],
      radius: 35,
    },
    agriculture: {
      size: { width: 400, height: 400 },
      shift: [0.0, 0.0],
      radius: 40,
    },
    economy: {
      size: { width: 400, height: 400 },
      shift: [0.5, 0.3],
      radius: 40,
    },
  },
  lg: {
    norcal: {
      size: { width: 300, height: 400 },
      shift: [0.8, 0.05],
      radius: 35,
    },
    socal: {
      size: { width: 400, height: 400 },
      shift: [1, 0.05],
      radius: 35,
    },
    agriculture: {
      size: { width: 400, height: 400 },
      shift: [0.5, 0.3],
      radius: 35,
    },
    economy: {
      size: { width: 400, height: 400 },
      shift: [0.6, 0.6],
      radius: 35,
    },
  },
  xl: {
    norcal: {
      size: { width: 600, height: 400 },
      shift: [1, 0.3],
      radius: 50,
    },
    socal: {
      size: { width: 800, height: 400 },
      shift: [0.8, 0.27],
      radius: 50,
    },
    agriculture: {
      size: { width: 600, height: 400 },
      shift: [0.5, 0.7],
      radius: 50,
    },
    economy: {
      size: { width: 600, height: 450 },
      shift: [0.6, 0.9],
      radius: 50,
    },
  },
}

interface visibleIconTransformConfig {
  x: string
  aboveY: string
  belowY: string
}

export const visibleIconTransform: Record<string, visibleIconTransformConfig> =
  {
    xs: {
      x: "-0.5em",
      aboveY: "-1.5em",
      belowY: "0.5em",
    },
    sm: {
      x: "-0.5em",
      aboveY: "-1.5em",
      belowY: "0.5em",
    },
    md: {
      x: "-0.5em",
      aboveY: "-1.5em",
      belowY: "0.5em",
    },
    lg: {
      x: "-0.57em",
      aboveY: "-2.2em",
      belowY: "1.0em",
    },
    xl: {
      x: "-0.45em",
      aboveY: "-1.7em",
      belowY: "0.7em",
    },
  }

interface grassConfig {
  sideBladeHeight: number
  centerBladeHeight: number
}

export const grassConfig: Record<string, grassConfig> = {
  xs: {
    sideBladeHeight: 20,
    centerBladeHeight: 30,
  },
  sm: {
    sideBladeHeight: 20,
    centerBladeHeight: 30,
  },
  md: {
    sideBladeHeight: 20,
    centerBladeHeight: 30,
  },
  lg: {
    sideBladeHeight: 150,
    centerBladeHeight: 100,
  },
  xl: {
    sideBladeHeight: 180,
    centerBladeHeight: 130,
  },
}
