/**
 * Text-fitting math for the circle operation icons
 * 
 * The icon work throughout is provisional, until someone has time to make real 
 * icons.
 *
 * Estimates rendered line width and computes the largest font size that keeps
 * a set of centered text lines inside a fixed-radius circle.
 */

/**
 * Estimate line width as a multiple of fontSize using per-character sizes
 */
function estimateLineWidth(line: string): number {
  let w = 0
  for (const ch of line) {
    if (ch === "W" || ch === "M") w += 0.82
    else if (ch >= "A" && ch <= "Z") w += 0.7
    else if (ch === "m" || ch === "w") w += 0.7
    else if (ch === "i" || ch === "l" || ch === "j") w += 0.32
    else if (ch === "t" || ch === "f" || ch === "r") w += 0.42
    else if (ch >= "a" && ch <= "z") w += 0.55
    else if (ch >= "0" && ch <= "9") w += 0.6
    else if (ch === " ") w += 0.28
    else if (ch === "." || ch === "/" || ch === "%" || ch === "'") w += 0.32
    else if (ch === "-" || ch === "+") w += 0.4
    else w += 0.55
  }
  return w
}

/**
 * Compute the maximum font size that fits text inside a circle.
 *
 * For n lines of text centered in a circle of radius R, the topmost/bottommost
 * line sits at y-offset = (n-1) * lineHeight * fs / 2 from center.
 * Available width at that y: 2 * sqrt(R² - y²).
 * Text width: estimatedLineWidth * fs.
 *
 * Solving: fs = 2R / sqrt(a² + 4b²)
 * where a = maxLineWidth * safety, b = (n-1) * lineHeightRatio / 2
 */
export function getAutoFontSize(lines: string[]): number {
  const R = 52 // usable radius (60 minus padding)
  const LINE_HEIGHT = 1.25
  const SAFETY = 1.08 // 8% safety margin for font metrics variance

  const maxLineW = Math.max(...lines.map(estimateLineWidth))
  const n = lines.length

  const a = maxLineW * SAFETY
  const b = ((n - 1) * LINE_HEIGHT) / 2

  // Horizontal + vertical combined constraint
  const fromCircle = (2 * R) / Math.sqrt(a * a + 4 * b * b)

  // Pure vertical constraint
  const fromHeight = (2 * R) / (n * LINE_HEIGHT)

  return Math.min(Math.floor(Math.min(fromCircle, fromHeight)), 40)
}
