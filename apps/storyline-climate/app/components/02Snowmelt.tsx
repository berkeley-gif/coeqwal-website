"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"

function Snowmelt() {
  const { sectionRef } = useActiveSection("snowmelt", { amount: 0.5 })
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
      id="snowmelt"
      ref={sectionRef}
      className="container-row"
      height="100vh"
      width='100%'
      tabIndex={-1}
      role="region"
    >
      <Box width='50%' height='100%' sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <motion.div className='text-container-left' style={{ opacity: firstParagraphOpacity, marginBottom: '20px', paddingRight: '10px' }}>
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {"Losing Nature's Water Storage"}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "For decades, California has relied on mountain snowpacks as a natural water storage."
              }
            </Typography>
            <Typography variant="body1">
              {
                "Snow builds up in winter, then melts slowly, feeding rivers through the long, dry summer."
              }
            </Typography>
            <Typography variant="body1">
              {
                "The snowmelt has consistently maintained river flows to provide water for farms, cities, and ecosystems."
              }
            </Typography>
          </Box>
        </motion.div>
        <motion.div className='text-container-left' style={{ opacity: secondParagraphOpacity, paddingRight: '10px'  }}>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"But warmer winters mean "}
              <span className="highlight-text">
                {"more precipitation falls as rain"}
              </span>
              {" instead of snow. And "}
              <span className="highlight-text">
                {"the snowpack we do receive melts earlier"}
              </span>
              {" in the year."}
            </Typography>
            <Typography variant="body1">
              {
                "Higher temperatures also cause water to evaporate faster from soils and plants."
              }
            </Typography>
          </Box>
        </motion.div>
        <motion.div className='text-container-left' style={{ opacity: secondParagraphOpacity, paddingRight: '10px'  }}>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"The impact is that "}
              <span style={{ fontWeight: "bold" }}>
                {"less water is available"}
              </span>
              {
                " in rivers and reservoirs during the dry summer when we \u2014 humans and ecosystems \u2014 "
              }
              <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
              {"."}
            </Typography>
          </Box>
        </motion.div>
      </Box>
      <Box width='50%' height='100%' sx={{backgroundColor: '#458992ff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px'}}>
        <Box width='100%' height='40%' sx={{backgroundColor: '#1f313aff'}}>
          
        </Box>
        <Box width='100%' height='40%' sx={{backgroundColor: '#437b97ff'}}>
          
        </Box>
      </Box>
    </Box>
  )
}

export default Snowmelt
