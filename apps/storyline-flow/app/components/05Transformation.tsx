"use client"

import { Box, Typography, VisibilityIcon, LibraryBooksIcon } from "@repo/ui/mui"
import useStory from "../story/useStory"
import useActiveSection from "../hooks/useActiveSection"

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
  const { storyline } = useStory()
  const content = storyline?.transformation
  const sectionRef = useActiveSection("transformation", { amount: 0.5 })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Typography variant="h2" gutterBottom>
          {content?.subtitle1}
          <br />
          {content?.subtitle2}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p22}</span>{" "}
          {content?.p23} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">
          {content?.p31}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p32}</span>{" "}
          {content?.p33} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
        <Typography variant="body1">
          {content?.p41}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p42}</span>{" "}
          {content?.p43} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Typography>
      </Box>
      <Box className="paragraph">
        <Typography variant="body1">{content?.transition}</Typography>
      </Box>
    </Box>
  )
}

export default SectionTransformation
