import { createTheme } from "@mui/material/styles"
import baseTheme from "./theme"

const storyTheme = createTheme({
  ...baseTheme,
  typography: {
    ...baseTheme.typography,
    allVariants: {
      color: baseTheme.palette.common.white,
    },
  },
})

export default storyTheme
