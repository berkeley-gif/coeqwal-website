import { createTheme, Theme } from "@mui/material/styles"
import type { CSSProperties } from "react"

// TODO:
// - Standardized styles for transitions

/* ========================================================
 TOC
 ========================================================
  1. Global theme values
     - Typography (font families, type scale)
     - Layout dimensions (headerHeight, drawer widths incl. glossaryWidth)
     - Palette colors (including categories, ambient)
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

// ===============================================================================
// TYPOGRAPHY SCALE
// ===============================================================================
//
// Perfect Fourth (1.333) type scale
// Base: 1.25rem body text
//
// Scale progression:
// • h1: 5.75rem (92px) - Hero headlines "Learn. Explore. Empower."
// • h2: 3.75rem (60px) - Section headlines "What is the future..."
// • h3: 2.8rem (44.8px) - Subsection headlines
// • h4: 2.1rem (33.6px) - Card titles and smaller headlines
// • h5: 1.575rem (25.2px) - Labels and minor headlines
// • h6: 1.18rem (18.9px) - Small headlines and captions
// • body1: 1.25rem (20px) - Primary body text
// • body2: 1.125rem (18px) - Secondary body text
//
// All headlines use GT Super Text for cohesive editorial style
// GT Super Text weights: 300 (book), 400 (regular), 500 (medium), 700 (bold), 900 (black)
//

const H1_FONT = "gtSuperText" // GT Super Text for h1 headlines

const typeScale = {
  // Base sizes for the scale
  baseBody: "1.25rem", // 20px - reading size
  smallBody: "1.125rem", // 18px - secondary text

  // Headline sizes
  h1: "5.75rem", // 92px - Hero size
  h2: "3.75rem", // 60px - Major section headers
  h3: "2.8rem", // 44.8px - Subsection headers
  h4: "2.1rem", // 33.6px - Card titles (h3 ÷ 1.333)
  h5: "1.575rem", // 25.2px - Minor headlines (h4 ÷ 1.333)
  h6: "1.18rem", // 18.9px - Small headlines (h5 ÷ 1.333)
}

const themeValues = {
  // Typography
  fontFamily: {
    neueHaasText:
      '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    gtSuperText:
      '"GT Super Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Layout dimensions (necessary for panel layout calculations)
  layout: {
    headerHeight: 64,
    drawer: {
      width: 226,
      closedWidth: 52,
      glossaryWidth: 360,
    },
  },

  // Color Palette - California Water Theme
  palette: {
    // Core brand colors (see home panel gradient)
    brand: {
      sky: "#92C1D5", // Top of gradient - sky blue
      water: "#64A4D6", // Bottom of gradient - water blue
    },

    // Text and UI blues (organized by intensity)
    blue: {
      darkest: "#3a4574", // Deep navy - primary text (TODO: should it be #2A5287 ?)
      dark: "#186b88", // Dark teal - secondary text
      medium: "#2d89b6", // Medium blue - accent text
      bright: "#449cd9", // Bright blue - links/interactive
      light: "#77a2d9", // Light blue - subtle elements
    },

    // Accent colors - warm tones
    accent: {
      gold: "#ffd87e", // Golden yellow - highlights
      cream: "#fdf0a0", // Light yellow
    },

    // Nature colors - greens and teals
    nature: {
      teal: "#76b9aa", // Medium teal - natural elements
      sage: "#9fd5cb", // Light teal - subtle backgrounds
      mint: "#b1e1c3", // Pale green - very light elements
      whisper: "#d1ebc7", // Very light green - backgrounds
    },

    // Utility colors
    utility: {
      white: "#FFFFFF",
      black: "#000000",
    },

    // MUI greys
    grey: {
      50: "#f7fafc", // Very light grey for backgrounds
      100: "#edf2f7",
      200: "#e2e8f0",
      300: "#cbd5e0",
      400: "#a0aec0",
      500: "#718096",
      600: "#4a5568", // Dark grey for text
      700: "#2d3748",
      800: "#1a202c",
      900: "#171923",
    },

    // Ambient/mood elements
    ambient: {
      rippleWhite: "rgba(255, 255, 255, 0.16)", // Water ripples - white at 16% opacity
      rippleBlue: "rgba(42, 82, 135, 0.16)", // Water ripples - blue (#2A5287) at 16% opacity
    },

    categories: {
      groundwaterManagement: "#76b9aa", // nature.teal
      riverFlows: "#2d89b6", // blue.medium
      urbanWaterPriorities: "#449cd9", // blue.bright
      deltaBalance: "#ffd87e", // accent.gold
      infrastructure: "#3a4574", // blue.darkest
      noFlowRequirements: "#186b88", // blue.dark
      carryoverRequirements: "#77a2d9", // blue.light
      deltaOutflows: "#87CEEB", // brand.sky
      urbanDemand: "#9fd5cb", // nature.sage
      exportReductions: "#64a3d7", // brand.water
      conveyanceProjects: "#b1e1c3", // nature.mint
      climateFuture: "#ffd87e", // accent.gold
    },
  },

  // Border radius values
  borderRadius: {
    pill: "999px",
    rounded: "8px",
    card: "16px",
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
    introBubbles: 0,
    introBackgroundImages: 1,
    introText: 2,
    introForegroundImages: 3,

    // Navigation layers
    drawer: 1200,
    modal: 1300,
    appBar: 1400,
    tooltip: 1500,

    // Special cases
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

// ScenarioCard list styling mixin
const scenarioCardListMixin = {
  "& ul": {
    margin: 0,
    paddingLeft: "20px", // Slightly more indentation
    "& li": {
      fontSize: "1rem",
      lineHeight: 1.6, // Good reading line height
      marginBottom: "8px", // Good spacing between items
      color: "inherit",
      "&:last-child": {
        marginBottom: 0,
      },
      // Add bullet styling
      "&::marker": {
        color: "inherit",
      },
    },
  },
} as const

// Tooltip action button mixin
const tooltipActionButtonMixin = {
  textTransform: "none",
  borderRadius: themeValues.borderRadius.pill,
  boxShadow: "none",
  border: "none",
  padding: "4px 12px",
  minWidth: "auto",
  lineHeight: 1.5,
  fontSize: "0.8rem",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s ease",
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
  // Palette - California Water Theme (MUI integration)
  palette: {
    common: {
      black: themeValues.palette.utility.black,
      white: themeValues.palette.utility.white,
    },
    primary: {
      main: themeValues.palette.blue.darkest,
      light: themeValues.palette.blue.light,
      dark: themeValues.palette.blue.dark,
    },
    secondary: {
      main: themeValues.palette.brand.water,
      light: themeValues.palette.brand.sky,
      dark: themeValues.palette.blue.medium,
    },
    // Add our new color groups to MUI palette
    brand: {
      sky: themeValues.palette.brand.sky,
      water: themeValues.palette.brand.water,
    },
    blue: {
      darkest: themeValues.palette.blue.darkest,
      dark: themeValues.palette.blue.dark,
      medium: themeValues.palette.blue.medium,
      bright: themeValues.palette.blue.bright,
      light: themeValues.palette.blue.light,
    },
    accent: {
      gold: themeValues.palette.accent.gold,
      cream: themeValues.palette.accent.cream,
    },
    nature: {
      teal: themeValues.palette.nature.teal,
      sage: themeValues.palette.nature.sage,
      mint: themeValues.palette.nature.mint,
      whisper: themeValues.palette.nature.whisper,
    },
    utility: {
      white: themeValues.palette.utility.white,
      black: themeValues.palette.utility.black,
    },
    grey: {
      50: themeValues.palette.grey[50],
      100: themeValues.palette.grey[100],
      200: themeValues.palette.grey[200],
      300: themeValues.palette.grey[300],
      400: themeValues.palette.grey[400],
      500: themeValues.palette.grey[500],
      600: themeValues.palette.grey[600],
      700: themeValues.palette.grey[700],
      800: themeValues.palette.grey[800],
      900: themeValues.palette.grey[900],
    },
    ambient: {
      rippleWhite: themeValues.palette.ambient.rippleWhite,
      rippleBlue: themeValues.palette.ambient.rippleBlue,
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
      default: themeValues.palette.utility.white,
      paper: themeValues.palette.nature.whisper,
    },
    text: {
      primary: themeValues.palette.blue.darkest,
      secondary: themeValues.palette.blue.medium,
      disabled: themeValues.palette.blue.light,
    },
    action: {
      hover: themeValues.palette.blue.medium,
      selected: themeValues.palette.blue.light,
      disabled: themeValues.palette.blue.light,
      disabledBackground: themeValues.palette.nature.whisper,
    },
    divider: themeValues.palette.nature.sage,
  },
  // Type family, sizes, and weights
  typography: {
    fontFamily: themeValues.fontFamily.neueHaasText,
    htmlFontSize: 16,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: themeValues.fontFamily[H1_FONT],
      fontSize: typeScale.h1,
      fontWeight: 500,
      lineHeight: 0.85,
    },
    h2: {
      fontFamily: themeValues.fontFamily.gtSuperText,
      fontSize: typeScale.h2,
      fontWeight: 500,
      lineHeight: 1.05,
    },
    h3: {
      fontFamily: themeValues.fontFamily.gtSuperText,
      fontSize: typeScale.h3,
      fontWeight: 500,
      lineHeight: 1.1,
    },
    h4: {
      fontFamily: themeValues.fontFamily.gtSuperText,
      fontSize: typeScale.h4,
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h5: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.h5,
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h6: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.h6,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.baseBody,
      fontWeight: 400,
      letterSpacing: "unset",
      lineHeight: 1.6, // 1.6 ratio for comfortable reading
    },
    body2: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.smallBody,
      fontWeight: 400,
      letterSpacing: "unset",
      lineHeight: 1.6, // Consistent line height ratio
    },
    subtitle1: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.baseBody, // 1.25rem - matches body1 for consistency
      fontWeight: 500, // Medium weight to distinguish from body
      letterSpacing: "normal",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.smallBody, // 1.125rem - matches body2 for consistency
      fontWeight: 500, // Medium weight to distinguish from body
      letterSpacing: "normal",
      lineHeight: 1.6,
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
        @import url("https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap");
        
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
        
        /* Crimson Text Font */
        @font-face {
          font-family: 'Crimson Text';
          src: url('https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJfbwhT.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Crimson Text';
          src: url('https://fonts.gstatic.com/s/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJX1C1GA9c.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Crimson Text';
          src: url('https://fonts.gstatic.com/s/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJX1C1GA9c.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        /* PP Eiko Font Family */
        @font-face {
          font-family: 'PP Eiko';
          src: url('/fonts/PP Eiko-Free For Personal Use v2.0/PPEiko-Thin.otf') format('opentype');
          font-weight: 100;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Eiko';
          src: url('/fonts/PP Eiko-Free For Personal Use v2.0/PPEiko-Medium.otf') format('opentype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Eiko';
          src: url('/fonts/PP Eiko-Free For Personal Use v2.0/PPEiko-Heavy.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        /* PP Fragment Sans Font Family */
        @font-face {
          font-family: 'PP Fragment Sans';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-SansLight.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Fragment Sans';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-SansRegular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Fragment Sans';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-SansExtraBold.otf') format('opentype');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        /* PP Fragment Serif Font Family */
        @font-face {
          font-family: 'PP Fragment Serif';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-SerifLight.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Fragment Serif';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-SerifRegular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Fragment Serif';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-SerifExtraBold.otf') format('opentype');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        /* PP Fragment Glare Font Family */
        @font-face {
          font-family: 'PP Fragment Glare';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-GlareLight.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Fragment Glare';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-GlareRegular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Fragment Glare';
          src: url('/fonts/PP Fragment - Free for Personal Use v2.0/otf/PPFragment-GlareExtraBold.otf') format('opentype');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        /* PP Kyoto Font Family */
        @font-face {
          font-family: 'PP Kyoto';
          src: url('/fonts/PP Kyoto - Free for Personal Use v1.0/otf/PPKyoto-Thin.otf') format('opentype');
          font-weight: 100;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Kyoto';
          src: url('/fonts/PP Kyoto - Free for Personal Use v1.0/otf/PPKyoto-Light.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Kyoto';
          src: url('/fonts/PP Kyoto - Free for Personal Use v1.0/otf/PPKyoto-Medium.otf') format('opentype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Kyoto';
          src: url('/fonts/PP Kyoto - Free for Personal Use v1.0/otf/PPKyoto-Extrabold.otf') format('opentype');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        /* PP Object Sans Font Family */
        @font-face {
          font-family: 'PP Object Sans';
          src: url('/fonts/PP Object Sans - Free for personal use v2.3/PPObjectSans-Regular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'PP Object Sans';
          src: url('/fonts/PP Object Sans - Free for personal use v2.3/PPObjectSans-Heavy.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        /* GT Super Display Font Family */
        @font-face {
          font-family: 'GT Super Display';
          src: url('/fonts/GT-Super-Display-Light-Trial.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Display';
          src: url('/fonts/GT-Super-Display-Regular-Trial.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Display';
          src: url('/fonts/GT-Super-Display-Medium-Trial.otf') format('opentype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Display';
          src: url('/fonts/GT-Super-Display-Bold-Trial.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Display';
          src: url('/fonts/GT-Super-Display-Super-Trial.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        /* GT Super Text Font Family */
        @font-face {
          font-family: 'GT Super Text';
          src: url('/fonts/GT-Super-Text-Book-Trial.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Text';
          src: url('/fonts/GT-Super-Text-Regular-Trial.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Text';
          src: url('/fonts/GT-Super-Text-Medium-Trial.otf') format('opentype');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Text';
          src: url('/fonts/GT-Super-Text-Bold-Trial.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'GT Super Text';
          src: url('/fonts/GT-Super-Text-Black-Trial.otf') format('opentype');
          font-weight: 900;
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
          font-family: ${themeValues.fontFamily.neueHaasText}
          overflow-x: hidden; /* Prevent horizontal scrollbar */
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: ${themeValues.fontFamily.neueHaasText}
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
            backgroundColor: theme.palette.blue.darkest,
            "&:hover": {
              backgroundColor: theme.palette.blue.dark,
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
            marginBottom: theme.spacing(4),
          }),
        },
        {
          props: { variant: "h2" },
          style: ({ theme }) => ({
            marginBottom: theme.spacing(2.5),
          }),
        },
      ],
    },
    MuiCheckbox: {
      styleOverrides: {
        root: ({ theme }) => ({
          // Custom elegant square checkbox (matches similar dropdown "checkbox")
          width: "20px !important",
          height: "20px !important",
          minWidth: "20px !important", // Prevent shrinking
          maxWidth: "20px !important", // Prevent growing
          flexShrink: 0, // Don't shrink in flex containers
          borderRadius: "2px",
          border: `1px solid ${theme.palette.text.primary}`,
          backgroundColor: "transparent",
          padding: "0",
          margin: theme.spacing(0.5),
          marginTop: "0px", // Align with first line baseline
          verticalAlign: "super", // Superscript alignment (raised)
          transition: "all 0.2s ease",
          position: "relative",
          display: "inline-block",
          cursor: "pointer",
          boxSizing: "border-box", // Ensure border is included in dimensions
          filter: "none !important", // Ensure no additional filters
          backdropFilter: "none !important", // Ensure no backdrop filter on the element itself
          "&:hover": {
            backgroundColor: `${theme.palette.action.hover}30`,
          },
          "&.Mui-checked": {
            backgroundColor: theme.palette.blue.darkest, // Fill with dark blue when checked
            borderColor: theme.palette.blue.darkest,
          },
          // Remove ripple animation
          "& .MuiTouchRipple-root": {
            display: "none",
          },
          // Hide the default MUI SVG and replace with custom checkmark
          "& .MuiSvgIcon-root": {
            display: "none !important", // Force hide default checkbox SVG
            width: "0 !important",
            height: "0 !important",
          },
          // Hide MUI's internal input element
          "& input[type='checkbox']": {
            display: "none !important",
          },
          // Custom checkmark using CSS - centered in inline-block
          "&.Mui-checked::after": {
            content: '"✓"',
            position: "absolute",
            color: theme.palette.common.white,
            fontSize: "12px",
            fontWeight: "bold",
            lineHeight: "18px", // height minus border
            textAlign: "center",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
          },
        }),
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: ({ theme }) => ({
          // Custom elegant circular radio button - systematic baseline alignment
          width: "20px !important",
          height: "20px !important",
          minWidth: "20px !important", // Prevent shrinking
          maxWidth: "20px !important", // Prevent growing
          flexShrink: 0, // Don't shrink in flex containers
          borderRadius: "50%", // Circular for radio buttons
          border: `1px solid ${theme.palette.text.primary}`,
          backgroundColor: "transparent",
          padding: "0",
          margin: theme.spacing(0.5),
          marginTop: "0px", // Align with first line baseline
          verticalAlign: "super", // Superscript alignment (raised)
          transition: "all 0.2s ease",
          position: "relative",
          display: "inline-block",
          cursor: "pointer",
          boxSizing: "border-box", // Ensure border is included in dimensions
          "&:hover": {
            backgroundColor: `${theme.palette.action.hover}30`,
          },
          "&.Mui-checked": {
            backgroundColor: theme.palette.blue.darkest, // Fill with dark blue when checked
            borderColor: theme.palette.blue.darkest,
          },
          // Remove ripple animation
          "& .MuiTouchRipple-root": {
            display: "none",
          },
          // Hide the default MUI SVG and replace with custom dot
          "& .MuiSvgIcon-root": {
            display: "none", // Hide default radio SVG
          },
          // Custom dot using CSS - centered in inline-block
          "&.Mui-checked::after": {
            content: '""',
            position: "absolute",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: theme.palette.common.white,
            top: "7px", // (20px - 6px) / 2 = 7px
            left: "7px", // (20px - 6px) / 2 = 7px
          },
        }),
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          margin: 0, // Remove default margins for condensed spacing
          alignItems: "flex-start", // Align checkbox with first line of text
          "& .MuiFormControlLabel-label": {
            fontSize: "0.95rem", // Slightly smaller text
            lineHeight: 1.3, // Tighter line height
            color: theme.palette.text.primary,
            paddingLeft: theme.spacing(0.5), // Reduced gap between checkbox and label
          },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: "auto", // Reduce default height
        },
        indicator: ({ theme }) => ({
          backgroundColor: theme.palette.action.hover, // Blue indicator for active tab
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary, // Default dark blue text for inactive tabs
          fontSize: "0.95rem",
          fontWeight: 400,
          textTransform: "none",
          minWidth: "auto",
          minHeight: "auto",
          padding: theme.spacing(1, 2),
          "&.Mui-selected": {
            color: theme.palette.action.hover, // Bright blue text for selected tab
            fontWeight: 500,
          },
          "&:hover": {
            color: theme.palette.action.hover, // Bright blue on hover
          },
          // Remove click ripple animation
          "& .MuiTouchRipple-root": {
            display: "none",
          },
        }),
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 300, // Slight delay before showing (prevents accidental triggers)
        leaveDelay: 200, // Delay before hiding (gives time to move cursor)
        enterNextDelay: 100, // Faster subsequent tooltips
      },
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.common.white,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.action.hover}`,
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "0.875rem",
          fontWeight: 400,
          lineHeight: 1.4,
          padding: "16px",
          maxWidth: "300px",
          // Add pointer events so tooltip can be hovered
          pointerEvents: "auto",
        }),
        arrow: ({ theme }) => ({
          color: theme.palette.common.white,
          "&::before": {
            border: `1px solid ${theme.palette.action.hover}`,
          },
        }),
        // Create a safe area between trigger and tooltip
        popper: {
          '&[data-popper-placement*="top"]': {
            "& .MuiTooltip-tooltip": {
              marginBottom: "6px",
            },
          },
          '&[data-popper-placement*="bottom"]': {
            "& .MuiTooltip-tooltip": {
              marginTop: "6px",
            },
          },
          '&[data-popper-placement*="left"]': {
            "& .MuiTooltip-tooltip": {
              marginRight: "6px",
            },
          },
          '&[data-popper-placement*="right"]': {
            "& .MuiTooltip-tooltip": {
              marginLeft: "6px",
            },
          },
        },
      },
    },
  },
  mixins: {
    ...baseTheme.mixins,
    hoverParagraph: hoverParagraphMixin,
    hoverParagraphDarkened: hoverParagraphDarkenedMixin,
    drawerContent: drawerContentMixins,
    scenarioCardList: scenarioCardListMixin,
    tooltipActionButton: tooltipActionButtonMixin,
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

// expose mixin constants for easy import if needed
export const hoverParagraph = hoverParagraphMixin
export const scenarioCardList = scenarioCardListMixin
export const tooltipActionButton = tooltipActionButtonMixin

export default theme

/* ========================================================
 4. TypeScript customizations
 ======================================================== */

// Custom palette colors and theme properties
declare module "@mui/material/styles" {
  // Custom palette colors - California Water Theme
  interface Palette {
    brand: {
      sky: string
      water: string
    }
    blue: {
      darkest: string
      dark: string
      medium: string
      bright: string
      light: string
    }
    accent: {
      gold: string
      cream: string
    }
    nature: {
      teal: string
      sage: string
      mint: string
      whisper: string
    }
    utility: {
      white: string
      black: string
    }

    ambient: {
      rippleWhite: string
      rippleBlue: string
    }

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
    brand?: {
      sky?: string
      water?: string
    }
    blue?: {
      darkest?: string
      dark?: string
      medium?: string
      bright?: string
      light?: string
    }
    accent?: {
      gold?: string
      cream?: string
    }
    nature?: {
      teal?: string
      sage?: string
      mint?: string
      whisper?: string
    }
    utility?: {
      white?: string
      black?: string
    }

    ambient?: {
      rippleWhite?: string
      rippleBlue?: string
    }

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
        glossaryWidth: number
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
    scenarioCardList: typeof scenarioCardListMixin
    tooltipActionButton: typeof tooltipActionButtonMixin
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
