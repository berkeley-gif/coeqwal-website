import type { Page } from "@playwright/test"

// The site does not use the word "tier" in anything a visitor reads or
// hears: outcome levels go by their names (Optimal, Acceptable, At-risk,
// Critical) or as "outcome levels". getTierWording collects every place the
// word shows on the current page: the document title, each text node
// (including SVG text and hidden tooltip text), the rendered text as a
// whole (so a word split across inline elements still counts), and the
// attributes assistive technology reads.

/** Attributes whose text assistive technology reads out. */
const READ_ATTRIBUTES = [
  "aria-label",
  "aria-description",
  "aria-roledescription",
  "aria-valuetext",
  "aria-placeholder",
  "alt",
  "title",
  "placeholder",
]

/**
 * Text on the page that uses the word "tier" or "tiers".
 *
 * @param page - the page to read
 * @returns each offending title, text node, rendered line or attribute,
 *   trimmed; empty when clean
 */
export async function getTierWording(page: Page): Promise<string[]> {
  return page.evaluate((attributes) => {
    const word = /\btiers?\b/i
    const hits = new Set<string>()
    if (word.test(document.title)) hits.add(`title: ${document.title}`)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    )
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement
      if (!parent || parent.closest("script, style, noscript")) continue
      const text = node.textContent ?? ""
      if (word.test(text)) hits.add(text.trim().slice(0, 160))
    }
    for (const line of document.body.innerText.split("\n")) {
      if (word.test(line)) hits.add(`rendered: ${line.trim().slice(0, 160)}`)
    }
    for (const el of document.querySelectorAll("*")) {
      for (const attr of attributes) {
        const value = el.getAttribute(attr)
        if (value && word.test(value)) hits.add(`${attr}: ${value}`)
      }
    }
    return [...hits]
  }, READ_ATTRIBUTES)
}
