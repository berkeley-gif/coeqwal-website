"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"

function Whiplash() {
  const { sectionRef } = useActiveSection("whiplash", { amount: 0.5 })
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const firstParagraphOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4],
    [0, 1],
  )
  const secondParagraphOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.7],
    [0, 1],
  )
  const builderParagraphOpacity = useTransform(
    scrollYProgress,
    [0.7, 0.9],
    [0, 1],
  )

  return (
    <Box
      id="whiplash"
      ref={sectionRef}
      className="container-center"
      height="110vh"
      sx={{ justifyContent: "center" }}
      tabIndex={-1}
      role="region"
    >
      <motion.div style={{ opacity: firstParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "California’s climate has always been variable, alternating between wet and dry years. "
            }
          </Typography>
          <Typography variant="body1">
            {
              "However, climate change is making these year-to-year fluctuations even more extreme. "
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "This means that droughts of the future are expected to be more severe, being even drier and lasting longer than droughts of the past. "
            }
          </Typography>
        </Box>
      </motion.div>
      <Box
        className="paragraph"
        style={{
          height: "50vh",
          width: "80%",
          backgroundImage: "url('/drafts/whiplash-static.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
      <motion.div style={{ opacity: secondParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {
              "These impacts of a changing climate on California’s water are not something we will face in the future;"
            }
          </Typography>
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {" we are already experiencing them today."}
          </Typography>
        </Box>
      </motion.div>
      <motion.div style={{ opacity: builderParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {"So, how have we been holding up?"}
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default Whiplash
