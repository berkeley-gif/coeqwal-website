"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import ScrollIndicator from "./helpers/ScrollIndicator"

export default function Opener() {
  return (
    <Box className='container'
      sx={{
        maxWidth: '60%',
      }}
    >
      {/* Title */}
      <Box className="paragraph" component="header" role="banner">
        <Typography id="opener-heading" variant="h1">
          {"How is Equity Considered in California Water?"}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {"Exploring Equitable and Resilient Water Futures with COEQWAL"}
        </Typography>
      </Box>

      {/* Content */}
      <Stack spacing={2} direction="column" component="section" role="region">
        <Box className="paragraph" component="article">
          <Typography variant="body1" gutterBottom>
            {"Understanding equity in California water begins with a few fundamental questions:"}
          </Typography>
        </Box>
        <Box className="paragraph" component="article"
          sx={{
            paddingLeft: '2rem',
          }}
        >
          <Typography variant="body1" >
            {"Whose needs are being met?"}
          </Typography>
          <Typography variant="body1" >
            {"Who is left behind?"}
          </Typography>
          <Typography variant="body1" >
            {"Who benefits from water allocations, and who bears the costs when water is scarce?"}
          </Typography>
        </Box>
        <Box
          className="paragraph"
          component="article"
        >
          <Typography variant="body1" gutterBottom>
            {"These questions sit at the heart of today’s water debates, and at the core of COEQWAL."}
          </Typography>
        </Box>
      </Stack>

      <ScrollIndicator animationComplete={true} />
    </Box>
  )
}
