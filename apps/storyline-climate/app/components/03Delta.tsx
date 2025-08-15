"use client"

import { Box, Typography } from "@repo/ui/mui"

function Delta() {
  return (
    <Box
      id="delta"
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "You may be aware that climate change is causing polar ice sheets to melt, raising sea levels around the globe."
          }
        </Typography>
        <Typography variant="body1">
          {"But do you know how this will affect California?"}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "The Delta is a rich coastal ecosystem where two of the state’s largest rivers \u2014 "
          }
          <span style={{ color: "#42A5F5", fontWeight: "bold" }}>
            {"the Sacramento and San Joaquin"}
          </span>
          {" \u2014 meet the sea."}
        </Typography>
      </Box>
      <Box
        className="paragraph"
        style={{ height: "60vh", width: "100%", backgroundColor: "#128dff" }}
      ></Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "The Delta is also where freshwater carried by those rivers is exported to the south by large pumps to provide farms and cities with water."
          }
        </Typography>
        <Typography variant="body1">
          {
            "As the sea level rises, salty water from the ocean extends further into the Delta."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "The saltier water not only threatens local communities and agriculture in the Delta, but also water exports to cities and farms further south. "
          }
        </Typography>
        <Typography variant="body1">
          {
            "More freshwater would be needed to prevent the Delta from becoming too salty \u2014 an increasing water demand that adds stress on already limited supplies."
          }
        </Typography>
      </Box>
    </Box>
  )
}

export default Delta
