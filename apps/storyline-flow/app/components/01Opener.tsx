"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import Underline from "./helpers/Underline"
import ScrollIndicator from "./helpers/ScrollIndicator"

//TODO: fix the mapcontainer issue
//TODO: check ui accessibility is fully supported

function Opener() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.opener
  const { sectionRef } = useActiveSection("opener", {
    amount: 0.5,
  })
  const isMapReady = useStoryStore((state) => state.isMapReady)

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
        <Typography id="opener-heading" variant="h1">
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
        <Box
          className="paragraph"
          component="article"
          aria-labelledby="opener-throughline"
        >
          <Typography id="throughline-heading" variant="body1">
            {content?.throughline.p11}
            <Underline startAnimation={isMapReady}>
              {content?.throughline.p12}
            </Underline>
            {content?.throughline.p13}
          </Typography>
        </Box>
      </Stack>
      <ScrollIndicator animationComplete={isMapReady} delay={1} />
    </Box>
  )
}

export default Opener
