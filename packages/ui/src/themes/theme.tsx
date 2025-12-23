import { createTheme, Theme } from "@mui/material/styles"

/* ========================================================
 * COEQWAL MUI THEME
 * ========================================================
 *
 * TABLE OF CONTENTS
 * -----------------
 * 0. Font Config     - Font presets and active font selection
 * 1. themeValues     - Design tokens:
 *    (Core tokens)   - typeScale, fontFamily, typography
 *                    - palette (brand, blue, accent, nature, utility, tiers)
 *                    - layout, borderRadius, shadow, transition, zIndex
 *    (UI config)     - cards (typography, spacing)
 *                    - scenario interfaces (grid, icon, outcome styles)
 * 2. Mixins          - Reusable style patterns
 * 3. createTheme()   - MUI theme
 * 4. Post-creation   - Custom properties added to theme object:
 *                    - borders
 *                    - background (transparent, paragraph, overlay)
 *                    - borderRadius, shadow, transition, cards, scenarios
 * 5. TypeScript      - Module augmentation for custom theme properties
 */

/* ===============================================================================
 * FONT CONFIGURATION SYSTEM
 * ===============================================================================
 *
 * To switch fonts, change ACTIVE_FONT_PRESET below to one of the available presets.
 * Each preset defines: text (body), display (headlines), and cssImport (font loading).
 * Of course you can make more presets.
 *
 * Available presets: "neueHaas" | "roboto" | "inter" | "system"
 */

type FontPresetKey = "neueHaas" | "roboto" | "inter" | "system"

const ACTIVE_FONT_PRESET: FontPresetKey = "neueHaas" // CHANGE THIS TO SWITCH FONTS SITEWIDE

const FONT_PRESETS = {
  neueHaas: {
    text: '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display:
      '"neue-haas-grotesk-display", "neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    cssImport: '@import url("https://use.typekit.net/rxm7kha.css");',
  },
  roboto: {
    text: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    display:
      '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    cssImport:
      '@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap");',
  },
  inter: {
    text: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    cssImport:
      '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");',
  },
  system: {
    text: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    cssImport: "", // No import needed for system fonts
  },
} as const

const activeFont = FONT_PRESETS[ACTIVE_FONT_PRESET]

/* ========================================================
 * 1. themeValues - Design tokens
 * ======================================================== */

const typeScale = {
  // Headline sizes using Perfect Fourth ratio (1.333)
  h1: "5.8rem", // 92.8px - Hero size
  h2: "4.35rem", // 69.6px - Major section headers
  h3: "3.26rem", // 52.2px - Subsection headers
  h4: "2.45rem", // 39.2px - Card titles
  h5: "1.84rem", // 29.4px - Minor headlines
  h6: "1.38rem", // 22.1px - Section headers

  // Compact UI typography for dialogs, tooltips, form labels
  compact: {
    title: "0.9rem", // 14.4px
    subtitle: "0.8rem", // 12.8px
    caption: "0.75rem", // 12px
    micro: "0.7rem", // 11.2px (form helpers)
  },
}

