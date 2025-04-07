import { createTheme, alpha } from "@mui/material/styles"

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
  // Layout dimensions
  layout: {
    headerHeight: 64,
    drawer: {
      width: 240,
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
    standard: "4px",
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
const createDrawerMixins = (theme: any, width: number, closedWidth: number) => {
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
      main: themeValues.palette.black,
      light: themeValues.palette.neutral.light,
      dark: themeValues.palette.neutral.dark,
    },
    secondary: {
      main: themeValues.palette.white,
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
      main: themeValues.palette.neutral.light,
    },
    text: {
      primary: themeValues.palette.black,
      secondary: themeValues.palette.white,
    },
    divider: themeValues.palette.black,
  },
  // Type family, sizes, and weights
  typography: {
    fontFamily: `"Inter Tight", Arial, sans-serif`,
    htmlFontSize: 16,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: "4rem",
      lineHeight: 1.1,
    },
    h2: {
      fontSize: "3.333rem",
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "2.778rem",
    },
    h4: {
      fontSize: "2.315rem",
    },
    h5: {
      fontSize: "1.929rem",
    },
    h6: {
      fontSize: "1.608rem",
    },
    body1: {
      fontSize: "1.2857rem",
    },
    body2: {
      fontSize: "1.2rem",
    },
    subtitle1: {
      fontSize: "1.0714rem",
    },
    subtitle2: {
      fontSize: "0.8929rem",
    },
    button: {
      fontSize: "1.0714rem",
    },
    caption: {
      fontSize: "0.8929rem",
    },
    overline: {
      fontSize: "0.8929rem",
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
      styleOverrides: {
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        "html, body": {
          margin: 0,
          padding: 0,
          height: "100%",
        },
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
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
          props: { variant: "text" },
          style: ({ theme }) => ({
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
          }),
        },
      ],
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.borderRadius.pill,
          boxShadow: "none",
        }),
      },
      defaultProps: {
        variant: "contained",
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
        root: ({ theme }) => ({
          color: "inherit",
          fontSize: "inherit",
          transition: "color 0.2s ease-in-out",
          pointerEvents: "auto",
          "&:hover, &:focus": {
            color: theme.palette.primary.light,
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

                ...(ownerState.open
                  ? drawerMixins.opened
                  : drawerMixins.closed),
              },

              "& .MuiListItemButton-root": {
                minHeight: 48,
                justifyContent: ownerState.open ? "initial" : "center",
                padding: theme.spacing(0, 2.5),
              },

              "& .MuiListItemIcon-root": {
                minWidth: 0,
                marginRight: ownerState.open ? theme.spacing(3) : "auto",
                justifyContent: "center",
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
          backgroundColor: theme.palette.primary.light, // Default background for unselected
          color: theme.palette.primary.contrastText, // Default text color for unselected
          boxShadow: "none",
          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.light, 0.7), // Hover
          },
          "&.Mui-selected": {
            backgroundColor: "transparent", // Background for selected
            color: theme.palette.primary.main, // Text color for selected
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
            },
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
}

theme.borderRadius = themeValues.borderRadius

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
    }
    borderRadius: typeof themeValues.borderRadius
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
}

// Custom button variants
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    pill: true
  }
}
