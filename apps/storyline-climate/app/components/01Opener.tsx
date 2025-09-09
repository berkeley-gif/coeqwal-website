"use client"

import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@repo/ui/mui"
import { VerticalImageSlider } from "./helpers/ImageSlider"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { useRef, useState } from "react"

function Opener() {
  const [selectedOpener, setSelectedOpener] = useState("oroville")

  function onSelectionChange(value: string) {
    setSelectedOpener(value)
  }

  return (
    <Box
      id="opener"
      className="container-center"
      height="100vh"
      sx={{ justifyContent: "center", position: "relative" }}
      tabIndex={-1}
      role="region"
    >
      <SourceAnnouncer selected={selectedOpener} />
      <SelectionPanel onChange={onSelectionChange} />
      {selectedOpener === "oroville" && (
        <VerticalImageSlider
          topSrc="/images/oroville2021-drought.png"
          bottomSrc="/images/oroville2023-floods.png"
        />
      )}
      {selectedOpener === "sealevel" && (
        <Box
          width="100%"
          height="100%"
          sx={{
            position: "absolute",
            justifyContent: "center",
            backgroundImage: "url('/drafts/opener_sea_level.png')",
            backgroundSize: "auto 100vh",
            backgroundPosition: "right",
            backgroundRepeat: "no-repeat",
            zIndex: 1,
          }}
        ></Box>
      )}
      {selectedOpener === "temperature" && (
        <Box
          width="100%"
          height="100%"
          sx={{
            position: "absolute",
            justifyContent: "center",
            backgroundImage: "url('/drafts/opener_temperature.png')",
            backgroundSize: "auto 100vh",
            backgroundPosition: "right",
            backgroundRepeat: "no-repeat",
            zIndex: 1,
          }}
        ></Box>
      )}
      {selectedOpener === "sealevel" && <SeaLevelText />}
      {selectedOpener === "temperature" && <SeaLevelText />}
      {selectedOpener === "oroville" && <OrovilleText />}
    </Box>
  )
}

function SeaLevelText() {
  return (
    <Box
      width="100%"
      height="100%"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        position: "relative",
        zIndex: 2,
        padding: "0 5rem",
        textAlign: "left",
      }}
    >
      <Box className="paragraph" component="header" role="banner">
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {"How Climate Change Affects California's Water"}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {"Adapting to a Hotter, More Uncertain Climate Future"}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {
            "California’s water system is under pressure to meet multiple demands."
          }
        </Typography>
        <Typography variant="body1">
          {
            "People need clean drinking water. Farms need water to grow food. Fish and wildlife need water to survive."
          }
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {"Climate change is making matters worse."}
        </Typography>
      </Box>
      <Box className="paragraph" component="article">
        <Typography variant="body1">
          {"Warmer temperatures, less predictable rain and snow, "}
        </Typography>
        <Typography variant="body1">
          {
            "and higher sea levels are stressing both our water infrastructure and living environment."
          }
        </Typography>
      </Box>
      <Box
        className="paragraph"
        component="article"
        aria-labelledby="opener-throughline"
      >
        <Typography
          id="throughline-heading"
          variant="body1"
          sx={{ fontWeight: "bold" }}
        >
          {
            "How can we limit the impacts of climate change on California's water future?"
          }
        </Typography>
      </Box>
    </Box>
  )
}

function OrovilleText() {
  return (
    <>
      <Box
        className="paragraph text-center-holder"
        component="header"
        role="banner"
        sx={{ top: "40%" }}
      >
        <Typography id="opener-heading" variant="h2" gutterBottom>
          {"How Climate Change Affects California's Water"}
        </Typography>
        <Typography variant="h3" gutterBottom>
          {"Adapting to a Hotter, More Uncertain Climate Future"}
        </Typography>
      </Box>
      <Box
        className="paragraph text-center-holder"
        component="article"
        sx={{ top: "60%" }}
      >
        <Typography variant="body1">
          {
            "California’s water system is under pressure to meet multiple demands."
          }
        </Typography>
        <Typography variant="body1">
          {
            "People need clean drinking water. Farms need water to grow food. Fish and wildlife need water to survive."
          }
        </Typography>
      </Box>
      <Box
        className="paragraph text-center-holder"
        component="article"
        sx={{ top: "67%" }}
      >
        <Typography variant="body1">
          {"Climate change is making matters worse."}
        </Typography>
      </Box>
      <Box
        className="paragraph text-center-holder"
        component="article"
        sx={{ top: "74%" }}
      >
        <Typography variant="body1">
          {"Warmer temperatures, less predictable rain and snow, "}
        </Typography>
        <Typography variant="body1">
          {
            "and higher sea levels are stressing both our water infrastructure and living environment."
          }
        </Typography>
      </Box>
      <Box
        className="paragraph text-center-holder"
        component="article"
        aria-labelledby="opener-throughline"
        sx={{ top: "85%" }}
      >
        <Typography
          id="throughline-heading"
          variant="body1"
          sx={{ fontWeight: "bold" }}
        >
          {
            "How can we limit the impacts of climate change on California's water future?"
          }
        </Typography>
      </Box>
    </>
  )
}
function SourceAnnouncer(selected: { selected: string }) {
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)
  const [isHidden, setIsHidden] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  return (
    <motion.div
      animate={isHidden ? "hidden" : "visible"}
      variants={{
        hidden: {
          top: "10px",
        },
        visible: {
          top: "74.5px",
        },
      }}
      transition={{ duration: 0.3 }}
      className="panel"
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        zIndex: 3,
      }}
    >
      {selected.selected === "oroville" && (
        <Box>
          <p>Enterprise Bridge at Oroville Dam</p>
          <p>Top: 2021. Bottom: 2023</p>
          <p>Photo by Justin Sullivan</p>
        </Box>
      )}
      {selected.selected === "temperature" && (
        <Box>
          <p>Projected temperature change relative to historical average</p>
          <p>Cal-Adapt mid-century projection of average maximum temperature</p>
          <p>Medium emission scenario(RCP4.5)</p>
        </Box>
      )}
      {selected.selected === "sealevel" && (
        <Box>
          <p>Projected sea level change (image-placeholder)</p>
          <p>Cal-Adapt CoSMoS 2020-2040 median flood scenario</p>
        </Box>
      )}
    </motion.div>
  )
}

function SelectionPanel({ onChange }: { onChange: (value: string) => void }) {
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)
  const [isHidden, setIsHidden] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  return (
    <motion.div
      animate={isHidden ? "hidden" : "visible"}
      variants={{
        hidden: {
          top: "10px",
        },
        visible: {
          top: "74.5px",
        },
      }}
      transition={{ duration: 0.3 }}
      className="selection-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        zIndex: 3,
      }}
    >
      <Box>
        <FormControl>
          Opener
          <RadioGroup
            row
            name="row-radio-buttons-group"
            defaultValue={"oroville"}
            onChange={(e) => onChange(e.target.value)}
          >
            <FormControlLabel
              value="oroville"
              control={<Radio size="small" />}
              label="Oroville"
            />
            <FormControlLabel
              value="temperature"
              control={<Radio size="small" />}
              label="Temperature"
            />
            <FormControlLabel
              value="sealevel"
              control={<Radio size="small" />}
              label="Sea Level"
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </motion.div>
  )
}

export default Opener
