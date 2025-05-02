"use client"

import { Box, Stack } from "@repo/ui/mui"
import useStoryStore from "../store"
import AnimatedWaves from "./helpers/AnimatedWave"
import { useEffect, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"
import { Sentence } from "@repo/motion/components"
import ScrollIndicator from "./helpers/ScrollIndicator"
import { motion, useScroll, useSpring, useTransform } from "@repo/motion"

const MotionBox = motion.create(Box)

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

  useEffect(() => {
    const element = sectionRef.current
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

  return (
    <>
      <Box id="conclusion" style={{ height: "100%", zIndex: 1 }}>
        <Box
          ref={sectionRef}
          className="container-center"
          height="100vh"
          sx={{
            position: "sticky",
            bottom: 0,
            backgroundColor: "#031a35",
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
            <Box className="paragraph" sx={{ margin: "1rem 0" }}>
              <Sentence variant="h3" custom={0}>
                {content?.transition.subtitle}
              </Sentence>
            </Box>
            <Stack spacing={12} direction="column">
              <Box className="paragraph">
                <Sentence variant="h3" custom={2}>
                  {content?.transition.p11} <br />
                  {content?.transition.p12}
                </Sentence>
              </Box>
              <Box className="paragraph">
                <Sentence variant="h3" custom={4}>
                  {content?.transition.p2}
                </Sentence>
              </Box>
              <Box className="paragraph">
                <Sentence variant="h3" custom={6}>
                  <span style={{ fontWeight: "bold" }}>
                    <u>{content?.ending.p11}</u>
                  </span>{" "}
                  {content?.ending.p12}
                </Sentence>
              </Box>
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
  const [animationComplete, setAnimationComplete] = useState(false)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  /*useMotionValueEvent(scrollYProgress, "change", (latest) => {
    console.log("scrollYProgress:", latest); //around 0.84
  });*/

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 20,
  })
  const opacity = useTransform(smoothProgress, [0, 0.2], [0, 1])

  return (
    <>
      <Box style={{ width: "100%", height: "100%", zIndex: 1 }}>
        <MotionBox
          ref={sectionRef}
          className="container-center"
          height="100vh"
          width="100%"
          sx={{ backgroundColor: "#031a35" }}
          style={{ opacity }}
        >
          <Stack spacing={12} direction="column">
            <Box className="paragraph">
              <Sentence variant="h3" gutterBottom custom={0.2}>
                {content?.subtitle}
              </Sentence>
              <Sentence variant="h3" custom={2.2}>
                {content?.caption}
              </Sentence>
            </Box>
            <Box className="paragraph">
              <Sentence variant="h3" custom={4.2}>
                {content?.p11}{" "}
                <span style={{ fontWeight: "bold" }}>{content?.p12}</span>{" "}
                {content?.p13} <br />
                {content?.p14}{" "}
                <span style={{ fontWeight: "bold" }}>{content?.p15}</span>{" "}
                {content?.p16}
              </Sentence>
            </Box>
            <Box className="paragraph">
              <Sentence variant="h3" custom={6.2}>
                {content?.p2}
              </Sentence>
              <Sentence variant="h3" custom={7.2}>
                {content?.p3}
              </Sentence>
            </Box>
            <Box className="paragraph">
              <Sentence
                variant="h3"
                custom={8.2}
                onAnimationComplete={() => setAnimationComplete(true)}
              >
                {content?.p41} <br />
                {content?.p42}
              </Sentence>
            </Box>
          </Stack>
          <ScrollIndicator animationComplete={animationComplete} />
        </MotionBox>
      </Box>
    </>
  )
}

export default Conclusion
