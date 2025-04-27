"use client"

import { Box, Typography } from "@repo/ui/mui"
import useStoryStore from "../store"
import AnimatedWaves from "./helpers/AnimatedWave"
import { useEffect, useState } from "react"
import useActiveSection from "../hooks/useActiveSection"

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
          className="container"
          height="120vh"
          width="1px"
          sx={{ pointerEvents: "none" }}
        ></Box>

        <Box
          ref={sectionRef}
          className="container-center"
          sx={{
            position: "sticky",
            bottom: 0,
            justifyContent: "center",
            backgroundColor: "#031a35",
            height: "100vh",
            width: "100%",
          }}
        >
          <AnimatedWaves
            width={containerSize.width}
            height={containerSize.height}
          />
          <Box sx={{ zIndex: 1 }}>
            <Box className="paragraph">
              <Typography variant="h3">
                {content?.transition.subtitle}
              </Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">
                {content?.transition.p11} <br />
                {content?.transition.p12}
              </Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">{content?.transition.p2}</Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">
                <span style={{ fontWeight: "bold" }}>
                  <u>{content?.ending.p11}</u>
                </span>{" "}
                {content?.ending.p12}
              </Typography>
            </Box>
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
          <Box className="paragraph" sx={{ marginBottom: "10rem" }}>
            <Typography variant="h3" gutterBottom>
              {content?.subtitle}
            </Typography>
            <Typography variant="h3">{content?.caption}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="h3">
              {content?.p11}{" "}
              <span style={{ fontWeight: "bold" }}>{content?.p12}</span>{" "}
              {content?.p13} <br />
              {content?.p14}{" "}
              <span style={{ fontWeight: "bold" }}>{content?.p15}</span>{" "}
              {content?.p16}
            </Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">{content?.p2}</Typography>
          </Box>
          <Box className="paragraph" sx={{ marginBottom: "10rem" }}>
            <Typography variant="body1">{content?.p3}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="h3">
              {content?.p41} <br />
              {content?.p42}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default Conclusion
