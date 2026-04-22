"use client"

import { Box, Slider, Stack, Typography, useTheme } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import SnowpackLine from "./vis/SnowpackLine"
import StickyContainer from "./helpers/StickyContainer"
import SVGLineContainer from "./helpers/SVGLineContainer"
import { usePlayAnimationOnce } from "@repo/motion/hooks"
import { useRef, useState } from "react"
import AnimatedCurve from "./vis/AnimatedCurve"
import SierraNevadaImageScroller from "./vis/SierraNevadaImageScroller"

export default function SierraNevada() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const { scrollYProgress: bottomEntryProgress } = useScroll({
    target: sectionRef,
    offset: ["end end", "end start"],
  })
  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])
  const sliderOpacity = usePlayAnimationOnce(
    bottomEntryProgress,
    [0, 0.2],
    [0, 1],
  )
  const [monthIdx, setMonthIdx] = useState(0)

  const MONTHS = [
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
  ]

  const selectedMonths = ["October", "January", "April", "July", "September"]

  return (
    <StickyContainer
      sectionID="sierranevada"
      stickyRollHeight="120vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="20 0 1728 1117" preserveAspectRatio="xMinYMin">
        <motion.path
          d="M2 0V640.001C2 640.001 172 833 264 718C356 603 419.997 470 504 510C588.003 550 674.006 688 758.003 687.001C842 686.001 894.006 436.001 988.003 436.001C1082 436.001 1565 703.001 1492 856C1419 1009 1492 1114 1492 1114V1146H2064"
          //d="M2 0V640.001C2 640.001 162 815.001 254 700.001C346 585.001 388 448.001 472.003 488.001C556.006 528.001 674.006 688.001 758.003 687.001C842 686.001 894.006 436.001 988.003 436.001C1082 436.001 1500.01 662.002 1427 815.001C1354 968 1364 1114 1364 1114V1146H2064"
          className="svg-line"
          pathLength={linePath}
        />
      </SVGLineContainer>

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          left: "65%",
          width: "35%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "auto",
        }}
      >
        <SierraNevadaImageScroller
          opacity={sliderOpacity}
          selectedMonth={monthIdx}
        />
      </Box>

      <Box
        className="text-section"
        width="65%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box className="paragraph">
          <Typography variant="h3">{"Losing the Natural Reservoir"}</Typography>
        </Box>

        <Stack spacing={1} direction="column">
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"In the mountain regions of California, "}
              <span className="highlight-text">{"warming temperatures "}</span>
              {"mean "}
              <span className="highlight-text">{"less snow "}</span>
              {"and more rain falls in the winter months."}
            </Typography>
            <Typography variant="body1">
              {
                "The snowpack that builds up over the winter is also melting earlier. "
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"This snowpack has historically served as an important "}
              <span style={{ fontWeight: "bold" }}>natural reservoir</span>
              {" to supply water for California."}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {
                "Snow melting in the late spring would feed rivers and top off reservoirs downstream before the long dry season. "
              }
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1} direction="column" sx={{ mt: 2 }}>
          <Box
            className="paragraph"
            style={{
              height: "fit-content",
              width: "100%",
              pointerEvents: "none",
            }}
          >
            <Typography variant="h5">
              {"From Snow to Snowmelt \u2014 an Illustration"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.7, textAlign: "left" }}
            >
              Satellite image source:{" "}
              <a
                href="https://worldview.earthdata.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                NASA Worldview
              </a>
            </Typography>
            <AnimatedCurve
              selectedMonth={monthIdx}
              scrollYProgress={scrollYProgress}
            />
          </Box>
          <div id="month-slider">
            <Slider
              min={0}
              max={11}
              value={monthIdx}
              track={false}
              onChange={(_, newValue: number | number[]) =>
                setMonthIdx(
                  Array.isArray(newValue) ? (newValue[0] ?? 0) : newValue,
                )
              }
              valueLabelDisplay="auto"
              valueLabelFormat={(value: number) => MONTHS[value]}
              marks={MONTHS.filter((d) => selectedMonths.includes(d)).map(
                (each) => ({
                  value: MONTHS.indexOf(each),
                  label: (
                    <span
                      style={{
                        fontWeight:
                          MONTHS.indexOf(each) === monthIdx ? "bold" : "normal",
                      }}
                    >
                      {each}
                    </span>
                  ),
                }),
              )}
              step={1}
              sx={{
                "& .MuiSlider-thumb": {
                  backgroundColor: "common.white",
                },
                "& .MuiSlider-markLabel": {
                  color: "common.white",
                },
                "& .MuiSlider-mark": {
                  backgroundColor: "common.white",
                },
              }}
            />
            <Typography variant="caption" gutterBottom>
              Months in a Water Year
            </Typography>
          </div>

          <Typography variant="h6" gutterBottom>
            Choose a month with the slider, then drag the handle on the right to
            compare California across dry and wet years.
          </Typography>
        </Stack>
      </Box>
    </StickyContainer>
  )
}

