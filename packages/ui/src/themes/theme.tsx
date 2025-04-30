import { createTheme, Theme } from "@mui/material/styles"
import type { CSSProperties } from "react"

// TODO:
// - Transitions

/* ========================================================
 TOC
 ========================================================
 1. Global theme values
    - Palette
    - Border radius
    - Border styles
    - Shadows
    - Z-Index
    - Layout dimensions

 2. Theme configuration
    - Base theme
    - Palette
    - Typography
    - Shape
    - Component overrides
    - Global styles
    
 3. Custom theme properties
    - Border
    - Background
    - Border radius
    
 4. TypeScript customizations
    - Custom palette extensions
    - Custom theme properties
    - Component variants
 ========================================================


 1. Global theme values
 ======================================================== 
 Change these values to update the theme across the site
 */

const themeValues = {
  // Typography
  fontFamily: {
    primary:
      '"akzidenz-grotesk-next-pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Layout dimensions
  layout: {
    headerHeight: 64,
    drawer: {
      width: 226,
      closedWidth: 64,
    },
  },

  // Palette colors
  palette: {
    black: "#000000",
    white: "#FFFFFF",
    neutral: {
      light: "#AAAAAA",
      medium: "#888888",
      dark: "#666666",
    },
    colors: {
      primary: "#AAAAAA",
      secondary: "#888888",
      tertiary: "#666666",
    },
    pop: {
      main: "#FF5733", // Orange for operations
      light: "#FF8866",
      dark: "#CC4422",
    },
    cool: {
      main: "#3498DB", // Cool blue for outcomes
      light: "#5DADE2",
      dark: "#2874A6",
    },
    climate: {
      main: "#27AE60", // Green for climate
      light: "#58D68D",
      dark: "#1E8449",
    },
  },

  // Border radius values
  borderRadius: {
    pill: "999px",
    rounded: "8px",
    card: "12px",
    standard: "24px",
    none: "0px",
  },

  // Border styles
  border: {
    standard: "1px solid",
    none: "none",
    thin: "0.5px solid",
    thick: "2px solid",
  },

  // Shadows
  shadow: {
    none: "none",
  },

  // Z-index values
  zIndex: {
    drawer: 1200,
    modal: 1300,
    appBar: 1400,
    tooltip: 1500,
  },
}

// Reusable paragraph hover mixin (background + icon scale)
const hoverParagraphMixin = {
  cursor: "pointer",
  p: 1,
  borderRadius: 1,
  transition: "background-color 0.3s ease",
  "&:hover": {
    backgroundColor: "rgba(25, 118, 210, 0.1)",
  },
  "&:hover .MuiSvgIcon-root": {
    color: "#42a5f5",
    transform: "scale(1.2)",
  },
  "&:active": {
    backgroundColor: "rgba(25, 118, 210, 0.16)",
  },
} as const

// Darkened variant of the hover paragraph (used when paragraphShade flag is true)
const hoverParagraphDarkenedMixin = {
  ...hoverParagraphMixin,
  backgroundColor: "rgba(54, 69, 99, 0.6)", // Payne's gray with blue and transparency
  color: "white",
  "&:hover": {
    backgroundColor: "rgba(54, 69, 99, 0.7)",
  },
  "&:active": {
    backgroundColor: "rgba(54, 69, 99, 0.8)",
  },
} as const

/* ========================================================
 2. Theme configuration
 ======================================================== */

const baseTheme = createTheme()

// Helper to create border strings
const createBorderStyles = (borderType: string, color: string) => {
  return {
    standard: `${borderType} ${color}`,
    none: themeValues.border.none,
    thin: `${themeValues.border.thin} ${color}`,
    thick: `${themeValues.border.thick} ${color}`,
    bottom: `border-bottom: ${borderType} ${color}`,
    top: `border-top: ${borderType} ${color}`,
    left: `border-left: ${borderType} ${color}`,
    right: `border-right: ${borderType} ${color}`,
    all: `border: ${borderType} ${color}`,
  }
}

// Helper to create drawer transition mixins
const createDrawerMixins = (
  theme: Theme,
  width: number,
  closedWidth: number,
) => {
  return {
    opened: {
      width: width,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: "hidden",
    },
    closed: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: "hidden",
      width: `${closedWidth}px`,
    },
  }
}

