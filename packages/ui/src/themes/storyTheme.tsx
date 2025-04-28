import { createTheme } from "@mui/material/styles"
import baseTheme from "./theme"

const storyTheme = createTheme({
  ...baseTheme,
  typography: {
    ...baseTheme.typography,
    allVariants: {
      color: "#f2f0ef",
    },
    body1: {
      ...baseTheme.typography.body1,
      fontSize: "1.8rem",
      lineHeight: 1.5,
    },
  },
  components: {
    MuiSlider: {
      styleOverrides: {
        root: {
          color: "#f2f0ef",
          height: 5,
        },
        thumb: {
          height: 15,
          width: 15,
        },
        valueLabel: {
          backgroundColor: "var(--primary-color)",
          color: "var(--text-color)",
          fontSize: "1rem",
        },
        mark: {
          backgroundColor: "var(--text-color)", // Mark color
          height: 6,
          width: 6,
          borderRadius: "50%",
        },
        markLabel: {
          color: "var(--text-color)", // Mark label color
          fontSize: "0.9rem",
        },
      },
    },
  },
})

export default storyTheme
