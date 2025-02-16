import english from "./locales/english.json" assert { type: "json" }

// Automatically infer the translation schema from English
export type TranslationSchema = typeof english
