import React from "react"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import { Box, Typography } from "@repo/ui/mui"
import { LibraryBooksIcon } from "@repo/ui/mui"
import SectionContainer from "./helpers/SectionContainer"

function SectionTransformation() {
  return (
    <>
      <Transformation />
    </>
  )
}

//TODO: pop up those
// Use waterdrop for dams
function Transformation() {
  const content = storyline.transformation

  return (
    <SectionContainer id="transformation">
      <Box
        className="container"
        height="100vh"
        sx={{ justifyContent: "center" }}
      >
        <Box className="paragraph">
          <Typography variant="h2" gutterBottom>
            {content.subtitle}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            <span style={{ fontWeight: "bold" }}>
              <u>{content.p11}</u>
            </span>{" "}
            <LibraryBooksIcon
              sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
            />{" "}
            {content.p12}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {content.p21}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p22}</span>{" "}
            {content.p23}
          </Typography>
          <Typography variant="body1">
            {content.p31}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p32}</span>{" "}
            {content.p33}
          </Typography>
          <Typography variant="body1">
            {content.p41}{" "}
            <span style={{ fontWeight: "bold" }}>{content.p42}</span>{" "}
            {content.p43}
          </Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

export default SectionTransformation
