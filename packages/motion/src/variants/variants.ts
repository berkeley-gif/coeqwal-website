export const opacityVariants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: delay,
    },
  }),
}

export const axisVariants = {
  hidden: { pathLength: 0 },
  visible: (delay: number) => ({
    pathLength: 1,
    transition: {
      duration: 1.5,
      once: true,
      delay: delay,
    },
  }),
}

export const tickVariants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: {
      duration: 0.3,
      delay: delay,
    },
  }),
}

export const labelVariants = {
  hidden: { opacity: 0 },
  visible: (custom: number) => ({
    opacity: 1,
    transition: {
      duration: 0.8,
      delay: custom,
    },
  }),
}

type BarVariants = {
  yPos: number
  barHeight: number
  order: number
  baseline: number
}

export const barVariants = {
  initial: (custom: BarVariants) => ({
    opacity: 0,
    height: 0,
    y: custom.baseline,
  }),
  visible: (custom: BarVariants) => ({
    opacity: 1,
    height: custom.barHeight,
    y: custom.yPos,
    transition: {
      duration: 0.8,
      delay: custom.order * 0.1 + 3,
    },
  }),
}

export const popUpVariants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
  },
  visible: (custom: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
      duration: 1.5,
      delay: custom * 0.1,
    },
  }),
}

export const horizontalGrowRectVariants = {
  hidden: {
    width: 0,
  },
  visible: (custom: { width: number; delay: number }) => ({
    width: custom.width,
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      delay: custom.delay,
    },
  }),
}