// themeValues - runtime values for custom theme properties
export const themeValues = {
  // Typography (uses active font preset. Change ACTIVE_FONT_PRESET above to switch.)
  fontFamily: {
    text: activeFont.text,
    display: activeFont.display,
  },

  // Layout dimensions, for layout and layout calculations
  layout: {
    headerHeight: 70,
    drawer: {
      width: 360,
      closedWidth: 60,
      glossaryWidth: 360,
    },
    textContainer: {
      maxWidth: "600px",
    },
    // Compact control dimensions for UI elements
    controls: {
      standard: 20, // Standard form control size (20px × 20px)
      compact: 16, // Compact form control size (16px × 16px)
      micro: 12, // Micro form control size (12px × 12px)
    },
    // Spacer component spacing system - responsive values for section spacing
    spacer: {
      small: { xs: 24, md: 48, lg: 64 },
      medium: { xs: 48, md: 96 },
      large: { xs: 100, lg: 0 },
    },
  },

  // Color palette
  palette: {
    // Core colors
    brand: {
      sky: "#92C1D5", // Top of gradient - sky blue
      water: "#64A4D6", // Bottom of gradient - water blue
    },

    // Text and UI blues
    blue: {
      darkest: "#3a4574", // Deep navy - primary text (TODO: is this too purple? should it be #2A5287 ?)
      dark: "#186b88", // Dark teal
      medium: "#2d89b6", // Medium blue (a beautiful blue FWIW)
      bright: "#449cd9", // Bright blue - links/interactive
      light: "#77a2d9", // Light blue
      pale: "#cef1f5", // Pale cyan/ice blue
    },

    text: {
      default: "#fffff", // This is a mui default; TODO: change it to our text.primary
    },

    // Accent colors - warm tones
    accent: {
      gold: "#ffd87e", // Golden yellow - highlights
      orange: "#FFA200",
      alert: "#E54545",
    },

    // Greens
    nature: {
      earth: "#9ABD3D",
      forest: "#7b9d3f", // Forest green - for saved scenarios tab
    },

    // Utility colors
    utility: {
      white: "#FFFFFF",
      black: "#000000",
    },

    // MUI greys
    grey: {
      50: "#f7fafc", // Very light grey for background hovers
      100: "#edf2f7",
      200: "#e2e8f0",
      300: "#cbd5e0",
      400: "#a0aec0",
      500: "#718096",
      600: "#4a5568", // Dark grey for ui text
      700: "#2d3748",
      800: "#1a202c",
      900: "#171923",
    },

    // Ambient/mood elements
    ambient: {
      rippleWhite: "rgba(255, 255, 255, 0.16)", // Water bubbles - white at 16% opacity
      rippleBlue: "rgba(42, 82, 135, 0.16)", // Water bubbles - blue (#2A5287) at 16% opacity
    },

    // Header and UI overlay colors
    overlay: {
      water: "rgba(42, 82, 135, 0.2)", // Semi-transparent blue for header and UI elements
      waterLight: "rgba(42, 82, 135, 0.1)", // Lighter variant for overlapping dividers and borders
    },

    // Outcome tier colors
    tiers: {
      tier1: "#7b9d3f", // Green, tier 1
      tier2: "#60aacb", // Blue, tier 2
      tier3: "#FFB347", // Orange, tier 3
      tier4: "#CD5C5C", // Red, tier 4
    },

    // Tab panel colors
    tabPanels: {
      learn: "#68C3CE",
      explore: "#F4BF4D",
      empower: "#9EC33B",
    },
  },

  // Border radius values
  borderRadius: {
    none: "0px", // Flat edges, no rounding
    xs: "2px", // Very small (checkboxes, tiny indicators)
    sm: "4px", // Small (input fields, tags)
    md: "8px", // Standard (cards, panels, tooltips)
    pill: "999px", // Full pill/capsule shape
    circle: "50%", // Perfect circles
  },


  // Shadow - unified elevation system (singular to avoid conflict with MUI's shadows[])
  shadow: {
    none: "none",
    subtle: "0 1px 3px rgba(0,0,0,0.12)", // Light cards, inputs
    sm: "0 2px 4px rgba(0,0,0,0.15)", // Elevated cards, panels
    md: "0 4px 12px rgba(0,0,0,0.15)", // Dropdowns, tooltips, overlays
    lg: "0 8px 24px rgba(0,0,0,0.2)", // Modals, large panels
    focus: "0 0 0 3px rgba(33, 150, 243, 0.25)", // Focus ring (blue)
  },

  // Transition - unified animation timing
  transition: {
    // Durations
    fast: "0.15s", // Fast feedback, hover, clicks
    standard: "0.3s", // Panel, layout changes
    slow: "0.5s", // Page animations

    // Complete transition strings
    default: "all 0.3s ease",
    quick: "all 0.15s ease",
    fade: "opacity 0.3s ease-out",
    color: "color 0.3s ease",
    layout: "width 0.3s ease-in-out",
    bouncy: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Z-index values
  zIndex: {
    // Background layers
    basement: -1, // Storyline apps map background
    persistentMap: 1, // Main app's persistent map

    // Content layers
    pageContent: 10, // Page-level content
    mapControls: 20, // Map overlay stuff

    // UI layers
    floating: 70, // Floating elements (glossary)
    uiOverlay: 80, // Header, sticky tabs
    dropdown: 90, // Dropdown menus (above header)
    tooltip: 100, // Tooltips and help text
    modal: 110, // Modal dialogs (reserved)
  },

  /* --------------------------------------------------------
   * App-specific UI configuration
   * Styles for specific features (cards, scenarios)
   * -------------------------------------------------------- */

  // Card typography and spacing system
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
        fontSize: "0.95rem", // compact card body text
        lineHeight: 1.5,
        fontWeight: 400,
      },
      caption: {
        fontSize: "0.95rem", // compact card captions
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
      standard: 3, // 24px - standardized spacing unit
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
      // Compact spacing for cards, dialogs, tooltips, form controls
      compact: {
        xs: 0.25, // 2px
        sm: 0.5, // 4px
        md: 1, // 8px
        lg: 1.5, // 12px
        xl: 2, // 16px
      },
    },
  },

  /* --------------------------------------------------------
   * Scenario/Strategy component styles
   * Used across Learn map and Scenario Explorer
   * -------------------------------------------------------- */
  scenarios: {
    // Strategy card row styles
    card: {
      base: {
        borderRadius: "8px", // theme.borderRadius.md
        padding: 1.5, // theme.spacing multiplier
        transition: "all 0.3s ease", // themeValues.transition.default
        border: "2px solid transparent",
      },
      variants: {
        default: {
          backgroundColor: "#faf8f5",
        },
        highlighted: {
          backgroundColor: "#ffffff",
        },
      },
      states: {
        hover: {
          backgroundColor: "#ffffff",
        },
        selected: {
          borderColor: "#449cd9", // theme.palette.blue.bright
        },
      },
    },

    // Icon sizes for strategy operations
    icon: {
      sizes: {
        sm: 3.5, // theme.spacing multiplier (28px)
        md: 4, // 32px
        lg: 5, // 40px
      },
    },

    // Outcome visualization box
    outcome: {
      box: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 0.5,
        borderRadius: "8px",
        transition: "all 0.3s ease", // themeValues.transition.default
        backgroundColor: "transparent",
        border: "2px solid transparent",
      },
      states: {
        active: { opacity: 1 },
        inactive: { opacity: 0.7 },
        selected: { borderColor: "#449cd9" },
        hover: { backgroundColor: "#f7fafc" }, // grey[50]
      },
      label: {
        textAlign: "center",
        whiteSpace: "pre-line",
      },
    },

    // Grid layout configuration
    grid: {
      columns: {
        xs: "32px minmax(0, 1fr) auto",
        lg: "32px minmax(0, 0.8fr) auto minmax(0, 2fr)",
      },
      gap: {
        default: 1,
        compact: 2,
      },
    },
  },
}