//TODO: check the z-index
export function Snowmelt() {
  const sectionRef = useRef(null)
  const theme = useTheme()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePath = useTransform(scrollYProgress, [0.7, 0.9], [0, 1])
  const textOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1])
  const labelOpacity = usePlayAnimationOnce(
    scrollYProgress,
    [0.5, 0.65],
    [0, 1],
  )

  return (
    <StickyContainer
      sectionID="snowmelt"
      stickyRollHeight="200vh"
      sectionRef={sectionRef}
    >
      <SVGLineContainer viewBox="0 0 2012 1133" zIndex={2}>
        <motion.path
          id="risingHeatPath"
          d="M0 2H309C309 2 421.151 143.424 723 268C1024.85 392.576 837.399 576.216 1051 652C1187.22 700.329 2010 843 2010 843V1133"
          className="svg-line glow-effect"
          pathLength={linePath}
          transform="translate(20, 10)" // can be adjusted
        />
        <motion.path
          id="risingHeatTextPath"
          d="M0 2H309C309 2 421.151 143.424 723 268C1024.85 392.576 837.399 576.216 1051 652C1187.22 700.329 2010 843 2010 843V1133"
          fill="none"
          stroke="none"
          transform="translate(20, -10)"
        />
        {/*snowmeltTrendPath && (
          <motion.path
            d={snowmeltTrendPath}
            fill="none"
            stroke="#8EC5FF"
            strokeWidth={3}
            strokeDasharray="8 6"
            pathLength={snowmeltTrendPathLength}
            transform="translate(0, -200)"
            style={{ opacity: snowmeltTrendOpacity }}
          />
        )*/}
        <motion.text
          fill="#F1B143"
          fontWeight="bold"
          style={{
            fontSize: theme.typography.caption.fontSize,
            opacity: textOpacity,
          }}
        >
          <textPath
            href="#risingHeatTextPath"
            startOffset="35%"
            textAnchor="middle"
          >
            The Rising Heat
          </textPath>
        </motion.text>
      </SVGLineContainer>

      <Box
        className="text-section"
        width="50%"
        height="100%"
        sx={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box className="paragraph" component="article">
          <Typography variant="h3">{"Declining Snow"}</Typography>
        </Box>
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"But warmer winters mean more precipitation falls as rain"}
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
        <Box className="paragraph" component="article">
          <Typography variant="body1">
            {"The impact is that "}
            <span style={{ fontWeight: "bold" }}>
              {"less water is available"}
            </span>
            {
              " in rivers and reservoirs during the dry summer when we.humans and ecosystems."
            }
            <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
            {"."}
          </Typography>
        </Box>
      </Box>

      <Box
        width="50%"
        height="100%"
        sx={{
          position: "absolute",
          inset: 0,
          left: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "5rem",
        }}
      >
        <Box
          className="paragraph"
          component="article"
          sx={{ pointerEvents: "auto" }}
        >
          <Typography variant="h5" align="left">
            {"Projected Change in Snowpack by 2050"}
          </Typography>
          <Typography variant="caption" align={"left"} sx={{ opacity: 0.7 }}>
            {"Source: "}
            <a
              href="https://v2.cal-adapt.org/tools/snowpack/#climatevar=swe&scenario=rcp85&lat=38.90625&lng=-120.03125&boundary=locagrid&units=inch"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              Cal-Adapt
            </a>
            {
              ", Fourth Assessment Climate Region modeled by CanESM2 in high emission scenario"
            }
          </Typography>
        </Box>
        <motion.div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            opacity: labelOpacity,
          }}
        >
          <Box
            component="img"
            src="/icons/snowflake_icon.svg"
            alt="Snowflake icon"
            sx={{
              display: "block",
              marginRight: 1,
              width: 48,
              height: 48,
              filter: "invert(1) brightness(100%)",
            }}
          />
          <Typography variant="caption">
            {"April Snow Water Equivalent"}
          </Typography>
        </motion.div>
        <Box width="100%" height="50%">
          <SnowpackLine scrollProgress={scrollYProgress} />
        </Box>
      </Box>
    </StickyContainer>
  )
}
