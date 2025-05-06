import React, { useState } from "react"
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

const tutorialSteps: { description: React.ReactNode }[] = [
  {
    description: (
      <>
        Welcome to the <em>Water Needs</em>-based search interface! This quick
        tutorial will help you get started.
        <br />
        <br />
        The goal of this interface is to help you:
        <br />
        <br />
        <ol
          style={{
            maxWidth: "80%",
            paddingLeft: "20px",
            textAlign: "left", // Center the text
            margin: "0 auto", // Center the list horizontally
          }}
        >
          <li>
            Find scenarios that meet your <em>Water Needs</em>.
          </li>
          <li>
            Learn about possible synergies and trade-offs with other{" "}
            <em>Water Needs</em>.
          </li>
          <li>
            Learn how your scenarios can be realized via water operations.
          </li>
        </ol>
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
        <br />
        <br />
        Simply put, it&apos;s a way to express what someone wants or needs from
        their water allocations.
        <br />
        <br />
        For example, someone might have interest in maintaining a certain amount
        of water delivery to a particular location, or someone else might be
        more interested in preserving habitat for Salmon.
      </>
    ),
  },
  {
    description: (
      <>
        But one of the realities of California water is it&apos;s a highly
        complex system; not all <em>Water Needs</em> can be met{" "}
        <strong>at the same time</strong>.
        <br />
        <br />
        Some <em>Water Needs</em> can be met simultaneously, but some may be in
        conflict with each other.
        <br />
        <br />
        When two sets of needs can be met together, we&apos;ll call them{" "}
        {/* You&apos;ll see this referred to as{" "} */}
        <Box
          sx={{
            background: "rgba(214, 229, 189, 1.0)", // Adjusted for transparency
            borderRadius: "5px",
            padding: "2px 4px",
            display: "inline-flex",
            alignItems: "center",
            verticalAlign: "middle",
            "&:hover": {
              background: "rgba(214, 229, 189, 0.5)", // Adjusted for transparency
              cursor: "pointer",
            },
          }}
        >
          synergistic
          {/* <VisibilityIcon />! */}
        </Box>
        !
        <br />
        <br />
        On the other hand, if we can&apos;t find a scenario in our catalog that
        meets both sets of needs, we&apos;ll call them {/* ! and{" "} */}
        <Box
          sx={{
            background: "rgba(255, 203, 203, 1.0)", // Adjusted for transparency
            borderRadius: "5px",
            padding: "2px 4px",
            display: "inline-flex",
            alignItems: "center",
            verticalAlign: "middle",
            "&:hover": {
              background: "rgba(255, 203, 203, 0.5)", // Adjusted for transparency
              cursor: "pointer",
            },
          }}
        >
          unsatisfiable
          {/* <VisibilityIcon />. */}
        </Box>
        .
        <br />
        <br />
        So, keep a look out for these terms!
        <br />
        <br />
        However, remember these results are based on the future scenarios that
        we at COEQWAL have considered &mdash; there may be other scenarios that
        we&apos;ve <em> unfortunately missed.</em>
      </>
    ),
  },
  {
    description: (
      <>
        We welcome you to define your own <em>Water Needs</em>, and we also have
        a list of pre-defined <em>Water Needs</em> that COEQWAL is aware of, so
        you learn how your <em>Water Needs</em> relate to those as well.
        <br />
        <br />
        We hope it&apos;s informative and useful for you!
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
        padding: 3,
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