/* ========================================================
 * 2. Mixins - Reusable style patterns
 * ======================================================== */

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
    transition: "all 0.3s ease", // themeValues.transition.default
    "&:hover": {
      bgcolor: "rgba(0, 0, 0, 0.05)",
      transform: "translateX(4px)",
    },
  },
  selectedItemBox: {
    bgcolor: "rgba(0, 0, 0, 0.08)",
    boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.1)", // Select focus ring
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
 * 3. createTheme() - MUI theme configuration
 * ======================================================== */

const baseTheme = createTheme()

// Helper to create border strings

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
  // Custom layout values and responsive spacing system
  layout: {
    ...themeValues.layout,
    // Responsive layout spacing for major components and sections
    spacing: {
      xs: { xs: 1, sm: 1.5, md: 2 }, // 8px / 12px / 16px
      sm: { xs: 1.5, sm: 2, md: 2.5 }, // 12px / 16px / 20px
      md: { xs: 2, sm: 2.5, md: 3 }, // 16px / 20px / 24px
      lg: { xs: 2.5, sm: 3, md: 4 }, // 20px / 24px / 32px
      xl: { xs: 3, sm: 4, md: 5 }, // 24px / 32px / 40px
      xxl: { xs: 4, sm: 5, md: 6 }, // 32px / 40px / 48px
    },
  },
  // Custom breakpoints
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  // Card typography and spacing (from themeValues)
  cards: themeValues.cards,
  // Palette - California Water theme (MUI integration)
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
      pale: themeValues.palette.blue.pale,
    },
    accent: {
      gold: themeValues.palette.accent.gold,
      orange: themeValues.palette.accent.orange,
      alert: themeValues.palette.accent.alert,
    },
    nature: {
      earth: themeValues.palette.nature.earth,
      forest: themeValues.palette.nature.forest,
    },
    learn: {
      background: themeValues.palette.tabPanels.learn,
      text: themeValues.palette.utility.white,
    },
    explore: {
      background: themeValues.palette.tabPanels.explore,
      text: themeValues.palette.utility.white,
    },
    empower: {
      background: themeValues.palette.tabPanels.empower,
      text: themeValues.palette.utility.white,
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

    overlay: {
      water: themeValues.palette.overlay.water,
      waterLight: themeValues.palette.overlay.waterLight,
    },

    tiers: {
      tier1: themeValues.palette.tiers.tier1,
      tier2: themeValues.palette.tiers.tier2,
      tier3: themeValues.palette.tiers.tier3,
      tier4: themeValues.palette.tiers.tier4,
    },
    background: {
      default: themeValues.palette.utility.white,
      paper: themeValues.palette.utility.white,
    },
    text: {
      primary: themeValues.palette.blue.darkest,
      secondary: themeValues.palette.utility.white,
      disabled: themeValues.palette.blue.light,
    },
    action: {
      hover: themeValues.palette.grey[100], // Light grey hover background for interactive elements
      selected: themeValues.palette.blue.light,
      disabled: themeValues.palette.blue.light,
      disabledBackground: themeValues.palette.utility.white,
    },
    // Colors for interactive elements
    interaction: {
      hoverBackground: themeValues.palette.grey[100], // Same light grey hover background for interactive elements
    },
    divider: themeValues.palette.grey[400],
  },
  // Type family, sizes, and weights
  typography: {
    fontFamily: themeValues.fontFamily.text,
    htmlFontSize: 16,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: themeValues.fontFamily.display,
      fontSize: typeScale.h1,
      fontWeight: 500,
      lineHeight: 1.0, // Tighter for large hero text
      // textTransform: "uppercase",
    },
    h2: {
      fontFamily: themeValues.fontFamily.display,
      fontSize: typeScale.h2,
      fontWeight: 500,
      lineHeight: 1.1, // Slightly tighter for section headers
    },
    h3: {
      fontFamily: themeValues.fontFamily.display,
      fontSize: typeScale.h3,
      fontWeight: 500,
      lineHeight: 1.15, // Balanced for subsection headers
    },
    h4: {
      fontFamily: themeValues.fontFamily.text,
      fontSize: typeScale.h4,
      fontWeight: 400,
      lineHeight: 1.25, // Slightly more open for card titles
    },
    h5: {
      fontFamily: themeValues.fontFamily.display,
      fontSize: typeScale.h5,
      fontWeight: 500,
      letterSpacing: "0.02em",
      lineHeight: 1.35, // Good balance for minor headlines
    },
    h6: {
      fontFamily: themeValues.fontFamily.display,
      fontSize: typeScale.h6,
      fontWeight: 600,
      lineHeight: 1,
    },
    body1: {
      fontFamily: themeValues.fontFamily.text,
      fontSize: "1.125rem", // 18px - primary body text
      fontWeight: 400,
      lineHeight: 1.5, // 1.5x ratio (27px at 18px font size)
    },
    body2: {
      fontFamily: themeValues.fontFamily.text,
      fontSize: "1rem", // 16px - dashboard interface text
      fontWeight: 400,
      letterSpacing: "unset",
      lineHeight: 1.5,
    },
    subtitle1: {
      fontFamily: themeValues.fontFamily.text,
      fontSize: "1.25rem", // 20px
      fontWeight: 500,
      letterSpacing: "normal",
      lineHeight: 1.4,
    },
    subtitle2: {
      fontFamily: themeValues.fontFamily.text,
      fontSize: "1rem",
      fontWeight: 500,
      letterSpacing: "normal",
      lineHeight: 1.6,
    },
    button: {
      fontSize: "1rem", // 16px for top-level UI elements
      letterSpacing: "normal",
      fontWeight: 500,
      textTransform: "none",
    },
    caption: {
      fontSize: "1rem", // align with body2 (dashboard interface size)
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
    // Compact typography variants for dialogs, tooltips, form labels
    compact: {
      title: {
        fontSize: typeScale.compact.title, // 0.9rem
        fontWeight: 500,
        lineHeight: 1.4,
      },
      subtitle: {
        fontSize: typeScale.compact.subtitle, // 0.8rem
        fontWeight: 400,
        lineHeight: 1.4,
      },
      caption: {
        fontSize: typeScale.compact.caption, // 0.75rem
        fontWeight: 400,
        lineHeight: 1.3,
      },
      micro: {
        fontSize: typeScale.compact.micro, // 0.7rem
        fontWeight: 400,
        lineHeight: 1.3,
      },
    },
  },
  shape: {
    borderRadius: parseInt(themeValues.borderRadius.md, 10),
  },
  // Z-index
  zIndex: themeValues.zIndex,
  // Components customizations
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        ${activeFont.cssImport}
                
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
          -webkit-tap-highlight-color: transparent;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: ${themeValues.fontFamily.text}
          overflow-x: hidden; /* Prevent horizontal scrollbar */
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-family: ${themeValues.fontFamily.text}
        }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: "transparent",
          borderBottom: "none",
          color: theme.palette.text.secondary,
          borderRadius: theme.borderRadius.none,
          boxShadow: "none",
        }),
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "3px",
          textDecoration: "none",
          boxShadow: themeValues.shadow.md,
        },
      },
    },

    MuiCardActionArea: {
      styleOverrides: {
        root: {
          // keep MUI's focus ring behavior sane
          borderRadius: "3px",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          // optional: if you want CardContent to inherit link styling cleanly
          textDecoration: "inherit",
        },
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
            border: theme.border.medium,
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
          }),
        },
        {
          props: { variant: "pill" },
          style: ({ theme }) => ({
            border: theme.border.medium,
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
          }),
        },
        {
          props: { variant: "standard" },
          style: ({ theme }) => ({
            textTransform: "none",
            borderRadius: theme.borderRadius.pill,
            boxShadow: "none",
            border: "none",
            padding: "6px 16px",
            minWidth: 64,
            lineHeight: 1.75,
            fontSize: "1rem",
            fontWeight: 400,
            color: theme.palette.common.white,
            backgroundColor: theme.palette.overlay.water,
            "&:hover": {
              backgroundColor: theme.palette.common.white,
              color: theme.palette.blue.darkest,
              opacity: 1,
            },
          }),
        },
        {
          props: { variant: "text" },
          style: {
            textTransform: "none",
          },
        },
        {
          props: { variant: "actionCard" },
          style: ({ theme }) => ({
            textTransform: "none",
            borderRadius: theme.borderRadius.md,
            boxShadow: "none",
            border: "none",
            padding: "16px",
            fontSize: "0.95rem",
            fontWeight: 400,
            textAlign: "center",
            transition: "all 0.3s ease", // themeValues.transition.default
            // Default active state - using grey colors
            backgroundColor: theme.palette.grey[200],
            color: theme.palette.text.disabled,
            "&:hover": {
              backgroundColor: theme.palette.blue.bright,
              color: theme.palette.common.white,
            },
            // Disabled state - same as active but with not-allowed cursor
            "&:disabled": {
              backgroundColor: theme.palette.grey[200],
              color: theme.palette.text.disabled,
              cursor: "not-allowed",
              "&:hover": {
                backgroundColor: theme.palette.grey[200],
              },
            },
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
          backgroundColor: theme.palette.common.white,
          "& .MuiOutlinedInput-notchedOutline": {
            border: theme.border.medium,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            border: theme.border.medium,
          },
          "&.Mui-focused": {
            backgroundColor: theme.palette.common.white, // Maintain white background when focused
          },
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: ({ theme }) => ({
          backgroundColor: theme.palette.common.white,
          "&.Mui-focused": {
            backgroundColor: theme.palette.common.white,
          },
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.common.white,
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-root": {
            backgroundColor: theme.palette.common.white,
            "&.Mui-focused": {
              backgroundColor: theme.palette.common.white,
            },
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
              zIndex: theme.zIndex.floating,

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
                borderRadius: theme.borderRadius.md,
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
                  boxShadow: themeValues.shadow.sm,
                },
                "&:active": {
                  transform: "translateY(0px)",
                  boxShadow: themeValues.shadow.subtle,
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
          fontSize: "0.95rem",
          fontWeight: 500,
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "transparent",
          },
          "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.common.white,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.common.white,
            },
          },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": {
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.borderRadius.md,
          // Ensure dropdown panels and menus have white backgrounds
          "&.MuiMenu-paper, &.MuiSelect-paper": {
            backgroundColor: theme.palette.common.white,
          },
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
          // Custom square checkbox
          width: `${themeValues.layout.controls.standard}px !important`,
          height: `${themeValues.layout.controls.standard}px !important`,
          minWidth: `${themeValues.layout.controls.standard}px !important`,
          maxWidth: `${themeValues.layout.controls.standard}px !important`,
          flexShrink: 0,
          backgroundColor: "transparent",
          padding: "0",
          alignSelf: "flex-start",
          transform: "translateY(-3px)",
          transition: "all 0.3s ease", // themeValues.transition.default
          position: "relative",
          display: "inline-block",
          boxSizing: "border-box",
          borderRadius: theme.borderRadius.xs,
          border: `2px solid ${theme.palette.text.primary}`,
          margin: theme.spacing(0.5),
          cursor: "pointer",
          "&:hover": {
            backgroundColor: `${theme.palette.action.hover}30`,
          },
          "&.Mui-checked": {
            backgroundColor: theme.palette.blue.darkest,
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
          // Custom circular radio button
          width: `${themeValues.layout.controls.standard}px !important`,
          height: `${themeValues.layout.controls.standard}px !important`,
          minWidth: `${themeValues.layout.controls.standard}px !important`,
          maxWidth: `${themeValues.layout.controls.standard}px !important`,
          flexShrink: 0,
          backgroundColor: "transparent",
          padding: "0",
          alignSelf: "flex-start",
          transform: "translateY(-3px)",
          transition: "all 0.3s ease", // themeValues.transition.default
          position: "relative",
          display: "inline-block",
          boxSizing: "border-box",
          borderRadius: theme.borderRadius.circle,
          border: `1px solid ${theme.palette.text.primary}`,
          margin: theme.spacing(0.5),
          cursor: "pointer",
          "&:hover": {
            backgroundColor: `${theme.palette.action.hover}30`,
          },
          "&.Mui-checked": {
            backgroundColor: theme.palette.blue.darkest,
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
            borderRadius: theme.borderRadius.circle,
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
            fontSize: "0.95rem",
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
          backgroundColor: theme.palette.action.hover,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
          fontSize: "0.95rem",
          fontWeight: 400,
          textTransform: "none",
          minWidth: "auto",
          minHeight: "auto",
          padding: theme.spacing(1, 2),
          "&.Mui-selected": {
            color: theme.palette.action.hover,
            fontWeight: 500,
          },
          "&:hover": {
            color: theme.palette.action.hover,
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
          borderRadius: theme.borderRadius.md,
          boxShadow: themeValues.shadow.md,
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
    drawerContent: drawerContentMixins,
  },
})

/* ========================================================
 * 4. Post-creation - Custom theme properties
 * ======================================================== */

// Border styles - complete values ready to use
theme.border = {
  none: "none",
  light: `1px solid ${theme.palette.grey[200]}`, // Subtle/light borders
  medium: `1px solid ${theme.palette.grey[300]}`, // Standard borders (most common)
  focus: `2px solid ${theme.palette.blue.bright}`, // Selected/focus states
  focusLight: `1px solid ${theme.palette.blue.light}`, // Lighter blue accent
  highlight: `3px solid ${theme.palette.blue.bright}`, // Strong highlight (selected items)
  onDark: `2px solid ${theme.palette.common.white}`, // On dark backgrounds
  subtleOutline: "1px solid rgba(255, 255, 255, 0.3)", // Semi-transparent white outline

  // CSS triangle arrow technique: zero-size box with transparent borders,
  // then set one side's color to create a triangle pointing opposite direction.
  // Example: borderLeftColor: white → arrow points right
  arrowBase: "8px solid transparent",
}

theme.background = {
  transparent: "transparent",
  paragraph: "rgba(0, 0, 0, 0.4)",
  overlay: {
    light: "rgba(0, 0, 0, 0.2)",
    medium: "rgba(0, 0, 0, 0.4)",
    dark: "rgba(0, 0, 0, 0.8)",
  },
}

theme.borderRadius = themeValues.borderRadius

theme.shadow = themeValues.shadow

theme.transition = themeValues.transition

// Scenario/strategy component styles
theme.scenarios = themeValues.scenarios

export default theme

/* ========================================================
 * 5. TypeScript
 * ======================================================== */

/**
 * MUI Theme Type Augmentation
 *
 * Types are derived from `themeValues` using `typeof` to maintain a single source of truth.
 * This reduces duplication while preserving full TypeScript autocomplete support.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/typeof-types.html
 */
declare module "@mui/material/styles" {
  // Custom palette colors - derived from themeValues.palette
  interface Palette {
    interaction: { hoverBackground: string }
    brand: typeof themeValues.palette.brand
    blue: typeof themeValues.palette.blue
    accent: typeof themeValues.palette.accent
    nature: typeof themeValues.palette.nature
    learn: { background: string; text: string }
    explore: { background: string; text: string }
    empower: { background: string; text: string }
    utility: typeof themeValues.palette.utility
    ambient: typeof themeValues.palette.ambient
    overlay: typeof themeValues.palette.overlay
    tiers: typeof themeValues.palette.tiers
  }

  interface PaletteOptions {
    interaction?: { hoverBackground?: string }
    brand?: Partial<typeof themeValues.palette.brand>
    blue?: Partial<typeof themeValues.palette.blue>
    accent?: Partial<typeof themeValues.palette.accent>
    nature?: Partial<typeof themeValues.palette.nature>
    learn?: { background?: string; text?: string }
    explore?: { background?: string; text?: string }
    empower?: { background?: string; text?: string }
    utility?: Partial<typeof themeValues.palette.utility>
    ambient?: Partial<typeof themeValues.palette.ambient>
    overlay?: Partial<typeof themeValues.palette.overlay>
    tiers?: Partial<typeof themeValues.palette.tiers>
  }

  // zIndex - derived from themeValues.zIndex
  interface ZIndex {
    basement: number
    persistentMap: number
    pageContent: number
    mapControls: number
    floating: number
    uiOverlay: number
    dropdown: number
    tooltip: number
    modal: number
  }

  // Theme interface - types derived from themeValues
  interface Theme {
    layout: typeof themeValues.layout & {
      spacing: {
        xs: { xs: number; sm: number; md: number }
        sm: { xs: number; sm: number; md: number }
        md: { xs: number; sm: number; md: number }
        lg: { xs: number; sm: number; md: number }
        xl: { xs: number; sm: number; md: number }
        xxl: { xs: number; sm: number; md: number }
      }
    }
    border: {
      none: string
      light: string
      medium: string
      focus: string
      focusLight: string
      highlight: string
      onDark: string
      subtleOutline: string
      arrowBase: string
    }
    background: {
      transparent: string
      paragraph: string
      overlay: { light: string; medium: string; dark: string }
    }
    borderRadius: typeof themeValues.borderRadius
    shadow: typeof themeValues.shadow
    transition: typeof themeValues.transition
    cards: typeof themeValues.cards
    // Scenario/strategy component styles
    scenarios: typeof themeValues.scenarios
  }

  // ThemeOptions interface - optional versions for createTheme()
  interface ThemeOptions {
    layout?: Partial<typeof themeValues.layout> & {
      spacing?: {
        xs?: { xs: number; sm: number; md: number }
        sm?: { xs: number; sm: number; md: number }
        md?: { xs: number; sm: number; md: number }
        lg?: { xs: number; sm: number; md: number }
        xl?: { xs: number; sm: number; md: number }
        xxl?: { xs: number; sm: number; md: number }
      }
    }
    shadow?: Partial<typeof themeValues.shadow>
    transition?: Partial<typeof themeValues.transition>
    cards?: Partial<typeof themeValues.cards>
  }

  interface Mixins {
    drawerContent: typeof drawerContentMixins
  }

  // Add custom typography variant
  interface TypographyVariants {
    nav: React.CSSProperties
    compact: {
      title: React.CSSProperties
      subtitle: React.CSSProperties
      caption: React.CSSProperties
      micro: React.CSSProperties
    }
  }
  interface TypographyVariantsOptions {
    nav?: React.CSSProperties
    compact?: {
      title?: React.CSSProperties
      subtitle?: React.CSSProperties
      caption?: React.CSSProperties
      micro?: React.CSSProperties
    }
  }
}

// Custom button variants
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    pill: true
    standard: true
    actionCard: true
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    nav: true
  }
}
