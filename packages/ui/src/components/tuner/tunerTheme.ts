"use client"

/**
 * `createTunerDarkTheme` — produces a dark-skinned MUI theme for the
 * ChartTuner overlay, preserving every custom extension the host app has
 * added (`blue.*`, `tiers.*`, `tierDiverging.*`, `interaction.*`,
 * `layout`, `space`, `border`, `borderRadius`, `strokeWidth`,
 * `textShadow`, `transition`, typography variants, etc.) so embedded
 * controls (ResilienceControls, ToggleChip, InlineToggleChip, …) keep
 * their tokens but render on a dark surface.
 *
 * Critical implementation note
 * ----------------------------
 * The host theme is built with `cssVariables: true`, which rewrites
 * palette values into CSS `var(--mui-palette-*)` references. Those
 * variables are scoped to the document root and bound to the single
 * `light` color scheme the host enables. Inside a nested
 * `<ThemeProvider>`, those var references *still* resolve to the
 * document-root (light) values — so any override like
 * `palette.background.paper: "#0f1218"` ends up silently routed through
 * `var(--mui-palette-background-paper)` and rendered as the host's light
 * color.
 *
 * The fix: build the tuner's theme in *non*-CSS-variables mode so
 * palette values are emitted as literal strings, then copy the host
 * theme's custom extensions onto the result so embedded components keep
 * their familiar tokens. The returned theme satisfies the host's
 * augmented `Theme` type because all custom fields are present.
 *
 * Give it a theme, get a theme back. No global state. Apps that want
 * the same dark skin elsewhere can import `createTunerDarkTheme`
 * directly from `@repo/ui`.
 */

import {
  createTheme,
  type PaletteOptions,
  type Theme,
} from "@mui/material/styles"

const TUNER_SURFACE = "#0f1218"
const TUNER_SURFACE_DEEP = "#0a0c11"
const TUNER_ACCENT = "#5aa0ff"
const TUNER_ACCENT_DARK = "#3f87e8"

/** Keys on the host theme carrying the app's custom extensions. We copy
 *  these across so embedded controls (which read `theme.borderRadius`,
 *  `theme.space`, `theme.blue`, etc.) keep working inside the tuner. */
const EXTENSION_KEYS = [
  "borderRadius",
  "border",
  "background",
  "shadow",
  "textShadow",
  "transition",
  "strokeWidth",
  "scenarios",
  "space",
  "layout",
] as const

/** Palette extension keys the host adds on top of MUI's defaults. */
const PALETTE_EXTENSION_KEYS = [
  "brand",
  "blue",
  "accent",
  "nature",
  "learn",
  "explore",
  "share",
  "ambient",
  "overlay",
  "tiers",
  "tierDiverging",
  "tierDensity",
  "tierLeverage",
  "outcomes",
  "undertone",
  "waterThemes",
  "tabPanels",
  "ink",
  "interaction",
] as const

export function createTunerDarkTheme(base: Theme): Theme {
  const darkPalette: PaletteOptions = {
    mode: "dark",
    background: {
      paper: TUNER_SURFACE,
      default: TUNER_SURFACE_DEEP,
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255,255,255,0.72)",
      disabled: "rgba(255,255,255,0.35)",
    },
    divider: "rgba(255,255,255,0.12)",
    action: {
      hover: "rgba(255,255,255,0.06)",
      selected: "rgba(90,160,255,0.18)",
      disabled: "rgba(255,255,255,0.25)",
      disabledBackground: "rgba(255,255,255,0.08)",
    },
    primary: {
      main: TUNER_ACCENT,
      dark: TUNER_ACCENT_DARK,
      contrastText: "#0a1020",
    },
  }

  // Build a fresh theme in non-CSS-vars mode so palette values are
  // literal strings and bind to the nested ThemeProvider subtree.
  const dark = createTheme({
    cssVariables: false,
    palette: darkPalette,
    typography: {
      fontFamily: base.typography.fontFamily,
    },
    shape: {
      borderRadius: (base.shape as { borderRadius: number }).borderRadius,
    },
    zIndex: base.zIndex,
    breakpoints: {
      values: base.breakpoints.values,
    },
    components: {
      // The host's root MuiMenu / MuiPaper / MuiSelect / MuiOutlinedInput
      // styleOverrides hard-code `theme.palette.common.white` backgrounds
      // via CSS vars, so nested popovers and inputs would otherwise
      // render on white even inside this dark theme. Re-register those
      // slots with the tuner's surface so Select popovers, menu papers,
      // and inputs all read as part of the dark panel.
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: TUNER_SURFACE,
            backgroundImage: "none",
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: TUNER_SURFACE,
            backgroundImage: "none",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: "#ffffff",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: TUNER_SURFACE,
            backgroundImage: "none",
            color: "#ffffff",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "#ffffff",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.18)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.32)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: TUNER_ACCENT,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            backgroundColor: "transparent",
            color: "#ffffff",
            "&.Mui-focused": {
              backgroundColor: "transparent",
            },
          },
          icon: {
            color: "rgba(255,255,255,0.72)",
          },
        },
      },
    },
  })

  // Copy the host theme's custom top-level extensions so embedded
  // host components keep their familiar tokens (borderRadius.md,
  // space.panel.padding, etc.). Mutating here is safe: `dark` is a
  // fresh object owned by this tuner instance.
  for (const key of EXTENSION_KEYS) {
    const value = (base as unknown as Record<string, unknown>)[key]
    if (value !== undefined) {
      ;(dark as unknown as Record<string, unknown>)[key] = value
    }
  }

  // Copy the host's palette extensions (brand.*, blue.*, tiers.*, …).
  // These aren't part of MUI's base palette schema so createTheme
  // won't include them; without this step, a control reading
  // `theme.palette.blue.bright` would throw inside the tuner.
  for (const key of PALETTE_EXTENSION_KEYS) {
    const value = (base.palette as unknown as Record<string, unknown>)[key]
    if (value !== undefined) {
      ;(dark.palette as unknown as Record<string, unknown>)[key] = value
    }
  }

  return dark
}