// Create theme
const theme = createTheme({
  ...baseTheme,
  // Custom layout values
  layout: {
    headerHeight: themeValues.layout.headerHeight,
    drawer: {
      width: themeValues.layout.drawer.width,
      closedWidth: themeValues.layout.drawer.closedWidth,
    },
  },
  // Palette (some are fixed MUI theme properties, some are custom)
  palette: {
    common: {
      black: themeValues.palette.black,
      white: themeValues.palette.white,
    },
    primary: {
      main: themeValues.palette.white,
      light: themeValues.palette.neutral.light,
      dark: themeValues.palette.neutral.dark,
    },
    secondary: {
      main: themeValues.palette.black,
      light: themeValues.palette.neutral.light,
      dark: themeValues.palette.neutral.dark,
    },
    neutral: {
      main: themeValues.palette.neutral.medium,
      light: themeValues.palette.neutral.light,
      dark: themeValues.palette.neutral.dark,
    },
    pop: {
      main: themeValues.palette.pop.main,
      light: themeValues.palette.pop.light,
      dark: themeValues.palette.pop.dark,
    },
    cool: {
      main: themeValues.palette.cool.main,
      light: themeValues.palette.cool.light,
      dark: themeValues.palette.cool.dark,
    },
    climate: {
      main: themeValues.palette.climate.main,
      light: themeValues.palette.climate.light,
      dark: themeValues.palette.climate.dark,
    },
    background: {
      default: themeValues.palette.white,
      paper: themeValues.palette.neutral.light,
    },
    interstitial: {
      main: "#4b8fb4",
    },
    text: {
      primary: themeValues.palette.black,
      secondary: themeValues.palette.white,
    },
    divider: themeValues.palette.white,
  },
  // Type family, sizes, and weights
  typography: {
    fontFamily: themeValues.fontFamily.primary,
    htmlFontSize: 16,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: "3.6rem",
      fontWeight: 500,
      lineHeight: 1.05,
      letterSpacing: "normal",
    },
    h2: {
      fontSize: "4.8rem",
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: "normal",
    },
    h3: {
      fontSize: "2.778rem",
      letterSpacing: "normal",
    },
    h4: {
      fontSize: "1.8rem",
      fontWeight: 300,
      letterSpacing: "normal",
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.6rem",
      letterSpacing: "normal",
    },
    h6: {
      fontSize: "1.2rem",
      letterSpacing: "normal",
    },
    body1: {
      fontSize: "1.4rem",
      letterSpacing: "normal",
      lineHeight: 1.4,
    },
    body2: {
      fontSize: "1.6rem",
    },
    subtitle1: {
      fontSize: "1.2rem",
      letterSpacing: "normal",
    },
    subtitle2: {
      fontSize: "0.8929rem",
      letterSpacing: "normal",
    },
    button: {
      fontSize: "1.0714rem",
      letterSpacing: "normal",
    },
    caption: {
      fontSize: "0.8929rem",
      letterSpacing: "normal",
    },
    overline: {
      fontSize: "0.8929rem",
      letterSpacing: "normal",
    },
  },
  shape: {
    borderRadius: parseInt(themeValues.borderRadius.standard, 10),
  },
  // Z-index
  zIndex: themeValues.zIndex,
  // Components customizations
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url("https://use.typekit.net/rxm7kha.css");
        *, *::before, *::after {
          box-sizing: border-box;
        }
        html, body, * {
          margin: 0;
          padding: 0;
          letter-spacing: normal;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: ${themeValues.fontFamily.primary};
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: ${themeValues.fontFamily.primary};
        }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.background.transparent,
          borderBottom: theme.border.standard,
          color: theme.palette.text.primary,
          borderRadius: theme.borderRadius.none,
          boxShadow: "none",
        }),
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiButton: {
      variants: [
        {
          props: { variant: "contained" },
          style: ({ theme }) => ({
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
          }),
        },
        {
          props: { variant: "outlined" },
          style: ({ theme }) => ({
            border: theme.border.standard,
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
          }),
        },
        {
          props: { variant: "pill" },
          style: ({ theme }) => ({
            border: theme.border.standard,
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
          }),
        },
        {
          props: { variant: "standard" }, // This is our standard button
          style: ({ theme }) => ({
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
            border: "none",
            padding: "6px 16px",
            minWidth: 64,
            lineHeight: 1.75,
            fontSize: "1.0714rem",
            fontWeight: 500,
            color: theme.palette.common.white,
            backgroundColor: theme.palette.common.black,
            "&:hover": {
              backgroundColor: "#333333",
              opacity: 0.9,
            },
          }),
        },
        {
          props: { variant: "text" },
          style: {
            textTransform: "none",
          },
        },
      ],
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.borderRadius.pill,
          boxShadow: "none",
        }),
      },
      defaultProps: {
        variant: "standard",
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.border.standard,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.border.standard,
          },
        }),
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: () => ({
          color: "inherit",
          fontSize: "inherit",
          transition: "none",
          pointerEvents: "auto",
          "&:hover, &:focus": {
            color: "inherit",
          },
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          color: theme.palette.text.secondary,
          width: 400,
          top: theme.layout.headerHeight,
          height: `calc(100% - ${theme.layout.headerHeight}px)`,
        }),
        root: ({ theme, ownerState }) => {
          const drawerMixins = createDrawerMixins(
            theme,
            theme.layout.drawer.width,
            theme.layout.drawer.closedWidth,
          )

          return {
            width: theme.layout.drawer.width,
            flexShrink: 0,
            whiteSpace: "nowrap",

            "&.MiniDrawer-docked": {
              zIndex: theme.zIndex.drawer,

              "& .MuiDrawer-paper.MiniDrawer-paper": {
                backgroundColor: theme.palette.common.white,
                top: 0,
                height: "100vh",
                borderRadius: 0,
                paddingTop: theme.layout.headerHeight,
                border: "none",

                ...(ownerState.open
                  ? drawerMixins.opened
                  : drawerMixins.closed),
              },

              "& .MuiListItemButton-root": {
                minHeight: 96,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: ownerState.open ? "flex-start" : "center",
                padding: theme.spacing(2),
                borderRadius: theme.borderRadius.standard,
                mx: 1,
                my: 0.5,
                overflow: "hidden",
                transition: theme.transitions.create(
                  [
                    "background-color",
                    "color",
                    "padding",
                    "margin",
                    "align-items",
                    "transform",
                    "box-shadow",
                  ],
                  {
                    duration: theme.transitions.duration.shortest,
                  },
                ),
                "& .MuiTouchRipple-root": {
                  display: "none",
                },
                "&.Mui-focusVisible": {
                  backgroundColor: "transparent",
                },
                "&:hover": {
                  backgroundColor: `${theme.palette.action.hover}cc`,
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",

                  // Ensure icon color is preserved on hover
                  "& .MuiListItemIcon-root .MuiSvgIcon-root": {
                    color: "inherit",
                  },
                },
                "&:active": {
                  transform: "translateY(0px)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                },
              },

              "& .MuiListItemIcon-root": {
                width: "100%",
                display: "flex",
                justifyContent: ownerState.open ? "flex-start" : "center",
                transition: theme.transitions.create("justify-content", {
                  duration: theme.transitions.duration.shortest,
                }),

                // Prevent icon color change on hover
                "& .MuiSvgIcon-root": {
                  color: "inherit",
                  transition: "none", // Disable color transition
                  "&:hover, &:focus": {
                    color: "inherit", // Keep the same color on hover/focus
                  },
                },
              },

              "& .MuiListItemText-root": {
                opacity: ownerState.open ? 1 : 0,
                whiteSpace: "nowrap",
              },
            },
          }
        },
      },
    },
    MuiToggleButton: {
      // Like the language switcher
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.borderRadius.pill,
          padding: "5px 15px", // to account for border width
          textTransform: "none",
          backgroundColor: "transparent", // Default background for unselected
          color: theme.palette.primary.contrastText, // Default text color for unselected
          boxShadow: "none",
          "&:hover": {
            backgroundColor: theme.palette.common.white, // White hover background
          },
          "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main, // Background for selected
            color: theme.palette.primary.contrastText, // Text color for selected
            "&:hover": {
              backgroundColor: theme.palette.common.white, // White hover background when selected
            },
          },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": {
            borderLeft: `${themeValues.border.standard} ${theme.palette.divider}`, // divider line
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.borderRadius.card,
        }),
      },
    },
  },
  mixins: {
    ...baseTheme.mixins,
    hoverParagraph: hoverParagraphMixin,
    hoverParagraphDarkened: hoverParagraphDarkenedMixin,
  },
})

