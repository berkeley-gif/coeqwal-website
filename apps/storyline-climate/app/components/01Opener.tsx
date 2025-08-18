"use client"

import { Box, Typography } from "@repo/ui/mui"

function Opener() {
  return (
    <Box
      id="opener"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center", position: "relative" }}
      tabIndex={-1}
      role="region"
    >
      <Box
        className="image-holder"
        sx={{
          height: "100vh",
          backgroundImage: "url('/drafts/opener-static-background.png')",
        }}
      />
      <Box
        className="paragraph text-center-holder"
        component="header"
        role="banner"
        sx={{ top: "40%" }}
      >
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {"How climate change affects California's water"}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {"Adapting to a hotter, more variable climate future"}
        </Typography>
      </Box>
      <Box
        className="paragraph text-center-holder"
        component="article"
        sx={{ top: "60%" }}
      >
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
      <Box
        className="paragraph text-center-holder"
        component="article"
        sx={{ top: "70%" }}
      >
        <Typography variant="body1" style={{ fontWeight: "bold" }}>
          {"Climate change is making matters worse."}
        </Typography>
      </Box>
      <Box
        className="paragraph text-center-holder"
        component="article"
        sx={{ top: "80%" }}
      >
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
        className="paragraph text-center-holder"
        component="article"
        aria-labelledby="opener-throughline"
        sx={{ top: "90%" }}
      >
        <Typography
          id="throughline-heading"
          variant="body1"
          sx={{ fontWeight: "bold" }}
        >
          {
            "How can we limit the impacts of climate change on California's water future?"
          }
        </Typography>
      </Box>
    </Box>
  )
}

export default Opener
