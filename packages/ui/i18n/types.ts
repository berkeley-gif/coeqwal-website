// Since both JSON files share the same structure, we only need one type:

import english from "../public/locales/english.json" assert { type: "json" }
export type BaseTranslationSchema = typeof english

/**
 * TypeScript only allows top-level keys from the JSON file to be used as type keys.
 * So we need to recursively build dot-notation keys for all nested objects,
 * e.g. "CaliforniaWaterPanel.title", "CaliforniaWaterPanel.pg1", etc.
 */
type DotNestedKeys<T> = T extends object
  ? {
      [K in keyof T & string]: 
        T[K] extends object
          ? `${K}.${DotNestedKeys<T[K]>}`
          : K
    }[keyof T & string]
  : never

// A union of all possible dot-notation paths
export type TranslationSchemaKeys = DotNestedKeys<BaseTranslationSchema>