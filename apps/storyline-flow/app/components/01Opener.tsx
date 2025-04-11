import { Box, Typography } from "@repo/ui/mui"
import SectionContainer from "./helpers/SectionContainer"
import storyline from "../../public/locales/english.json" assert { type: "json" }
import { useRef } from "react"

//TODO: replace the paddingBottom
//TODO: try if merging container Box and SectionContainer works
//TODO: replace useParagraphVisibility with useScrollOpacity
function Opener() {
  const content = storyline.opener
  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <SectionContainer id="opener">
      <Box
        ref={sectionRef}
        className="container"
        height="120vh"
        sx={{ justifyContent: "center" }}
      >
        <Box sx={{ marginBottom: "5rem" }}>
          <Typography variant="h1" gutterBottom>
            {content.title}
          </Typography>
          <Typography variant="h2" gutterBottom>
            {content.subtitle}
          </Typography>
        </Box>
        <Box sx={{ marginBottom: "9rem" }}>
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">{content.p2}</Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.throughline}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

export default Opener
