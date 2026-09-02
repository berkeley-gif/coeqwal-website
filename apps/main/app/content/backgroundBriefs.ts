/**
 * Background Briefs documentation
 *
 * Maps each background-brief HTML page (in
 * public/documents/Background/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug.
 *
 * These documents are standalone reference material — they are not resolved
 * against the scenario API/hooks, so no scenario_id/short_code mapping is
 * involved here.
 *
 * To add a new background brief: drop the HTML file in that folder and add
 * one entry below.
 */

export interface BackgroundBriefDocument {
  /** Stable id, used as the dropdown's value. Never shown to users. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Filename within public/documents/Background/. */
  file: string
}

/** Base path (under public/) where background brief pages are served from. */
const BACKGROUND_BRIEFS_PATH = "/documents/Background"

export const BACKGROUND_BRIEF_DOCUMENTS: BackgroundBriefDocument[] = [
  {
    id: "project-background-brief",
    label: "The COEQWAL project",
    file: "project_background_brief.html",
  },
  {
    id: "known-limitations-and-how-coeqwal-handles-them",
    label: "Known limitations and how COEQWAL handles them",
    file: "known-limitations-and-how-coeqwal-handles-them.html",
  },
]

/**
 * Background briefs shown as standalone "View" buttons — above the water
 * management strategies dropdown, in that section — rather than as options
 * in the dropdown above.
 */
export const BACKGROUND_BRIEF_STANDALONE_DOCUMENTS: BackgroundBriefDocument[] =
  [
    {
      id: "scenario-library-brief",
      label: "The COEQWAL scenario library",
      file: "scenario_library_brief.html",
    },
    {
      id: "hydroclimates-brief",
      label: "The five COEQWAL hydroclimates",
      file: "hydroclimates_brief.html",
    },
  ]

/** Resolve a background brief document's public URL from its filename. */
export function getBackgroundBriefDocumentUrl(file: string): string {
  return `${BACKGROUND_BRIEFS_PATH}/${file}`
}

/** Look up a background brief document by its stable id. */
export function getBackgroundBriefDocumentById(
  id: string,
): BackgroundBriefDocument | undefined {
  return BACKGROUND_BRIEF_DOCUMENTS.find((doc) => doc.id === id)
}
