"use client"

import {
  Box,
  LibraryBooksIcon,
  Stack,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { useStoryline } from "../store"
import AnimatedWaves from "./helpers/AnimatedWave"
import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"

export function Resolution() {
  const storyline = useStoryline()
  const content = storyline?.conclusion
  const sectionRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

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
                  <strong>
                    <a
                      href="https://dev.coeqwal.org/?tab=explore"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "underline" }}
                    >
                      {content?.ending.p11}
                    </a>
                  </strong>{" "}
                  <LibraryBooksIcon
                    sx={{
                      fontSize: theme.typography.h4.fontSize,
                      verticalAlign: "middle",
                    }}
                  />{" "}
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

export function Builder() {
  const storyline = useStoryline()
  const content = storyline?.conclusion
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  })
  const sectionOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1])
  const [currentParagraph, setCurrentParagraph] = useState<number>(0)

  // Finish all 4 frames by 80% scroll progress, then hold on the final frame.
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const completionPoint = 0.8
    const normalizedProgress = Math.min(latest / completionPoint, 1)
    const paragraphIndex = Math.min(3, Math.floor(normalizedProgress * 4))
    console.log(
      normalizedProgress,
      paragraphIndex,
      Math.floor(normalizedProgress * 4),
    )

    setCurrentParagraph((prev) =>
      prev === paragraphIndex ? prev : paragraphIndex,
    )
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
      <Box
        ref={sectionRef}
        height="auto"
        width="100%"
        style={{ position: "relative" }}
      >
        <Box
          height="100vh" // 100vh spacer + 100vh sticky = total 200vh section
          width="100%"
          sx={{ position: "relative" }}
        ></Box>

        <motion.div
          className="container-center filled-container sticky-container"
          style={{
            position: "sticky",
            top: 0,
            opacity: sectionOpacity,
          }}
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
