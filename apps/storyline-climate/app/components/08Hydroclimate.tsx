"use client"

import { Box, Typography } from "@repo/ui/mui"

function SectionResolution() {
  return (
    <>
      <Hydroclimate />
      <Scenarios />
    </>
  )
}

function Hydroclimate() {
  return (
    <Box
      id="hydroclimate"
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="article">
        <Typography variant="body1" style={{ fontWeight: "bold" }}>
          {"This is where COEQWAL comes in."}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "Using a water planning model known as CalSim, COEQWAL shines a light on possible water futures "
          }
        </Typography>
        <Typography variant="body1">
          {"by simulating the effects of climate on the water system."}
        </Typography>
      </Box>
      <Box
        style={{ height: "50%", width: "80%", backgroundColor: "#128dff" }}
      ></Box>
      <Box className="paragraph" component="article">
        <Typography variant="caption">
          {
            "These hydroclimate futures represent plausible conditions predicted by different models around the year 2050 "
          }
        </Typography>
        <Typography variant="caption">
          {
            "that correspond to more moderate (or slower) and more extreme (or rapid) climate change "
          }
          <u>{"(Hydroclimate futures FAQ)"}</u>
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {"COEQWAL evaluates the effect of distinct hydroclimate futures, "}
        </Typography>
        <Typography variant="body1">
          {
            "which represent a range of possible changes in temperature, precipitation, and streamflow that are predicted by global climate models."
          }
        </Typography>
      </Box>
    </Box>
  )
}

function Scenarios() {
  return (
    <Box
      id="scenarios"
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "COEQWAL also explores the effects of different water management decisions and how these might limit the impacts of climate change."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "For example, COEQWAL evaluates scenarios that would limit pumping of groundwater to comply with SGMA."
          }
        </Typography>
        <Typography variant="body1">
          {
            "In some scenarios, groundwater pumping limits are coupled with reductions in agricultural land use to meet sustainable use levels."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "These scenarios provide insight into how sustainable groundwater management can lessen the impacts of future droughts, "
          }
        </Typography>
        <Typography variant="body1">
          {"but also involve trade-offs with crop production."}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "COEQWAL is also evaluating scenarios that include the Delta Conveyance Project."
          }
        </Typography>
      </Box>
    </Box>
  )
}

export default SectionResolution
