interface concentricConfig {
  size: { width: number; height: number }
  shift: [number, number]
  radius: number
}

export interface pictogramConfig {
  shift: {
    left: string
    top: string
  }
  scale: string
  iconSize: number
  spacing: number
  animation: {
    showLine: boolean
    unit: number
    generalControl: [number, number]
    partialControl: [number, number]
    totalControl: [number, number]
  }
  mode: "people-norcal" | "people-socal" | "economy" | "agriculture"
}

interface pictogramBenefitConfig {
  norcal: pictogramConfig
  socal: pictogramConfig
  agriculture?: pictogramConfig
  economy?: pictogramConfig
}

export const pictogramTransform: Record<string, pictogramBenefitConfig> = {
  lg: {
    norcal: {
      shift: {
        left: "4%",
        top: "13%",
      },
      scale: "scale(0.6)",
      iconSize: 24,
      spacing: 2,
      animation: {
        showLine: true,
        unit: 0.01,
        generalControl: [0.35, 0.55],
        partialControl: [0.4, 0.5],
        totalControl: [0.5, 0.6],
      },
      mode: "people-norcal",
    },
    socal: {
      shift: {
        left: "13%",
        top: "60%",
      },
      scale: "scale(0.6)",
      iconSize: 24,
      spacing: 2,
      animation: {
        showLine: true,
        unit: 0.01,
        generalControl: [0.35, 0.55],
        partialControl: [0.4, 0.5],
        totalControl: [0.5, 0.6],
      },
      mode: "people-socal",
    },
    agriculture: {
      shift: {
        left: "5%",
        top: "15%",
      },
      scale: "scale(1.4)",
      iconSize: 25.2,
      spacing: 2.1,
      animation: {
        showLine: false,
        unit: 0.005,
        generalControl: [0.1, 0.3],
        partialControl: [0.15, 0.35],
        totalControl: [0.25, 0.45],
      },
      mode: "agriculture",
    },
    economy: {
      shift: {
        left: "5%",
        top: "25%",
      },
      scale: "scale(1.4)",
      iconSize: 28,
      spacing: 2.2,
      animation: {
        showLine: false,
        unit: 0.005,
        generalControl: [0.1, 0.3],
        partialControl: [0.15, 0.35],
        totalControl: [0.25, 0.45],
      },
      mode: "economy",
    },
  },
  xl: {
    norcal: {
      shift: {
        left: "15%",
        top: "10%",
      },
      scale: "scale(0.8)",
      iconSize: 32,
      spacing: 2.5,
      animation: {
        showLine: true,
        unit: 0.01,
        generalControl: [0.35, 0.55],
        partialControl: [0.4, 0.5],
        totalControl: [0.4, 0.5],
      },
      mode: "people-norcal",
    },
    socal: {
      shift: {
        left: "24%",
        top: "65%",
      },
      scale: "scale(0.8)",
      iconSize: 32,
      spacing: 2.5,
      animation: {
        showLine: true,
        unit: 0.01,
        generalControl: [0.35, 0.55],
        partialControl: [0.4, 0.5],
        totalControl: [0.5, 0.6],
      },
      mode: "people-socal",
    },
    agriculture: {
      shift: {
        left: "8%",
        top: "20%",
      },
      scale: "scale(1.8)",
      iconSize: 32.4,
      spacing: 2.8,
      animation: {
        showLine: false,
        unit: 0.01,
        generalControl: [0, 0.2],
        partialControl: [0.1, 0.3],
        totalControl: [0.15, 0.35],
      },
      mode: "agriculture",
    },
    economy: {
      shift: {
        left: "8%",
        top: "20%",
      },
      scale: "scale(1.8)",
      iconSize: 36,
      spacing: 3,
      animation: {
        showLine: false,
        unit: 0.01,
        generalControl: [0.1, 0.3],
        partialControl: [0.15, 0.35],
        totalControl: [0.25, 0.45],
      },
      mode: "economy",
    },
  },
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
      shift: [0.6, 0.05],
      radius: 35,
    },
    socal: {
      size: { width: 400, height: 400 },
      shift: [1, 0.05],
      radius: 35,
    },
    agriculture: {
      size: { width: 400, height: 400 },
      shift: [0.5, 0.0],
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
      shift: [0.1, 0.3],
      radius: 50,
    },
    socal: {
      size: { width: 800, height: 400 },
      shift: [0.5, 0.3],
      radius: 50,
    },
    agriculture: {
      size: { width: 600, height: 400 },
      shift: [0.5, 0.2],
      radius: 50,
    },
    economy: {
      size: { width: 600, height: 450 },
      shift: [0.6, 0.9],
      radius: 50,
    },
  },
}

export interface visibleIconTransformConfig {
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
      x: "-0.48em",
      aboveY: "-1.9em",
      belowY: "0.9em",
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
