/**
 * StrategyGrid Layout Configuration
 *
 * Centralizes all spacing, alignment, and layout constants for the StrategyGrid
 * component system. These values were carefully calibrated to achieve proper
 * visual alignment between column headers, dividers, scenario content, and glyphs.
 *
 * Values are provided as MUI spacing multipliers (1 unit = 8px) to be used
 * directly with theme.spacing() or MUI sx prop shorthand.
 */

/**
 * Layout constants for StrategyGrid and its sub-components.
 *
 * Usage:
 * ```tsx
 * import { LAYOUT } from './layoutConfig'
 * // Use with sx prop:
 * sx={{ pl: LAYOUT.spacing.dividerGap }} // 12px
 * sx={{ mt: LAYOUT.dividerPullUp }} // -8px
 * ```
 */
export const LAYOUT = {
  /**
   * MUI spacing multipliers for common spacing values.
   * These map to theme.spacing() values (1 unit = 8px).
   */
  spacing: {
    /**
     * Standard gap between content and vertical column dividers.
     * Applied as pl/pr around dividers for consistent spacing.
     *
     * Value: 1.5 MUI units (12px)
     */
    dividerGap: 1.5,

    /**
     * Row vertical padding for scenario content.
     * Applied symmetrically (pt and pb) to non-compact rows.
     *
     * Value: 3 MUI units (24px)
     */
    rowPadding: 3,

    /**
     * First scenario row top margin.
     * Small offset to separate first row from header content.
     *
     * Value: 0.5 MUI units (4px)
     */
    firstRowOffset: 0.5,

    /**
     * Row gap inside subgrid rows.
     * Controls vertical spacing between wrapped content within a single scenario row.
     *
     * Value: 1 MUI unit (8px)
     */
    internalRowGap: 1,
  },

  /**
   * Header bottom padding variants.
   *
   * Different columns use different bottom padding to achieve visual balance:
   * - Columns 1-3: Standard padding (16px)
   * - Column 4: Tighter padding (8px) because outcome category labels appear below
   */
  headerPadding: {
    /** Columns 1-2 ("Choose scenarios"), Column 3 ("Key operations"): 2 MUI units (16px) */
    standard: 2,

    /** Column 4 ("Key outcomes") - tighter to accommodate category labels: 1 MUI unit (8px) */
    outcomes: 1,

    /** Outcome category labels (below "Key outcomes" header): 1 MUI unit (8px) */
    categoryLabels: 1,
  },

  /**
   * Grid gap between columns and rows.
   * Used by parent grid; subgrid rows inherit columnGap automatically.
   *
   * Value: 1 MUI unit (8px)
   */
  gridGap: 1,

  /**
   * Glyph alignment offset for Column 4 (Key outcomes).
   *
   * **Calculation:**
   * - Row title (Column 2) uses pt: 24px (3 MUI units) for vertical padding
   * - OutcomeGlyphItem has internal padding (8px) + border (2px) = 10px
   * - To align glyph content with scenario title baseline: 24px - 10px = 14px
   *
   * This ensures the TOP of the glyph bars/dots aligns visually with the
   * scenario title text, creating a clean horizontal alignment across the row.
   *
   * Value: "14px" (string for direct CSS value)
   */
  glyphAlignmentOffset: "14px",

  /**
   * Negative margin to create continuous vertical dividers.
   *
   * The parent grid has an 8px row gap between header row and content rows.
   * Divider continuation elements use this negative margin to "pull up" and
   * visually connect with the header dividers above.
   *
   * Value: -1 MUI unit (-8px, negates gridGap)
   */
  dividerPullUp: -1,
} as const

/**
 * Type for the spacing sub-object
 */
export type LayoutSpacing = typeof LAYOUT.spacing

/**
 * Type for header padding variants
 */
export type HeaderPadding = typeof LAYOUT.headerPadding
