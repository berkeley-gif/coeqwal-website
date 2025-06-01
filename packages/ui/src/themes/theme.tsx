import { createTheme, Theme } from "@mui/material/styles"
import type { CSSProperties } from "react"

// TODO:
// - Standardized styles for transitions

/* ========================================================
 TOC
 ========================================================
 1. Global theme values
    - Typography (font families)
    - Layout dimensions
    - Palette colors (including categories)
    - Border radius values
    - Border styles
    - Shadows
    - Z-Index values
    - Reusable mixins (hover effects, drawer content)

 2. Theme configuration
    - Base theme creation
    - Helper functions (border styles, drawer mixins)
    - Main theme object with:
      - Layout properties
      - Cards typography and spacing
      - Palette configuration
      - Typography variants
      - Shape settings
      - Component overrides (MUI components)
      - Global styles (CssBaseline)
      - Custom mixins

 3. Custom theme properties
    - Border utilities
    - Background overlays
    - Border radius application
    - Drawer navigation colors
    - Exported constants

 4. TypeScript customizations
    - Custom palette extensions
    - Custom theme interface extensions
    - Z-Index interface
    - Cards interface
    - Component variant overrides
    - Typography variant extensions
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
    inter:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    neueHaasDisplay:
      '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    neueHaasText:
      '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sentinel: '"sentinel", Georgia, "Times New Roman", Times, serif',
    sofiaPro:
      '"sofia-pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // TEST FONT - Tiempos Headline
    tiemposHeadline:
      '"Tiempos Headline", Georgia, "Times New Roman", Times, serif',
    // TEST FONT - Tiempos Text
    tiemposText: '"Tiempos Text", Georgia, "Times New Roman", Times, serif',
    // Acumin Pro from Adobe fonts
    acuminPro:
      '"acumin-pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // Calluna from Adobe fonts
    calluna: '"calluna", Georgia, "Times New Roman", Times, serif',
  },

  // Layout dimensions
  layout: {
    headerHeight: 64,
    drawer: {
      width: 226,
      closedWidth: 52,
    },
  },

  // Palette colors
  palette: {
    black: "#274472",
    white: "#FFFFFF",
    teal: "#007C92", // Teal color for primary typeface
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
    // Category-specific colors
    categories: {
      groundwaterManagement: "#4CAF50", // Leafy green, ag/groundwater
      riverFlows: "#2196F3", // Cool blue, river systems
      urbanWaterPriorities: "#9C27B0", // Plum purple, civic-focused
      deltaBalance: "#FF9800", // Amber/orange, delta ecosystems
      infrastructure: "#607D8B", // Slate gray, engineered systems
      noFlowRequirements: "#F44336", // Red, disruption/emergency
      carryoverRequirements: "#00ACC1", // Aqua, reservoir logic
      deltaOutflows: "#FF5722", // Burnt orange, flow export
      urbanDemand: "#8BC34A", // Light green, consumption
      exportReductions: "#3F51B5", // Deep indigo, regulatory
      conveyanceProjects: "#795548", // Earthy brown, infrastructure
      climateFuture: "#E91E63", // Bright magenta, emphasis
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
    // Map layer (when active)
    map: -1,

    // Main content layers
    panels: 0, // All panels and sections

    // Intro section specific layers
    introBubbles: 0, // White bubbles
    introBackgroundImages: 1,
    introText: 2,
    introForegroundImages: 3,

    // Navigation layers (keep existing)
    drawer: 1200,
    modal: 1300,
    appBar: 1400,
    tooltip: 1500,

    // Special cases (keep existing)
    drawerBackdrop: 1199, // Just below drawer
    overlay: 1250, // Between drawer and modal
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

// Drawer content styling mixins
const drawerContentMixins = {
  contentWrapper: {
    p: 2,
    width: "100%",
    height: "100%",
    overflow: "auto",
    color: "text.primary",
  },
  headerBox: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    mb: 2,
  },
  closeButton: {
    color: "text.primary",
  },
  contentText: {
    lineHeight: 1.4,
    color: "text.primary",
    mb: 3,
  },
  infoBox: {
    mt: 2,
    p: 2,
    bgcolor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 1,
  },
  headingText: {
    fontWeight: "bold",
    color: "primary.dark",
  },
  itemBox: {
    mb: 1.5,
    p: 1.5,
    borderRadius: 1,
    bgcolor: "rgba(0, 0, 0, 0.02)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      bgcolor: "rgba(0, 0, 0, 0.05)",
      transform: "translateX(4px)",
    },
  },
  selectedItemBox: {
    bgcolor: "rgba(0, 0, 0, 0.08)",
    boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.1)",
  },
  chip: {
    color: "text.primary",
    borderColor: "rgba(0, 0, 0, 0.23)",
    mr: 0.5,
    mb: 0.5,
  },
  icon: {
    mr: 1.5,
    mt: 0.5,
    color: "primary.dark",
  },
  secondaryText: {
    lineHeight: 1.4,
    color: "text.primary",
  },
  bodyText: {
    mt: 1,
    lineHeight: 1.4,
    color: "text.primary",
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
  // Card typography scale
  cards: {
    typography: {
      hero: {
        fontSize: "2.5rem", // 40px
        lineHeight: 1.25,
        fontWeight: 600,
      },
      sectionTitle: {
        fontSize: "2rem", // 32px
        lineHeight: 1.25,
        fontWeight: 600,
      },
      cardTitle: {
        fontSize: "1.5rem", // 24px
        lineHeight: 1.4,
        fontWeight: 500,
      },
      subtitle: {
        fontSize: "1.25rem", // 20px
        lineHeight: 1.5,
        fontWeight: 400,
      },
      body: {
        fontSize: "1rem", // 16px
        lineHeight: 1.5,
        fontWeight: 400,
      },
      caption: {
        fontSize: "0.95rem", // smallest type per spec
        lineHeight: 1.4,
        fontWeight: 400,
      },
      button: {
        fontSize: "0.95rem",
        lineHeight: 1.5,
        fontWeight: 500,
      },
    },
    spacing: {
      padding: 3, // 24px inner padding
      gap: 3, // 24px between cards
      capsule: {
        px: 2, // Horizontal emphasis
        py: 0.5, // Minimal vertical padding
        marginRight: 1, // Space between capsules (horizontal)
        marginBottom: 1, // Space between capsules (vertical wrapping)
      },
      modal: {
        padding: 4, // 32px for modal content
      },
      coBenefitTags: {
        marginTop: 2, // Slightly detached from subtypes
      },
      tellMoreIcon: {
        marginLeft: "auto", // Aligns right within card header row
      },
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
      dark: "#274472",
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
    categories: {
      groundwaterManagement:
        themeValues.palette.categories.groundwaterManagement,
      riverFlows: themeValues.palette.categories.riverFlows,
      urbanWaterPriorities: themeValues.palette.categories.urbanWaterPriorities,
      deltaBalance: themeValues.palette.categories.deltaBalance,
      infrastructure: themeValues.palette.categories.infrastructure,
      noFlowRequirements: themeValues.palette.categories.noFlowRequirements,
      carryoverRequirements:
        themeValues.palette.categories.carryoverRequirements,
      deltaOutflows: themeValues.palette.categories.deltaOutflows,
      urbanDemand: themeValues.palette.categories.urbanDemand,
      exportReductions: themeValues.palette.categories.exportReductions,
      conveyanceProjects: themeValues.palette.categories.conveyanceProjects,
      climateFuture: themeValues.palette.categories.climateFuture,
    },
    background: {
      default: themeValues.palette.white,
      paper: themeValues.palette.neutral.light,
    },
    interstitial: {
      main: "#4b8fb4",
    },
    text: {
      primary: "#274472",
      secondary: themeValues.palette.white,
      teal: themeValues.palette.teal,
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
      fontFamily: themeValues.fontFamily.tiemposText,
      fontSize: "5rem",
      fontWeight: 600,
      lineHeight: "4.6rem",
    },
    h2: {
      fontFamily: themeValues.fontFamily.tiemposText,
      fontSize: "3.75rem",
      fontWeight: 500,
      lineHeight: "4.25rem",
    },
    h3: {
      fontFamily: themeValues.fontFamily.tiemposText,
      fontSize: "2.5rem",
      fontWeight: 500,
      lineHeight: "2.8125rem",
    },
    h4: {
      fontFamily: themeValues.fontFamily.sentinel,
      fontSize: "1.25rem", // unchanged (20px)
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: "1.15rem",
      fontWeight: 500,
    },
    h6: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: "1.05rem",
      fontWeight: 500,
    },
    body1: {
      fontFamily: themeValues.fontFamily.acuminPro,
      fontSize: "1.3rem",
      fontWeight: 400,
      letterSpacing: "unset",
      lineHeight: "2rem",
    },
    body2: {
      fontFamily: themeValues.fontFamily.acuminPro,
      fontSize: "1.3rem",
      fontWeight: 400,
      letterSpacing: "unset",
      lineHeight: "2rem",
    },
    subtitle1: {
      fontSize: "1.25rem",
      letterSpacing: "normal",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "1.1rem",
      letterSpacing: "normal",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.95rem",
      letterSpacing: "normal",
      fontWeight: 500,
      textTransform: "none",
    },
    caption: {
      fontSize: "0.95rem", // smallest type per spec
      letterSpacing: "normal",
      lineHeight: 1.4,
    },
    overline: {
      fontSize: "0.75rem",
      letterSpacing: "normal",
      lineHeight: 1.4,
    },
    nav: {
      fontSize: "0.875rem",
      letterSpacing: "normal",
      lineHeight: 1.4,
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
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
        
        /* Tiempos Headline Font - All Weights */
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-light.woff2') format('woff2');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-semibold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Headline';
          src: url('/fonts/test-tiempos-headline-bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        /* Tiempos Text Font - All Weights */
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-semibold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Tiempos Text';
          src: url('/fonts/test-tiempos-text-bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        *, *::before, *::after {
          box-sizing: border-box;
        }
        html, body, * {
          margin: 0;
          padding: 0;
          letter-spacing: normal;
          hyphens: none;
          -ms-hyphens: none;
          -webkit-hyphens: none;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: ${themeValues.fontFamily.primary};
          overflow-x: hidden; /* Prevent horizontal scrollbar */
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
            fontSize: "0.95rem",
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
          top: theme.layout.headerHeight,
          height: `calc(100% - ${theme.layout.headerHeight}px)`,
          borderRadius: 0,
        }),
        root: ({ theme, ownerState }) => {
          const drawerMixins = createDrawerMixins(
            theme,
            theme.layout.drawer.width,
            theme.layout.drawer.closedWidth,
          )

          return {
            width: theme.layout.drawer.width,

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
                display: "block",
                padding: theme.spacing(2),
                borderRadius: theme.borderRadius.standard,
                mx: 1,
                my: 0.5,
                transition: theme.transitions.create(
                  ["background-color", "transform", "box-shadow"],
                  {
                    duration: theme.transitions.duration.shortest,
                  },
                ),
                "&:hover": {
                  backgroundColor: `${theme.palette.action.hover}cc`,
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                },
                "&:active": {
                  transform: "translateY(0px)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                },
              },

              "& .MuiListItem-root": {
                transform: ownerState.open ? "rotate(0deg)" : "rotate(-90deg)",
                transformOrigin: "center center",
                transition: theme.transitions.create("transform", {
                  duration: theme.transitions.duration.shortest,
                }),
              },

              "& .MuiListItemText-root": {
                textAlign: ownerState.open ? "left" : "center",
                "& .MuiListItemText-primary": {
                  color: "inherit",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  lineHeight: 1.1,
                },
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
          padding: "1px 15px", // to account for border width
          textTransform: "none",
          backgroundColor: "transparent", // Default background for unselected
          color: theme.palette.common.white, // Default text color for unselected
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "transparent",
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
    MuiToolbar: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: theme.layout.headerHeight,
          minHeight: theme.layout.headerHeight,
          [theme.breakpoints.up("sm")]: {
            minHeight: theme.layout.headerHeight,
          },
        }),
      },
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: "body2" },
          style: ({ theme }) => ({
            marginBottom: theme.spacing(4), // 32px between body2 paragraphs
          }),
        },
        {
          props: { color: "teal" },
          style: {
            color: "#135773", // Teal color
          },
        },
      ],
    },
  },
  mixins: {
    ...baseTheme.mixins,
    hoverParagraph: hoverParagraphMixin,
    hoverParagraphDarkened: hoverParagraphDarkenedMixin,
    drawerContent: drawerContentMixins,
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

// Define color palette for drawer navigation items
theme.drawerNavigation = {
  colors: ["#BFDADC", "#9ACBCF", "#76B2BE", "#548FAF", "#3B6C97", "#1A3F6A"],
}

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
    categories: {
      groundwaterManagement: string
      riverFlows: string
      urbanWaterPriorities: string
      deltaBalance: string
      infrastructure: string
      noFlowRequirements: string
      carryoverRequirements: string
      deltaOutflows: string
      urbanDemand: string
      exportReductions: string
      conveyanceProjects: string
      climateFuture: string
    }
  }

  interface TypeText {
    teal: string
  }

  interface PaletteOptions {
    interstitial?: PaletteOptions["primary"]
    neutral?: PaletteOptions["primary"]
    pop?: PaletteOptions["primary"]
    cool?: PaletteOptions["primary"]
    climate?: PaletteOptions["primary"]
    categories?: {
      groundwaterManagement?: string
      riverFlows?: string
      urbanWaterPriorities?: string
      deltaBalance?: string
      infrastructure?: string
      noFlowRequirements?: string
      carryoverRequirements?: string
      deltaOutflows?: string
      urbanDemand?: string
      exportReductions?: string
      conveyanceProjects?: string
      climateFuture?: string
    }
  }

  // Extend the zIndex interface to include our custom values
  interface ZIndex {
    map: number
    panels: number
    introBubbles: number
    introBackgroundImages: number
    introText: number
    introForegroundImages: number
    drawerBackdrop: number
    overlay: number
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
    drawerNavigation: {
      colors: string[]
    }
    cards: {
      typography: {
        hero: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
        sectionTitle: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
        cardTitle: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
        subtitle: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
        body: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
        caption: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
        button: {
          fontSize: string
          lineHeight: number
          fontWeight: number
        }
      }
      spacing: {
        padding: number
        gap: number
        capsule: {
          px: number
          py: number
          marginRight: number
          marginBottom: number
        }
        modal: {
          padding: number
        }
        coBenefitTags: {
          marginTop: number
        }
        tellMoreIcon: {
          marginLeft: string
        }
      }
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
    cards?: {
      typography?: {
        hero?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
        sectionTitle?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
        cardTitle?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
        subtitle?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
        body?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
        caption?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
        button?: {
          fontSize?: string
          lineHeight?: number
          fontWeight?: number
        }
      }
      spacing?: {
        padding?: number
        gap?: number
        capsule?: {
          px?: number
          py?: number
          marginRight?: number
          marginBottom?: number
        }
        modal?: {
          padding?: number
        }
        coBenefitTags?: {
          marginTop?: number
        }
        tellMoreIcon?: {
          marginLeft?: string
        }
      }
    }
  }

  interface Mixins {
    hoverParagraph: CSSProperties
    hoverParagraphDarkened: CSSProperties
    drawerContent: typeof drawerContentMixins
  }

  // Add custom typography variant
  interface TypographyVariants {
    nav: React.CSSProperties
  }
  interface TypographyVariantsOptions {
    nav?: React.CSSProperties
  }
}

// Custom button variants
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    pill: true
    standard: true
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    nav: true
  }
}
