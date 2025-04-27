"use client"

import { Box, Stack } from "@repo/ui/mui"
import useStoryStore from "../store"
import AnimatedWaves from "./helpers/AnimatedWave"
import { useEffect, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"
import { Sentence } from "@repo/motion/components"

function Conclusion() {
  return (
    <>
      <Builder />
      <Resolution />
    </>
  )
}

//TODO: add resize observer for animated waves
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

  return (
    <>
      <Box style={{ width: "100%", height: "100%", zIndex: 1 }}>
        <Box
          ref={sectionRef}
          className="container-center"
          height="100vh"
          width="100%"
          sx={{ backgroundColor: "#031a35" }}
        >
          <Stack spacing={12} direction="column">
            <Box className="paragraph">
              <Sentence variant="h3" gutterBottom custom={0}>
                {content?.subtitle}
              </Sentence>
              <Sentence variant="h3" custom={1}>
                {content?.caption}
              </Sentence>
            </Box>
            <Box className="paragraph">
              <Sentence variant="h3" custom={3}>
                {content?.p11}{" "}
                <span style={{ fontWeight: "bold" }}>{content?.p12}</span>{" "}
                {content?.p13} <br />
                {content?.p14}{" "}
                <span style={{ fontWeight: "bold" }}>{content?.p15}</span>{" "}
                {content?.p16}
              </Sentence>
            </Box>
            <Box className="paragraph">
              <Sentence variant="h3" custom={5}>
                {content?.p2}
              </Sentence>
              <Sentence variant="h3" custom={6}>
                {content?.p3}
              </Sentence>
            </Box>
            <Box className="paragraph">
              <Sentence variant="h3" custom={8}>
                {content?.p41} <br />
                {content?.p42}
              </Sentence>
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  )
}

export default Conclusion
