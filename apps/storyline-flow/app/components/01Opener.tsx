"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import { useStoryline, useMapReady } from "../store"
import Underline from "./helpers/Underline"
import ScrollIndicator from "./helpers/ScrollIndicator"

function Opener() {
  const storyline = useStoryline()
  const isMapReady = useMapReady()
  const content = storyline?.opener

  //TODO: With and without box has a difference
  return (
    <Box className="container">
      {/* Title */}
      <Box className="paragraph" component="header" role="banner">
        <Typography id="opener-heading" variant="h1">
          {content?.title}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {content?.subtitle}
        </Typography>
      </Box>

      {/* Content */}
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
