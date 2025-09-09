import { createTheme, Theme } from "@mui/material/styles"
import type { CSSProperties } from "react"

// TODO:
// - Standardized styles for transitions

/* ========================================================
 TABLE OF CONTENTS
 ========================================================
| 1. Global theme values
|    - Typography scale (Perfect Fourth ratio with typeScale constants)
|    - Font families neueHaasText, neueHaasDisplay
|    - Layout dimensions (headerHeight, drawer widths incl. glossaryWidth, textContainer)
|    - California Water color palette (brand, blue, accent, nature, utility, grey, ambient)
|    - Category & tier colors for data visualization
|    - Border radius values
|    - Border styles
|    - Shadows
|    - Z-Index layering system (5 layers: background, content, interactive, navigation, system)
|    - Map prompt dialog configuration
|
| 2. Reusable mixins (defined before theme creation)
|    - Scenario card list styling
|    - Tooltip action button styling
|    - Checkbox with dropdown mixin for expandable controls
|    - Form control base mixin (standardized 20px × 20px controls)
|    - Card typography mixins (eyebrow, cardTitle, sectionHeader, bodyContainer, etc.)
|    - Drawer content styling mixins (contentWrapper, itemBox, chips, etc.)
|
| 3. Theme configuration
|    - Base theme creation
|    - Helper functions (createBorderStyles, createDrawerMixins)
|    - Main theme object with:
|      - Custom layout properties
|      - Cards typography scale and spacing system
|      - California Water palette integration
|      - Typography variants using typeScale
|      - Shape settings
|      - Z-index configuration
|      - Component overrides for MUI components:
|        * CssBaseline (incl. font imports)
|        * Button variants (pill, standard, outlined, actionCard)
|        * Drawer (mini-drawer with transitions)
|        * Form controls (Checkbox, Radio, FormControlLabel)
|        * Navigation (incl tabs)
|        * UI components (Typography, Paper, Toolbar, Tooltip, etc.)
|      - Custom mixins integration
|
| 4. Custom theme properties (post-creation)
|    - Border utilities with palette colors
|    - Background overlays (transparent, paragraph, overlay variants)
|    - Border radius application
|    - Drawer navigation color palette
|    - Map prompt dialog configuration
|    - Exported mixin constants
|
| 5. TypeScript customizations
|    - Extended palette interface (brand, blue, accent, nature, utility, grey, ambient)
|    - Category & tier color interfaces
|    - Custom theme interface extensions (layout, cards, border, background, mapPromptDialog)
|    - Z-Index interface extensions (layered system with semantic names)
|    - Cards typography and spacing interfaces
|    - Component variant overrides (Button, Typography)
|    - Custom mixins interface (all reusable mixins)
|
| 6. Documentation & usage guides
|    - Form control conventions and specifications
|    - Z-index layering system guide
|    - Usage examples and best practices
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
// Headlines: Neue Haas Display (h1, h2, h3, h5, h6) | Body text: Neue Haas Text (h4, body1, body2, UI)
//
// Scale progression using Perfect Fourth ratio (1.333):
// • h1: 5.8rem (92.8px) - Hero headlines "Rethink California Water" (Neue Haas Display Medium)
// • h2: 4.35rem (69.6px) - Section headlines "What is the future..." (Neue Haas Display Medium)
// • h3: 3.26rem (52.2px) - Subsection headlines (Neue Haas Display Medium)
// • h4: 2.45rem (39.2px) - Card titles and smaller headlines (Neue Haas Text Regular)
// • h5: 1.84rem (29.4px) - Labels and minor headlines (Neue Haas Display Medium)
// • h6: 1.38rem (22.1px) - Small headlines and captions (Neue Haas Display SemiBold)
// • body1: 1.25rem (20px) - Primary body text (Neue Haas Text Regular)
// • body2: 0.95rem (15.2px) - Dashboard interface text (Neue Haas Text Regular)
//
// Additional variants:
// • subtitle1: 1.25rem (20px) - Medium weight body text (Neue Haas Text Medium)
// • subtitle2: 0.95rem (15.2px) - Medium weight interface text (Neue Haas Text Medium)
// • button: 1rem (16px) - UI button text (Medium weight, no transform)
// • caption: 1rem (16px) - Aligned with body2 for consistency
// • nav: 0.875rem (14px) - Navigation text (custom variant)
//
// Compact UI variants (for dialogs, tooltips, form labels):
// • compact.title: 0.9rem (14.4px) - Compact dialog titles
// • compact.subtitle: 0.8rem (12.8px) - Compact dialog subtitles
// • compact.caption: 0.75rem (12px) - Compact captions/labels
// • compact.micro: 0.7rem (11.2px) - Micro text (form helpers)
//

// ===============================================================================
// SPECS FOR THEME VALUES (need to be defined before theme creation)
// ===============================================================================

const typeScale = {
  // Headline sizes using Perfect Fourth ratio (1.333) - refined scale
  h1: "5.8rem", // 92.8px - Hero size
  h2: "4.35rem", // 69.6px - Major section headers (h1 ÷ 1.333)
  h3: "3.26rem", // 52.2px - Subsection headers (h2 ÷ 1.333)
  h4: "2.45rem", // 39.2px - Card titles (h3 ÷ 1.333)
  h5: "1.84rem", // 29.4px - Minor headlines (h4 ÷ 1.333)
  h6: "1.38rem", // 22.1px - Section headers (h5 ÷ 1.333)

  // Compact UI typography for dialogs, tooltips, form labels
  compact: {
    title: "0.9rem", // 14.4px
    subtitle: "0.8rem", // 12.8px
    caption: "0.75rem", // 12px
    micro: "0.7rem", // 11.2px (form helpers)
  },
}

const themeValues = {
  // Typography
  fontFamily: {
    neueHaasText:
      '"neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    neueHaasDisplay:
      '"neue-haas-grotesk-display", "neue-haas-grotesk-text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
      maxWidth: { xs: "600px", md: "520px" },
    },
    // Compact control dimensions for UI elements
    controls: {
      standard: 20, // Standard form control size (20px × 20px)
      compact: 16, // Compact form control size (16px × 16px)
      micro: 12, // Micro form control size (12px × 12px)
    },
    // Spacer component spacing system - responsive values for section spacing
    spacer: {
      small: { xs: 24, md: 48, lg: 64 }, // 24px / 48px / 64px
      medium: { xs: 48, md: 96 }, // 48px / 96px
      large: { xs: 100, lg: 0 }, // 100px / 0
    },
  },

  // Color Palette - California Water theme
  palette: {
    // Core colors
    brand: {
      sky: "#92C1D5", // Top of gradient - sky blue
      water: "#64A4D6", // Bottom of gradient - water blue
    },

    // Text and UI blues (organized by intensity)
    blue: {
      darkest: "#3a4574", // Deep navy - primary text (TODO: should it be #2A5287 ?)
      dark: "#186b88", // Dark teal - secondary text
      medium: "#2d89b6", // Medium blue - accent (a beautiful blue FWIW)
      bright: "#449cd9", // Bright blue - links/interactive
      light: "#77a2d9", // Light blue - subtle elements
    },

    text: {
      default: "#fffff", // Change the default here
    },

    // Accent colors - warm tones
    accent: {
      gold: "#ffd87e", // Golden yellow - highlights
      cream: "#fdf0a0", // Light yellow
    },

    // Nature colors - greens
    nature: {
      earth: "#c2a14f", // Earth brown
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

    categories: {
      // Not used yet, categories have changed
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

    // Outcome tier colors, used
    tiers: {
      tier1: "#7b9d3f", // Green, tier 1
      tier2: "#60aacb", // Blue, tier 2
      tier3: "#FFB347", // Orange, tier 3
      tier4: "#CD5C5C", // Red, tier 4
    },
  },

  // Border radius values
  borderRadius: {
    pill: "999px",
    rounded: "16px",
    card: "16px",
    standard: "16px",
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
    // Background layers
    basement: -1, // Map when used as background
    sectionBackground: 0, // Section background elements

    // Content layers (0-99)
    content: 20, // Default content layer
    panels: 10, // Main content panels

    // Intro section micro-layers (1-9)
    introBackgroundImages: 15, // Background decorative images
    introText: 20, // Text content
    introForegroundImages: 30, // Foreground decorative elements
    introBubbles: 40, // Interactive bubble elements

    // Interactive layers (100-999)
    mapControls: 100, // Map overlay controls and panels
    floatingElements: 110, // Floating UI elements

    // Navigation layers (1200-1499)
    drawerBackdrop: 1199, // Drawer backdrop/overlay
    drawer: 1200, // Side drawer/navigation
    overlay: 1250, // General overlay elements
    modal: 1300, // Modal dialogs
    appBar: 1400, // Top navigation bar

    // System layers (1500+)
    tooltip: 1500, // Tooltips and help text
    notification: 1600, // Toast notifications
    loading: 1700, // Loading overlays
    debug: 9999, // Debug overlays (development)
  },

  // Map prompt dialog box styling, used for the small map prompt dialog box that appears in context
  mapPromptDialog: {
    backgroundColor: "rgba(0, 0, 0, 0.8)", // theme.background.overlay.dark
    textColor: "#FFFFFF", // theme.palette.utility.white
    borderRadius: "16px", // theme.borderRadius.card
    padding: "16px", // theme.borderRadius.card
    minWidth: "280px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    zIndex: 1500, // theme.zIndex.tooltip
    position: {
      top: "16px", // theme.borderRadius.card
      centerX: true, // Horizontal centering
    },
    typography: {
      title: {
        fontSize: typeScale.compact.title, // 0.9rem
        fontWeight: 500,
        marginBottom: "4px", // Use theme.spacing(theme.cards.spacing.compact.sm) in components
      },
      subtitle: {
        fontSize: typeScale.compact.subtitle, // 0.8rem
        opacity: 0.9,
        marginBottom: "4px", // Use theme.spacing(theme.cards.spacing.compact.sm) in components
      },
      action: {
        fontSize: typeScale.compact.subtitle, // 0.8rem
        fontWeight: "bold",
        cursor: "pointer",
        textDecoration: "none",
      },
    },
  },
}

// ScenarioCard list styling mixin
const scenarioCardListMixin = {
  "& ul": {
    margin: 0,
    paddingLeft: `${themeValues.layout.controls.standard}px`, // 20px standardized
    "& li": {
      fontSize: "0.95rem", // 15.2px - dashboard interface text (matches body2)
      fontWeight: 400,
      lineHeight: 1.4, // Tighter to conserve vertical space
      marginBottom: "4px", // Use theme.spacing(theme.cards.spacing.compact.sm) in components

      color: "inherit",
      "&:last-child": {
        marginBottom: 0,
      },
      // Bullet styling
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
  padding: "4px 12px", // Use theme.spacing(theme.cards.spacing.compact.sm, theme.cards.spacing.compact.lg) in components
  minWidth: "auto",
  lineHeight: 1.5,
  fontSize: typeScale.compact.subtitle, // 0.8rem - compact dialog subtitles
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s ease",
} as const

// Triangle checkbox mixin (for dropdown menus in the scenario search panel)
const triangleCheckboxMixin = {
  display: "inline-block",
  width: `${themeValues.layout.controls.standard}px !important`,
  height: `${themeValues.layout.controls.standard}px !important`,
  minWidth: `${themeValues.layout.controls.standard}px !important`, // Prevent shrinking
  maxWidth: `${themeValues.layout.controls.standard}px !important`, // Prevent growing
  flexShrink: 0, // Don't shrink in flex containers
  borderRadius: "2px",
  backgroundColor: "transparent",
  padding: "0",
  alignSelf: "flex-start",
  transform: "translateY(2px)", // Fine-tune vertical position
  // Center the triangle content
  lineHeight: `${themeValues.layout.controls.standard - 2}px`, // height minus border (20px - 2px)
  textAlign: "center",
  fontSize: typeScale.compact.micro, // 0.7rem
  transition: "all 0.2s ease",
  position: "relative",
  boxSizing: "border-box !important",
  filter: "none",
  backdropFilter: "none",
} as const

// Form control base mixin (shared styling for all form controls)
const formControlBaseMixin = {
  width: `${themeValues.layout.controls.standard}px !important`,
  height: `${themeValues.layout.controls.standard}px !important`,
  minWidth: `${themeValues.layout.controls.standard}px !important`, // Prevent shrinking
  maxWidth: `${themeValues.layout.controls.standard}px !important`, // Prevent growing
  flexShrink: 0, // Don't shrink in flex containers
  backgroundColor: "transparent",
  padding: "0",
  alignSelf: "flex-start",
  transform: "translateY(-3px)", // Fine-tune vertical position
  transition: "all 0.2s ease",
  position: "relative",
  display: "inline-block",
  boxSizing: "border-box",
  filter: "none !important",
  backdropFilter: "none !important",
} as const

// Card typography mixins (standardized from MapPanel card patterns)
const cardTypographyMixins = {
  // Eyebrow text (e.g., "SCENARIO")
  eyebrow: {
    color: "blue.medium",
    textTransform: "uppercase",
    letterSpacing: "0.75px",
    fontSize: typeScale.compact.caption, // 0.75rem - compact captions/labels
    fontWeight: 500,
    display: "block",
    mb: 0.5,
  } as const,
  // Main card title (e.g., "Current Operations")
  cardTitle: {
    color: "text.secondary",
    fontFamily: themeValues.fontFamily.neueHaasText,
    fontWeight: 500,
    fontSize: "1.5rem", // Could use typeScale.h6 but this is specifically for cards
    lineHeight: 1.3,
    mb: 1,
  } as const,
  // Section headers within cards (e.g., "Scenario snapshot")
  sectionHeader: {
    // Uses Typography variant="h6" with theme color
    color: "text.secondary",
  } as const,
  // Body text containers
  bodyContainer: {
    color: "text.secondary",
    fontFamily: "typography.fontFamily",
    mb: 2.5,
  } as const,
  // Instructional text
  instructionalText: {
    color: "text.primary",
    fontFamily: "typography.fontFamily",
    // Uses Typography variant="body1"
  } as const,
  // Highlighted words within text
  highlightedSpan: {
    color: "text.secondary",
  } as const,
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
        fontSize: "0.95rem", // matches body1
        lineHeight: 1.5,
        fontWeight: 400,
      },
      caption: {
        fontSize: "0.95rem", // align with body1
        lineHeight: 1.4,
        fontWeight: 400,
      },
      button: {
        fontSize: "0.95rem", // align with body1
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
    },
    accent: {
      gold: themeValues.palette.accent.gold,
      cream: themeValues.palette.accent.cream,
    },
    nature: {
      earth: themeValues.palette.nature.earth,
      forest: themeValues.palette.nature.forest,
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
    fontFamily: themeValues.fontFamily.neueHaasText,
    htmlFontSize: 16,
    fontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: themeValues.fontFamily.neueHaasDisplay,
      fontSize: typeScale.h1,
      fontWeight: 500,
      lineHeight: 1.0, // Tighter for large hero text
      color: themeValues.palette.blue.darkest,
      textTransform: "uppercase",
    },
    h2: {
      fontFamily: themeValues.fontFamily.neueHaasDisplay,
      fontSize: typeScale.h2,
      fontWeight: 500,
      lineHeight: 1.1, // Slightly tighter for section headers
      color: themeValues.palette.blue.darkest,
    },
    h3: {
      fontFamily: themeValues.fontFamily.neueHaasDisplay,
      fontSize: typeScale.h3,
      fontWeight: 500,
      lineHeight: 1.15, // Balanced for subsection headers
      color: themeValues.palette.blue.darkest,
    },
    h4: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: typeScale.h4,
      fontWeight: 400,
      lineHeight: 1.25, // Slightly more open for card titles
      color: themeValues.palette.blue.darkest,
    },
    h5: {
      fontFamily: themeValues.fontFamily.neueHaasDisplay,
      fontSize: typeScale.h5,
      fontWeight: 500,
      lineHeight: 1.35, // Good balance for minor headlines
      color: themeValues.palette.blue.darkest,
    },
    h6: {
      fontFamily: themeValues.fontFamily.neueHaasDisplay,
      fontSize: typeScale.h6,
      fontWeight: 600,
      lineHeight: 1.4,
      color: themeValues.palette.blue.darkest,
    },
    body1: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: "1.25rem", // 20px - primary body text (matches body1)
      fontWeight: 400,
      lineHeight: 1.5, // 1.5x ratio (30px at 20px font size)
      color: themeValues.palette.blue.darkest,
    },
    body2: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: "0.95rem", // 15.2px - dashboard interface text (matches body2)
      fontWeight: 400,
      letterSpacing: "unset",
      lineHeight: 1.6, // Consistent line height ratio
      color: themeValues.palette.blue.darkest,
    },
    subtitle1: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: "1.25rem", // 20px - matches body1
      fontWeight: 500, // Medium weight to distinguish from body
      letterSpacing: "normal",
      lineHeight: 1.5,
      color: themeValues.palette.blue.darkest,
    },
    subtitle2: {
      fontFamily: themeValues.fontFamily.neueHaasText,
      fontSize: "0.95rem", // 15.2px - matches body2
      fontWeight: 500, // Medium weight to distinguish from body
      letterSpacing: "normal",
      lineHeight: 1.6,
      color: themeValues.palette.blue.darkest,
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
            borderRadius: theme.borderRadius.card,
            boxShadow: "none",
            border: "none",
            padding: "16px",
            fontSize: "0.95rem", // align with body1
            fontWeight: 400,
            textAlign: "center",
            transition: "all 0.2s ease",
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
            borderColor: theme.border.standard,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.border.standard,
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
          backgroundColor: "transparent",
          color: theme.palette.common.white,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "transparent",
          },
          "&.Mui-selected": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.common.white,
            },
          },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": {
            borderLeft: `${themeValues.border.standard} ${theme.palette.divider}`,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.borderRadius.card,
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
          // Custom square checkbox using standardized form control base
          ...formControlBaseMixin,
          borderRadius: "2px",
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
          // Custom elegant circular radio button, uses standardized form control base
          ...formControlBaseMixin,
          borderRadius: "50%",
          border: `1px solid ${theme.palette.text.primary}`,
          margin: theme.spacing(0.5),
          cursor: "pointer",
          boxSizing: "border-box", // Ensure border is included in dimensions
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
            fontSize: "0.95rem", // align with body1
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
          fontSize: "0.95rem", // align with body1
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
          borderRadius: theme.borderRadius.card,
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
    drawerContent: drawerContentMixins,
    cardTypography: cardTypographyMixins,
    scenarioCardList: scenarioCardListMixin,
    tooltipActionButton: tooltipActionButtonMixin,
    triangleCheckbox: triangleCheckboxMixin,
    formControlBase: formControlBaseMixin,
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
    medium: "rgba(0, 0, 0, 0.4)",
    dark: "rgba(0, 0, 0, 0.8)",
  },
}

theme.borderRadius = themeValues.borderRadius

// Define color palette for drawer navigation items

// Probably obsolete TODO: check and delete
theme.drawerNavigation = {
  colors: ["#BFDADC", "#9ACBCF", "#76B2BE", "#548FAF", "#3B6C97", "#1A3F6A"],
}

// Map prompt dialog configuration
theme.mapPromptDialog = {
  ...themeValues.mapPromptDialog,
  backgroundColor: theme.background.overlay.dark,
  textColor: theme.palette.utility.white,
  borderRadius: theme.borderRadius.card,
  padding: theme.borderRadius.card,
  zIndex: theme.zIndex.tooltip,
  position: {
    ...themeValues.mapPromptDialog.position,
    top: theme.borderRadius.card,
  },
  typography: {
    ...themeValues.mapPromptDialog.typography,
    title: {
      ...themeValues.mapPromptDialog.typography.title,
      marginBottom: `${theme.spacing(theme.cards.spacing.compact.sm)}px`, // Use compact spacing
    },
    subtitle: {
      ...themeValues.mapPromptDialog.typography.subtitle,
      marginBottom: `${theme.spacing(theme.cards.spacing.compact.sm)}px`, // Use compact spacing
    },
  },
}

// expose mixin constants for easy import if needed
export const cardTypography = cardTypographyMixins
export const scenarioCardList = scenarioCardListMixin
export const tooltipActionButton = tooltipActionButtonMixin
export const triangleCheckbox = triangleCheckboxMixin
export const formControlBase = formControlBaseMixin

export default theme

/* ========================================================
 4. TypeScript customizations
 ======================================================== */

