"use client"

import { Box, Typography } from "@repo/ui/mui"
import useStory from "../story/useStory"

function Conclusion() {
  return (
    <>
      <Builder />
      <Resolution />
    </>
  )
}

//TODO: add resize observer for animated waves
function Resolution() {
  const { storyline } = useStory()
  const content = storyline?.conclusion

  return (
    <>
      <Box id="conclusion" style={{ height: "100%", zIndex: 1 }}>
        <Box
          className="container"
          height="120vh"
          width="1px"
          sx={{ pointerEvents: "none" }}
        ></Box>

        <Box
          className="container-center"
          sx={{
            position: "sticky",
            bottom: 0,
            justifyContent: "flex-start",
            backgroundColor: "#031a35",
            height: "100vh",
            width: "100%",
          }}
        >
          <Box sx={{ zIndex: 1 }}>
            <Box className="paragraph">
              <Typography variant="h3">
                {content?.transition.subtitle}
              </Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">
                {content?.transition.p11} <br />
                {content?.transition.p12}
              </Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">{content?.transition.p2}</Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">
                <span style={{ fontWeight: "bold" }}>
                  <u>{content?.ending.p11}</u>
                </span>{" "}
                {content?.ending.p12}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}

function Builder() {
  const { storyline } = useStory()
  const content = storyline?.conclusion

  return (
    <>
      <Box style={{ width: "100%", height: "100%", zIndex: 1 }}>
        <Box
          className="container-center"
          height="100vh"
          width="100%"
          sx={{ backgroundColor: "#031a35" }}
        >
          <Box className="paragraph" sx={{ marginBottom: "10rem" }}>
            <Typography variant="h3" gutterBottom>
              {content?.subtitle}
            </Typography>
            <Typography variant="h3">{content?.caption}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="h3">
              {content?.p11}{" "}
              <span style={{ fontWeight: "bold" }}>{content?.p12}</span>{" "}
              {content?.p13} <br />
              {content?.p14}{" "}
              <span style={{ fontWeight: "bold" }}>{content?.p15}</span>{" "}
              {content?.p16}
            </Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">{content?.p2}</Typography>
          </Box>
          <Box className="paragraph" sx={{ marginBottom: "10rem" }}>
            <Typography variant="body1">{content?.p3}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="h3">
              {content?.p41} <br />
              {content?.p42}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default Conclusion
