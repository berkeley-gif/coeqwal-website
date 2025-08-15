"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"

function SectionTransition() {
  return (
    <>
      <Balance />
      <Bullet />
    </>
  )
}

function Balance() {
  return (
    <Box
      id="balance"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Stack spacing={12} direction="column">
        <Box className="paragraph" component="article">
          <Typography variant="h2">
            {
              "Each of these strategies comes with distinct benefits and costs that must be carefully balanced."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="h2">
            {
              "Because the pace of climate change depends on how society acts at a global scale, it is difficult to predict exactly how impacts will unfold in California."
            }
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

function Bullet() {
  return (
    <Box
      id="bullet"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Box className="paragraph" component="article">
        <Typography variant="h2">
          {"What is clear is that there is no silver bullet"}
        </Typography>
        <Typography variant="h2">
          {"to solve California's water problems."}
        </Typography>
      </Box>
    </Box>
  )
}

export default SectionTransition
