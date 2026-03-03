"use client"

import { Box, Stack, Typography } from "@repo/ui/mui"
import useStoryStore from "../store"
import AnimatedWaves from "./helpers/AnimatedWave"
import { useEffect, useRef, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"

function Conclusion() {
  return (
    <>
      <Builder />
      <Resolution />
    </>
  )
}

function Resolution() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.conclusion
  const { sectionRef } = useActiveSection("resolution", {
    amount: 0.5,
  })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    // Create a ResizeObserver to watch the container size
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
      }
    })

    resizeObserver.observe(element)

    // Cleanup observer on component unmount
    return () => {
      resizeObserver.disconnect()
    }
  }, [sectionRef])

  const firstSentenceOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const secondSentenceOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.7],
    [0, 1],
  )
  const thirdSentenceOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1])

  return (
    <>
      <Box id="conclusion" style={{ position: "relative" }}>
        <Box
          ref={sectionRef}
          height="100vh" // Control this to determine how long the section is visible
          width="100%"
          sx={{ position: "relative" }}
        ></Box>

        <Box
          className="container-center filled-container sticky-container"
          height="100vh"
          ref={viewportRef}
          sx={{
            position: "sticky",
            bottom: 0,
            width: "100%",
          }}
        >
          <AnimatedWaves
            width={containerSize.width}
            height={containerSize.height}
          />
          <Box
            sx={{
              display: "flex",
              zIndex: 1,
              height: "100%",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            <motion.div
              className="paragraph"
              style={{ margin: "1rem 0", opacity: firstSentenceOpacity }}
            >
              <Typography variant="h4">
                {content?.transition.subtitle}
              </Typography>
            </motion.div>
            <Stack spacing={12} direction="column">
              <motion.div
                className="paragraph"
                style={{ opacity: secondSentenceOpacity }}
              >
                <Typography variant="h4">
                  {content?.transition.p11} <br />
                  {content?.transition.p12}
                </Typography>
              </motion.div>
              <motion.div
                className="paragraph"
                style={{ opacity: thirdSentenceOpacity }}
              >
                <Typography variant="h4" gutterBottom>
                  {content?.transition.p2}
                </Typography>
                <Typography variant="h4">
                  <span style={{ fontWeight: "bold" }}>
                    <u>{content?.ending.p11}</u>
                  </span>{" "}
                  {content?.ending.p12}
                </Typography>
              </motion.div>
            </Stack>
          </Box>
        </Box>
      </Box>
    </>
  )
}

function Builder() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.conclusion
  const { sectionRef } = useActiveSection("tension", {
    amount: 0.5,
  })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end end"],
  })
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])
  const [currentParagraph, setCurrentParagraph] = useState<number>(0)

  //TODO: double check this so that the first paragraph stays longer
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const paragraphIndex = Math.min(3, Math.floor(latest * 4))
    setCurrentParagraph(paragraphIndex)
  })

  const paragraphVariants = {
    initial: {
      opacity: 0,
      y: 30,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  //TODO: probably need to add more padding
  return (
    <>
      <Box height="auto" width="100%" style={{ position: "relative" }}>
        <Box
          ref={sectionRef}
          height="200vh" // Control this to determine how long the section is visible
          width="100%"
          sx={{ position: "relative" }}
        ></Box>

        <motion.div
          className="container-center filled-container sticky-container"
          style={{ opacity: sectionOpacity, height: "100vh", width: "100%" }}
        >
          <AnimatePresence mode="wait">
            {currentParagraph == 0 && (
              <motion.div
                className="paragraph"
                key="paragraph-0"
                variants={paragraphVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Typography variant="h2" gutterBottom>
                  {content?.subtitle}
                </Typography>
                <Typography variant="h2">{content?.caption}</Typography>
              </motion.div>
            )}
            {currentParagraph == 1 && (
              <motion.div
                className="paragraph"
                key="paragraph-1"
                variants={paragraphVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Typography variant="h2" gutterBottom>
                  {content?.p11}{" "}
                  <span style={{ fontWeight: "bold" }}>{content?.p12}</span>{" "}
                  {content?.p13}
                </Typography>
                <Typography variant="h2">
                  {content?.p14}{" "}
                  <span style={{ fontWeight: "bold" }}>{content?.p15}</span>{" "}
                  {content?.p16}
                </Typography>
              </motion.div>
            )}
            {currentParagraph == 2 && (
              <motion.div
                className="paragraph"
                key="paragraph-2"
                variants={paragraphVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Typography variant="h2" gutterBottom>
                  {content?.p2}
                </Typography>
                <Typography variant="h2">{content?.p3}</Typography>
              </motion.div>
            )}
            {currentParagraph == 3 && (
              <motion.div
                className="paragraph"
                key="paragraph-3"
                variants={paragraphVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Typography variant="h2" gutterBottom>
                  {content?.p41}
                </Typography>
                <Typography variant="h2">{content?.p42}</Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Box>
    </>
  )
}

export default Conclusion