// Custom palette colors and theme properties
declare module "@mui/material/styles" {
  // Custom palette colors - California Water Theme
  interface Palette {
    interaction: {
      hoverBackground: string
    }
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
      earth: string
      teal: string
      sage: string
      mint: string
      whisper: string
      forest: string
    }
    utility: {
      white: string
      black: string
    }

    ambient: {
      rippleWhite: string
      rippleBlue: string
    }

    overlay: {
      water: string
      waterLight: string
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

    tiers: {
      tier1: string
      tier2: string
      tier3: string
      tier4: string
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
      earth: string
      teal?: string
      sage?: string
      mint?: string
      whisper?: string
      forest?: string
    }
    utility?: {
      white?: string
      black?: string
    }

    ambient?: {
      rippleWhite?: string
      rippleBlue?: string
    }

    overlay?: {
      water?: string
      waterLight?: string
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

    tiers?: {
      tier1?: string
      tier2?: string
      tier3?: string
      tier4?: string
    }

    interaction?: {
      hoverBackground?: string
    }
  }

  // zIndex interface
  interface ZIndex {
    // Background layers
    basement: number
    sectionBackground: number

    // Content layers
    content: number
    panels: number

    // Intro section layers
    introBackgroundImages: number
    introText: number
    introForegroundImages: number
    introBubbles: number

    // Interactive layers
    mapControls: number
    floatingElements: number

    // Navigation layers
    drawerBackdrop: number
    overlay: number

    // System layers
    notification: number
    loading: number
    debug: number
  }

  interface Theme {
    layout: {
      headerHeight: number
      drawer: {
        width: number
        closedWidth: number
        glossaryWidth: number
      }
      textContainer: {
        maxWidth: { xs: string; md: string }
      }
      controls: {
        standard: number
        compact: number
        micro: number
      }
      spacing: {
        xs: { xs: number; sm: number; md: number }
        sm: { xs: number; sm: number; md: number }
        md: { xs: number; sm: number; md: number }
        lg: { xs: number; sm: number; md: number }
        xl: { xs: number; sm: number; md: number }
        xxl: { xs: number; sm: number; md: number }
      }
      spacer: {
        small: { xs: number; md: number; lg: number }
        medium: { xs: number; md: number }
        large: { xs: number; lg: number }
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
    mapPromptDialog: {
      backgroundColor: string
      textColor: string
      borderRadius: string
      padding: string
      minWidth: string
      boxShadow: string
      zIndex: number
      position: {
        top: string
        centerX: boolean
      }
      typography: {
        title: {
          fontSize: string
          fontWeight: number
          marginBottom: string
        }
        subtitle: {
          fontSize: string
          opacity: number
          marginBottom: string
        }
        action: {
          fontSize: string
          fontWeight: string
          cursor: string
          textDecoration: string
        }
      }
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
        compact: {
          xs: number
          sm: number
          md: number
          lg: number
          xl: number
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
      textContainer?: {
        maxWidth?: { xs: string; md: string }
      }
      controls?: {
        standard?: number
        compact?: number
        micro?: number
      }
      spacing?: {
        xs?: { xs: number; sm: number; md: number }
        sm?: { xs: number; sm: number; md: number }
        md?: { xs: number; sm: number; md: number }
        lg?: { xs: number; sm: number; md: number }
        xl?: { xs: number; sm: number; md: number }
        xxl?: { xs: number; sm: number; md: number }
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
        compact?: {
          xs?: number
          sm?: number
          md?: number
          lg?: number
          xl?: number
        }
      }
    }
  }

  interface Mixins {
    hoverParagraph: CSSProperties
    hoverParagraphDarkened: CSSProperties
    drawerContent: typeof drawerContentMixins
    cardTypography: typeof cardTypographyMixins
    scenarioCardList: typeof scenarioCardListMixin
    tooltipActionButton: typeof tooltipActionButtonMixin
    triangleCheckbox: typeof triangleCheckboxMixin
    formControlBase: typeof formControlBaseMixin
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

/* ========================================================
| FORM CONTROL CONVENTIONS - USAGE GUIDE
| ========================================================
| 
| All form controls in the application follow standardized conventions
| for consistent appearance and behavior across the site.
|
| CONTROL DIMENSIONS:
| - Standard: 20px × 20px (theme.layout.controls.standard)
| - Compact: 16px × 16px (theme.layout.controls.compact)
| - Micro: 12px × 12px (theme.layout.controls.micro)
|
| STANDARD SPECIFICATIONS:
| - Size: Uses theme.layout.controls.standard (20px × 20px)
| - Positioning: alignSelf "flex-start" + transform "translateY(-3px)"
| - Border: 1px solid using theme.palette.text.primary
| - Background: Transparent with hover states (for checkboxes/radios)
| - Spacing: theme.spacing(0.5) margin
| - Protection: flexShrink: 0 prevents label compression
|
| BACKGROUND COLOR STANDARDS:
| - Text fields, dropdowns, selects: white (theme.palette.common.white)
| - Checkboxes, radios: Transparent with hover states
| - Enforced via MuiOutlinedInput, MuiSelect, MuiTextField overrides
|
| COMPACT SPACING SYSTEM:
| - xs: 2px (theme.cards.spacing.compact.xs) - micro spacing
| - sm: 4px (theme.cards.spacing.compact.sm) - tight spacing
| - md: 8px (theme.cards.spacing.compact.md) - compact spacing
| - lg: 12px (theme.cards.spacing.compact.lg) - medium compact
| - xl: 16px (theme.cards.spacing.compact.xl) - standard compact
| - Usage: theme.spacing(theme.cards.spacing.compact.sm) for consistent spacing
|
| TYPOGRAPHY FOR CONTROLS:
| - Labels: typeScale.compact.caption (0.75rem/12px)
| - Helper text: typeScale.compact.micro (0.7rem/11.2px)
| - Form titles: typeScale.compact.title (0.9rem/14.4px)
|
| REUSABLE MIXINS:
| 
| 1. theme.mixins.formControlBase
|    - Base styling for all standard form controls
|    - Uses theme.layout.controls.standard (20px × 20px)
|    - Includes sizing, positioning, and interaction states
|
| 2. theme.mixins.triangleCheckbox  
|    - Specialized for expandable/collapsible controls
|    - Uses standardized control dimensions and compact typography
|    - Includes text centering for triangle symbols (typeScale.compact.micro)
|
| USAGE EXAMPLES:
|
| Standard Checkbox:
|   sx={{ 
|     ...theme.mixins.formControlBase,
|     borderRadius: "2px",
|     border: `1px solid ${theme.palette.text.primary}`
|   }}
|
| Compact Control (custom):
|   sx={{
|     width: `${theme.layout.controls.compact}px`,
|     height: `${theme.layout.controls.compact}px`,
|     fontSize: theme.typography.compact.micro
|   }}
|
| Triangle Dropdown:
|   sx={{
|     ...theme.mixins.triangleCheckbox,
|     border: `1px solid ${theme.palette.text.primary}`
|   }}
|
| Form Label with Compact Typography:
|   sx={{
|     fontSize: theme.typography.compact.caption,
|     marginBottom: theme.spacing(theme.cards.spacing.compact.sm)
|   }}
|
| MUI COMPONENT OVERRIDES:
| - MuiCheckbox: Uses formControlBase + square styling + 20px dimensions
| - MuiRadio: Uses formControlBase + circular styling + 20px dimensions
| - MuiFormControlLabel: alignItems "flex-start" for multi-line labels
| - MuiOutlinedInput: White background
| - MuiSelect: White background for dropdowns
| - MuiTextField: White background for text inputs
| - MuiMenu: White background for dropdown panels
| - MuiPaper: White background for menu/select panels
|
| SIZING GUIDELINES:
| - Standard (20px): Default for most form controls
| - Compact (16px): Dense interfaces, secondary controls
| - Micro (12px): Indicators, status controls, tight spaces
|
| ========================================================
|
| Z-INDEX LAYERING SYSTEM - USAGE GUIDE
| ========================================================
| 
| The z-index system is organized into logical layers to prevent
| conflicts and ensure predictable stacking behavior:
|
| BACKGROUND LAYERS (negative values):
| - basement (-1): Map when used as background element
| - sectionBackground (-1): Section background decorations
|
| CONTENT LAYERS (0-99):
| - content (0): Default content layer for main sections
| - panels (0): Main content panels and cards
| 
| INTRO SECTION MICRO-LAYERS (1-9):
| - introBackgroundImages (1): Decorative background images
| - introText (2): Text content over backgrounds
| - introForegroundImages (3): Decorative foreground elements
| - introBubbles (4): Interactive floating elements
|
| INTERACTIVE LAYERS (1000-1199):
| - mapControls (1000): Map overlay controls and panels
| - floatingElements (1100): Floating UI elements, scroll controls
|
| NAVIGATION LAYERS (1200-1499):
| - drawerBackdrop (1199): Drawer backdrop/overlay
| - drawer (1200): Side drawer/navigation
| - overlay (1250): General overlay elements
| - modal (1300): Modal dialogs
| - appBar (1400): Top navigation bar
|
| SYSTEM LAYERS (1500+):
| - tooltip (1500): Tooltips, help text, and map prompt dialogs
| - notification (1600): Toast notifications  
| - loading (1700): Loading overlays
| - debug (9999): Debug overlays (development only)
|
| USAGE:
| Always use theme.zIndex.layerName instead of hardcoded numbers:
|   zIndex: (theme) => theme.zIndex.mapControls
||   zIndex: (theme) => theme.zIndex.tooltip
|
| ======================================================== */
