"use client"

import { Box, Typography } from "@repo/ui/mui"

function Snowmelt() {
  return (
    <Box
      id="snowmelt"
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "First, we need to understand how climate change is affecting California’s water."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "Mountain snowpack in winter has historically served as a reliable water supply to California. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "The snowmelt contributes to river flows throughout the long, dry summer that supply water for agriculture and cities and also sustain ecosystems."
          }
        </Typography>
      </Box>
      <Box
        className="paragraph"
        style={{ height: "60%", width: "80%", backgroundColor: "#128dff" }}
      ></Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {"However, as the temperature increases, "}
          <span className="highlight-text">{"more water arrives as rain"}</span>
          {" in California instead of snow, and "}
          <span className="highlight-text">
            {"the reduced snowpack melts earlier"}
          </span>
          {"."}
        </Typography>
        <Typography variant="body1">
          {
            "The water we do have will also evaporate from soils or get used by plants more quickly, stressing ecosystems."
          }
        </Typography>
        <Typography variant="body1">
          {"The impact is that "}
          <span style={{ fontWeight: "bold" }}>
            {"less water is available"}
          </span>
          {" when we \u2014 humans and ecosystems \u2014 "}
          <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
          {" in the dry summer season."}
        </Typography>
      </Box>
    </Box>
  )
}

export default Snowmelt
