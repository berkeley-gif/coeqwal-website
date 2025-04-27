export const springUpTextVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", delay: custom * 1.5 },
  }),
}

export const opacityTextVariants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: delay,
    },
  }),
}
