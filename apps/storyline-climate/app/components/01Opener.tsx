"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"

function Opener() {
  return (
    <Box
      id="opener"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="header" role="banner">
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {"How climate change affects California's water"}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {"Adapting to a hotter, more variable climate future"}
        </Typography>
      </Box>
      <Stack spacing={4} direction="column" component="section" role="region">
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"California’s water management systems are under strain"}
          </Typography>
          <Typography variant="body1">
            {
              "from the needs to provide safe and affordable drinking water, grow food,"
            }
          </Typography>
          <Typography variant="body1">
            {"and protect ecosystem and cultural water uses."}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {"Climate change is making matters worse."}
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"Climate change is bringing warmer temperatures, "}
          </Typography>
          <Typography variant="body1">
            {"more volatile precipitation patterns, and rising sea levels"}
          </Typography>
          <Typography variant="body1">
            {"that stress our water infrastructure and our living environment."}
          </Typography>
        </Box>
        <Box
          className="paragraph"
          component="article"
          aria-labelledby="opener-throughline"
        >
          <Typography id="throughline-heading" variant="body1">
            {
              "How can we limit the impacts of climate change on California's water future?"
            }
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

export default Opener
