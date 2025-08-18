"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"

function Conclusion() {
  const { sectionRef } = useActiveSection("conclusion", {
    amount: 0.5,
  })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.4, 0.7],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1])

  return (
    <Box
      id="conclusion"
      className="container-center"
      sx={{
        justifyContent: "center",
        position: "relative",
        backgroundImage: "url('/drafts/pathways.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="140vh"
        width="100%"
        sx={{ position: "relative" }}
      ></Box>
      <Box className="container-center sticky-container">
        <Stack spacing={12} direction="column">
          <motion.div style={{ opacity: firstParagraphOpacity }}>
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
          </motion.div>
          <motion.div style={{ opacity: secondParagraphOpacity }}>
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
          </motion.div>
        </Stack>
      </Box>
    </Box>
  )
}

export default Conclusion
