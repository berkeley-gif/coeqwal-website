"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import { motion, useScroll, useAnimation } from "@repo/motion"
import { useEffect, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import Underline from "./helpers/Underline"

//TODO: motion doesn't support component prop
//TODO: make sure all map layers are disabled here
function Opener() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.opener
  const { sectionRef } = useActiveSection("opener", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  })
  const controls = useAnimation()
  const [startAnimation, setStartAnimation] = useState(false)

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest >= 0.4) {
        controls.start("visible")
      }
    })

    return () => unsubscribe()
  }, [scrollYProgress, controls])

  const opacityFloatVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    transition: { duration: 2, type: "spring" },
  }

  return (
    <Box
      ref={sectionRef}
      id="opener"
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="header" role="banner">
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {content?.title}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {content?.subtitle}
        </Typography>
      </Box>
      <Stack spacing={12} direction="column" component="section" role="region">
        <Box className="paragraph" component="article">
          <Typography variant="body1">{content?.p1}</Typography>
          <Typography variant="body1">{content?.p2}</Typography>
        </Box>
        <motion.div
          className="paragraph"
          aria-labelledby="opener-throughline"
          variants={opacityFloatVariants}
          initial="hidden"
          animate={controls}
          onAnimationComplete={() => setStartAnimation(true)}
        >
          <Typography id="throughline-heading" variant="body1">
            {content?.throughline.p11}
            <Underline startAnimation={startAnimation}>
              {content?.throughline.p12}
            </Underline>
            {content?.throughline.p13}
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export default Opener
