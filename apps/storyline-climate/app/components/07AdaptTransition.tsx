"use client"

import { motion } from "@repo/motion"
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
      <Stack spacing={12} direction="column" style={{ margin: "1rem 3rem" }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {
                "Each of these strategies comes with distinct benefits and costs that must be carefully balanced."
              }
            </Typography>
          </Box>
        </motion.div>
        <Box
          className="paragraph"
          sx={{
            width: "100%",
            height: "40vh",
            justifyContent: "center",
            display: "flex",
            backgroundColor: "#757575",
          }}
        >
          Placeholder
        </Box>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "Because the pace of climate change depends on how society acts at a global scale, it is difficult to predict exactly how impacts will unfold in California."
              }
            </Typography>
          </Box>
        </motion.div>
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
      sx={{
        justifyContent: "center",
        backgroundImage: "url('/drafts/trajectory.png')",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <motion.div
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          transformOrigin: "right",
          backgroundColor: "#1a4472",
        }}
      ></motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <Box className="paragraph" component="article">
          <Typography variant="h2">
            {"What is clear is that there is no silver bullet"}
          </Typography>
          <Typography variant="h2">
            {"to solve California's water problems."}
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default SectionTransition
