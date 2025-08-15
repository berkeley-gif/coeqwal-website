"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"

function Conclusion() {
  return (
    <Box
      id="conclusion"
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <Stack spacing={12} direction="column">
        <Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"For a foreseeable future, "}
            </Typography>
            <Typography variant="body1">
              {
                "California will continue to experience warming temperatures, more extreme droughts, and rising sea levels"
              }
            </Typography>
            <Typography variant="body1">
              {"that will affect "}
              <span style={{ fontWeight: "bold" }}>
                {"when and how much water is available"}
              </span>
              {"."}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "By exploring different scenarios about the future of water in California, "
              }
            </Typography>
            <Typography variant="body1">
              {
                "we can better plan for the challenges ahead and search for solutions that work for everyone."
              }
            </Typography>
          </Box>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "Are you curios about how these scenarios will affect your specific water needs? "
            }
          </Typography>
          <Typography variant="body1">
            {"You can start "}
            <span style={{ fontWeight: "bold" }}>
              <u>{"exploring specific scenarios"}</u>
            </span>
            {
              " and think about how you can help California adapt to this changing climate."
            }
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

export default Conclusion