/* ========================================================
 3. Custom theme properties
 ======================================================== */

// Apply border styles with colors from palette
theme.border = createBorderStyles(
  themeValues.border.standard,
  theme.palette.primary.main,
)

theme.background = {
  transparent: "transparent",
  paragraph: "rgba(0, 0, 0, 0.4)",
  overlay: {
    light: "rgba(0, 0, 0, 0.2)",
    medium: "rgba(0, 0, 0, 0.4)", // Same as paragraph background
    dark: "rgba(0, 0, 0, 0.8)",
  },
}

theme.borderRadius = themeValues.borderRadius

// expose mixin constant for easy import if needed
export const hoverParagraph = hoverParagraphMixin

export default theme

/* ========================================================
 4. TypeScript customizations
 ======================================================== */

// Custom palette colors and theme properties
declare module "@mui/material/styles" {
  // Custom palette colors
  interface Palette {
    interstitial: Palette["primary"]
    neutral: Palette["primary"]
    pop: Palette["primary"]
    cool: Palette["primary"]
    climate: Palette["primary"]
  }
  interface PaletteOptions {
    interstitial?: PaletteOptions["primary"]
    neutral?: PaletteOptions["primary"]
    pop?: PaletteOptions["primary"]
    cool?: PaletteOptions["primary"]
    climate?: PaletteOptions["primary"]
  }

  interface Theme {
    layout: {
      headerHeight: number
      drawer: {
        width: number
        closedWidth: number
      }
    }
    border: ReturnType<typeof createBorderStyles>
    background: {
      transparent: string
      paragraph: string
      overlay: {
        light: string
        medium: string
        dark: string
      }
    }
    borderRadius: {
      pill: string
      rounded: string
      card: string
      standard: string
      none: string
    }
  }

  interface ThemeOptions {
    layout?: {
      headerHeight?: number
      drawer?: {
        width?: number
        closedWidth?: number
      }
    }
  }

  interface Mixins {
    hoverParagraph: CSSProperties
    hoverParagraphDarkened: CSSProperties
  }
}

// Custom button variants
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    pill: true
    standard: true
  }
}
