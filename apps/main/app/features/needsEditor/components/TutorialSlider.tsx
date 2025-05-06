import React, { act, useState } from "react"
import {
  Box,
  Button,
  Typography,
  MobileStepper,
  Paper,
  useTheme,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@repo/ui/mui"

const tutorialSteps = [
  {
    description: (
      <>
        Welcome to the <strong>Water Needs</strong>-based search interface. This
        is quick tutorial to help you get started!
      </>
    ),
  },
  {
    description: (
      <>
        COEQWAL believes that <strong>Water Needs</strong> in California are
        <strong> diverse</strong>.
        <br />
        This interface allows you to define your own set of <em>
          Water Needs
        </em>{" "}
        and search the COEQWAL scenarios.
        <br />
        <br />
        Here a <strong>Water Need</strong> is just a criteria or a requirement
        for a water allocation scenario, whether that&apos;s related to Water
        Deliveries, Salmon Population, or Delta Salinity.
      </>
    ),
  },
  {
    description: (
      <>
        But one of the realities of California water is that not all{" "}
        <em>Water Needs</em> can be met <strong>at the same time</strong>.
        <br />
        Some <em>Water Needs</em> can be met simultaneously but some are in
        conflict with each other.
        <br />
        <br />
        You&apos;ll see this referred to as{" "}
        <span
          style={{
            background: "#D6E5BD",
            borderRadius: "5px",
            padding: "2px 4px",
          }}
        >
          satisfiable
        </span>{" "}
        and{" "}
        <span
          style={{
            background: "#FFCBCB",
            borderRadius: "5px",
            padding: "2px 4px",
          }}
        >
          unsatisfiable
        </span>{" "}
        needs.
        <br />
        <br />
        So, keep a look out for these terms!
      </>
    ),
  },
]

type TutorialSliderProps = {
  onFinish: () => void
}

const TutorialSlider: React.FC<TutorialSliderProps> = ({ onFinish }) => {
  const [activeStep, setActiveStep] = useState(0)
  const maxSteps = tutorialSteps.length
  const theme = useTheme()

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, maxSteps - 1))
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "#E9E9E9",
        width: "60%",
        margin: "auto",
        padding: 2,
        textAlign: "center",
        borderRadius: 1,
      }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>
        {tutorialSteps[activeStep] && tutorialSteps[activeStep].description}
      </Typography>

      <MobileStepper
        variant="dots"
        steps={maxSteps}
        position="static"
        activeStep={activeStep}
        sx={{
          justifyContent: "space-between",
          background: "transparent",
          width: "100%",
          mt: 4,
        }}
        nextButton={
          activeStep === maxSteps - 1 ? (
            <Button size="medium" onClick={onFinish} sx={{ px: 3 }}>
              Finish
            </Button>
          ) : (
            <Button size="medium" onClick={handleNext} sx={{ px: 3 }}>
              Next
              {theme.direction === "rtl" ? (
                <ArrowLeftIcon />
              ) : (
                <ArrowRightIcon />
              )}
            </Button>
          )
        }
        backButton={
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              size="medium"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ px: 3 }}
            >
              {theme.direction === "rtl" ? (
                <ArrowRightIcon />
              ) : (
                <ArrowLeftIcon />
              )}
              Back
            </Button>
          </Box>
        }
      />
      {activeStep == 0 && (
        <Button
          variant="outlined"
          size="medium"
          onClick={onFinish} // Skip button calls the onFinish callback
          sx={{ ml: "auto", px: 3, color: "black", borderColor: "black" }}
        >
          Skip the tutorial
        </Button>
      )}
    </Paper>
  )
}

export default TutorialSlider
