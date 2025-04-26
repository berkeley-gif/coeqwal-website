"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import useStory from "../story/useStory"
import { motion, useScroll, useAnimation } from "@repo/motion"
import { useEffect } from "react"
import useActiveSection from "../hooks/useActiveSection"

//TODO: motion doesn't support component prop
//TODO: modularize this entire setup
//TODO: make sure all map layers are disabled here
function Opener() {
  const { storyline } = useStory()
  const content = storyline?.opener
  const sectionRef = useActiveSection("opener", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  })
  const controls = useAnimation()

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
      tabIndex={-1} // Ensure focusable for screen readers
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
        >
          <Typography id="throughline-heading" variant="body1">
            {content?.throughline}
          </Typography>
        </motion.div>
      </Stack>
    </Box>
  )
}

export default Opener
