import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { test, expect } from "@playwright/test"
import ts from "typescript"

// The site never says "tier" (outcome levels go by name, or as "outcome
// levels"). This guard reads every string literal, template text and JSX
// text in the code the main site ships and fails on the word, so new copy
// cannot reintroduce it. The only exceptions are internal values that no
// visitor reads; each is listed below with the reason. Comments, identifiers
// and import paths are code, not copy, and are not read. Node-side spec.

const REPO = fileURLToPath(new URL("../../../", import.meta.url))
const ROOTS = [
  "apps/main/app",
  "packages/viz/src",
  "packages/data/src",
  "packages/map/src",
  "packages/ui/src",
]
const WORD = /\btiers?\b/i

/** Why the Distribution grid's internal keys may say "Tier". */
const DISTRIBUTION_KEYS =
  'Distribution keys each location\'s level as "Tier N" internally ' +
  "(EquityPanel to TierGrid, saved share items, CSV parsing); TierGrid " +
  "displays the level name, never the key"

/** Why the Heatmap's encoding value may say "tier". */
const ENCODING_VALUE =
  '"tier" is a cell encoding and cell render value (an enum member, ' +
  "stored in sessions and share links), never shown"
/** Why the Distribution grid's color mode may say "tier". */
const COLOR_MODE_VALUE =
  '"tier" is the Distribution grid color mode (an enum member), never shown'
/** Why the map paint mode may say "tiers". */
const PAINT_MODE_VALUE =
  '"tiers" is the map paint mode in the paint key, never shown'
/** Why a theme-key prefix may say "tier". */
const THEME_KEY_PREFIX =
  '"tier" is stripped from theme color keys ("tier3" to 3), never shown'

/** Internal values that contain the word but are never shown. */
const ALLOWED: ReadonlyArray<{ file: string; text: string; why: string }> = [
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/live/ShareResilienceLiveChart.tsx",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/utils/getResilienceShareCardContent.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/variants/resilience.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/store/resilienceStoreSlice.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/store/resilienceTypes.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/resilience/ResilienceControls.tsx",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/resilience/controls/planPivotChange.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/resilience/heatmap/cellUtils.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/resilience/resiliencePresetDefs.ts",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "packages/viz/src/components/ResilienceHeatmap.tsx",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "packages/viz/src/components/ResilienceHeatmapSmallMultiples.tsx",
    text: "tier",
    why: ENCODING_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/live/ShareEquityLiveChart.tsx",
    text: "tier",
    why: COLOR_MODE_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
    text: "tier",
    why: COLOR_MODE_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/OffscreenEquityCapture.tsx",
    text: "tier",
    why: COLOR_MODE_VALUE,
  },
  {
    file: "packages/viz/src/components/TierGrid.tsx",
    text: "tier",
    why: COLOR_MODE_VALUE,
  },
  {
    file: "apps/main/app/features/map/overlays/scenarioPanels/SummaryPanel.tsx",
    text: "tier",
    why: THEME_KEY_PREFIX,
  },
  {
    file: "apps/main/app/features/scenarios/components/shared/SmartSummary.tsx",
    text: "tier",
    why: THEME_KEY_PREFIX,
  },
  {
    file: "apps/main/app/features/map/visualizationLayers/VisualizationLayers.tsx",
    text: "tiers",
    why: PAINT_MODE_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/chrome/layout/mapFigureSpec.ts",
    text: "tiers",
    why: PAINT_MODE_VALUE,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
    text: "Tier 1",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
    text: "Tier 2",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
    text: "Tier 3",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
    text: "Tier 4",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
    text: "Tier",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/OffscreenEquityCapture.tsx",
    text: "Tier 1",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/OffscreenEquityCapture.tsx",
    text: "Tier 2",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/OffscreenEquityCapture.tsx",
    text: "Tier 3",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/OffscreenEquityCapture.tsx",
    text: "Tier 4",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/live/ShareEquityLiveChart.tsx",
    text: "Tier 1",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/live/ShareEquityLiveChart.tsx",
    text: "Tier 2",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/live/ShareEquityLiveChart.tsx",
    text: "Tier 3",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/share/live/ShareEquityLiveChart.tsx",
    text: "Tier 4",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "apps/main/app/features/scenarioExplorer/explorer/tools/panels/equity/useEquityObjectives.ts",
    text: "Tier",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "packages/viz/src/components/TierGrid.tsx",
    text: "Tier 1",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "packages/viz/src/components/TierGrid.tsx",
    text: "Tier 2",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "packages/viz/src/components/TierGrid.tsx",
    text: "Tier 3",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "packages/viz/src/components/TierGrid.tsx",
    text: "Tier 4",
    why: DISTRIBUTION_KEYS,
  },
  {
    file: "packages/viz/src/components/TierGrid.tsx",
    text: "Tier",
    why: DISTRIBUTION_KEYS,
  },
]

function getSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name === "node_modules" || name.startsWith(".")) continue
    if (statSync(path).isDirectory()) out.push(...getSourceFiles(path))
    else if (/\.tsx?$/.test(name) && !name.endsWith(".d.ts")) out.push(path)
  }
  return out
}

/**
 * Every literal text in a file that uses the word, with its line.
 *
 * @param path - the file path (also picks TS or TSX parsing)
 * @param content - the file text; read from disk when omitted
 */
function getTierTexts(
  path: string,
  content: string = readFileSync(path, "utf8"),
): Array<{ text: string; line: number }> {
  const source = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const hits: Array<{ text: string; line: number }> = []
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isImportTypeNode(node)
    ) {
      return
    }
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      // A string or template part that is one lowercase token with no
      // spaces is a code value when it is more than the bare word: an id,
      // key, class name, API path ("cws-delivery-tier", ".tier-dot",
      // "tiers|", "/tiers/list") or a template part glued to an expression
      // (the "tier" of `tier${n}`, a theme key). A bare "tier" or "tiers"
      // string could be copy (a unit, a label), so it passes only through
      // the allowlist below. Copy has capitals or spaces; JSX text is
      // always read.
      const isTemplatePart =
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node)
      const isCodeToken =
        !ts.isJsxText(node) &&
        /^[a-z0-9._|/?=&-]+$/.test(node.text) &&
        (isTemplatePart || !/^tiers?$/.test(node.text))
      const text = node.text.trim()
      if (!isCodeToken && WORD.test(text)) {
        const line =
          source.getLineAndCharacterOfPosition(node.getStart()).line + 1
        hits.push({ text, line })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return hits
}

test('shipped code has no "tier" copy outside the listed internal values', () => {
  const found: string[] = []
  for (const root of ROOTS) {
    for (const path of getSourceFiles(join(REPO, root))) {
      const file = relative(REPO, path)
      for (const { text, line } of getTierTexts(path)) {
        const allowed = ALLOWED.some((a) => a.file === file && a.text === text)
        if (!allowed) found.push(`${file}:${line}: ${JSON.stringify(text)}`)
      }
    }
  }
  expect(found).toEqual([])
})

test("the source guard reads copy and ignores code values", () => {
  const hits = getTierTexts(
    "snippet.tsx",
    [
      'const unit = { unit: "tier" }',
      "const label = `${name} tier`",
      "const el = <p>Tier legend</p>",
      'const title = "Outcome tiers"',
      'const id = "cws-delivery-tier"',
      "const key = `tier${level}`",
      'const path = "/api/tiers/list"',
    ].join("\n"),
  ).map((h) => h.text)
  expect(hits).toEqual(["tier", "tier", "Tier legend", "Outcome tiers"])
})
