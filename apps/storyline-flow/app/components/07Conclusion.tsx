"use client"

import { Box, Typography } from "@repo/ui/mui"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import AnimatedWaves from "./helpers/AnimatedWave"

function Conclusion() {
  return (
    <>
      <Builder />
      <Resolution />
    </>
  )
}

function Resolution() {
  const content = storyline.conclusion

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
            width: "100vw",
          }}
        >
          <AnimatedWaves />
          <Box sx={{ zIndex: 1, marginTop: "20rem" }}>
            <Box className="paragraph" sx={{ marginBottom: "25rem" }}>
              <Typography variant="h3">
                {content.transition.subtitle}
              </Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">
                {content.transition.p11} <br />
                {content.transition.p12}
              </Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3">{content.transition.p2}</Typography>
            </Box>
            <Box className="paragraph">
              <Typography variant="h3" sx={{ marginTop: "10rem" }}>
                <span style={{ fontWeight: "bold" }}>
                  <u>{content.ending.p11}</u>
                </span>{" "}
                {content.ending.p12}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}

function Builder() {
  const content = storyline.conclusion

  return (
    <>
      <Box style={{ width: "100%", height: "100%", zIndex: 1 }}>
        <Box
          className="container-center"
          height="100vh"
          width="100vw"
          sx={{ backgroundColor: "#031a35" }}
        >
          <Box className="paragraph" sx={{ marginBottom: "10rem" }}>
            <Typography variant="h3" gutterBottom>
              {content.subtitle}
            </Typography>
            <Typography variant="h3">{content.caption}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="h3">
              {content.p11}{" "}
              <span style={{ fontWeight: "bold" }}>{content.p12}</span>{" "}
              {content.p13} <br />
              {content.p14}{" "}
              <span style={{ fontWeight: "bold" }}>{content.p15}</span>{" "}
              {content.p16}
            </Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">{content.p2}</Typography>
          </Box>
          <Box className="paragraph" sx={{ marginBottom: "10rem" }}>
            <Typography variant="body1">{content.p3}</Typography>
            <Typography variant="body1">{content.p4}</Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="h3">
              {content.p51} <br />
              {content.p52}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default Conclusion
