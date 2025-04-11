import storyline from "../../public/locales/english.json" assert { type: "json" }
import SectionContainer from "./helpers/SectionContainer"
import { Box, Typography } from "@repo/ui/mui"

function SectionWaterSource() {
  return (
    <>
      <Precipitation />
    </>
  )
}

function Precipitation() {
  const content = storyline.precipitation

  return (
    <SectionContainer id="variability">
      <Box className="container" height="90vh">
        <Box className="paragraph">
          <Typography variant="h2" gutterBottom>
            {content.title}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">{content.p1}</Typography>
          <Typography variant="body1">{content.p2}</Typography>
        </Box>
      </Box>
    </SectionContainer>
  )
}

export default SectionWaterSource
