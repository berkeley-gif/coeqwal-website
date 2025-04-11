import { createTheme } from "@mui/material/styles"
import baseTheme from "./theme"

const storyTheme = createTheme({
    ...baseTheme,
    typography: {
        ...baseTheme.typography,
        allVariants: {
            color: baseTheme.palette.common.white,
        },
        body1: {
            ...baseTheme.typography.body1,
            fontSize: '1.5rem',
            lineHeight: 1.5,
        }
    }
})

export default storyTheme
