"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"

function Conveyance() {
  const { sectionRef } = useActiveSection("conservation", { amount: 0.5 })
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

  return (
    <Box
      id="conveyance"
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
              "Finally, California is also exploring ways to improve its water management infrastructure to cope with rising sea level and weather extremes."
            }
          </Typography>
        </Box>
      </motion.div>
      <Box
        className="paragraph"
        style={{
          height: "60vh",
          width: "100%",
          backgroundImage: "url('/drafts/delta-adapt-salinity.png')",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></Box>
      <motion.div style={{ opacity: secondParagraphOpacity }}>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "For example, the proposed Delta Conveyance Project would create a large tunnel to move water from the Sacramento River to the Delta pumps"
            }
          </Typography>
          <Typography variant="body1">
            {
              "in order to limit the risks of rising sea levels to water exports. "
            }
          </Typography>
          <Typography variant="body1">
            {
              "Opponents of this project argue that it would harm Delta communities and ecosystems."
            }
          </Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {
              "Adaptation strategies are also being explored that involve ‘nature-based solutions.’ "
            }
          </Typography>
          <Typography variant="body1">
            {
              "Setting back levees along rivers to restore floodplain habitats, for example, gives rivers more room to safely flood and promotes groundwater recharge."
            }
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

export default Conveyance
