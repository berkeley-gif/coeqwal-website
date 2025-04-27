"use client"

import { Box, VisibilityIcon, LibraryBooksIcon } from "@repo/ui/mui"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import { Sentence } from "@repo/motion/components"

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
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.transformation
  const { sectionRef } = useActiveSection("transformation", { amount: 0.5 })

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="100vh"
      sx={{ justifyContent: "center" }}
    >
      <Box className="paragraph">
        <Sentence variant="h2" gutterBottom custom={0}>
          {content?.subtitle1}
          <br />
          {content?.subtitle2}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={1.5}>
          <span style={{ fontWeight: "bold" }}>
            <u>{content?.p11}</u>
          </span>{" "}
          <LibraryBooksIcon
            sx={{ fontSize: "1.5rem", verticalAlign: "middle" }}
          />{" "}
          {content?.p12}
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={3}>
          {content?.p21}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p22}</span>{" "}
          {content?.p23} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={4}>
          {content?.p31}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p32}</span>{" "}
          {content?.p33} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
        <Sentence custom={5}>
          {content?.p41}{" "}
          <span style={{ fontWeight: "bold" }}>{content?.p42}</span>{" "}
          {content?.p43} <VisibilityIcon sx={{ verticalAlign: "middle" }} />
        </Sentence>
      </Box>
      <Box className="paragraph">
        <Sentence custom={6.5}>{content?.transition}</Sentence>
      </Box>
    </Box>
  )
}

export default SectionTransformation
