"use client"

import { Box, Typography } from "@repo/ui/mui"

function Whiplash() {
  return (
    <Box
      id="whiplash"
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "California’s climate has always been variable, alternating between wet and dry years. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "However, climate change is making these year-to-year fluctuations even more extreme. "
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "This means that droughts of the future are expected to be more severe, being even drier and lasting longer than droughts of the past. "
          }
        </Typography>
      </Box>
      <Box
        className="paragraph"
        style={{ height: "60vh", width: "80%", backgroundColor: "#128dff" }}
      ></Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1" style={{ fontWeight: "bold" }}>
          {
            "These impacts of a changing climate on California’s water are not something we will face in the future;"
          }
        </Typography>
        <Typography variant="body1" style={{ fontWeight: "bold" }}>
          {" we are already experiencing them today."}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1" style={{ fontWeight: "bold" }}>
          {"So, how have we been holding up?"}
        </Typography>
      </Box>
    </Box>
  )
}

export default Whiplash
