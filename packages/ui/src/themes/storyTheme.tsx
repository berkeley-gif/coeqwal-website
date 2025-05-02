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
      fontSize: "0.875rem", // xs default
      lineHeight: 1.5,
      "@media (min-width: 1200px)": {
        fontSize: "1.25rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "1.8rem",
      },
    },
    h2: {
      ...baseTheme.typography.h2,
      "@media (min-width: 1200px)": {
        fontSize: "3.35rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "4.8rem",
      },
    },
    h3: {
      ...baseTheme.typography.h3,
      "@media (min-width: 1200px)": {
        fontSize: "1.8rem",
      },
      "@media (min-width: 1536px)": {
        fontSize: "2.778rem",
      },
    },
    body2: {
      ...baseTheme.typography.body2,
      fontSize: "0.8929rem",
      letterSpacing: "normal",
    },
    caption: {
      ...baseTheme.typography.caption,
      color: "rgba(242, 240, 239, 0.6)",
      lineHeight: 1,
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        gutterBottom: {
          marginBottom: "1rem",
        },
      },
    },
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
