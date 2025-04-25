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
})

export default storyTheme
