import { useTranslation as useSharedTranslation } from "@repo/i18n"
import { TranslationSchemaKeys } from "./types"

export function useMainAppTranslation() {
  // Grab the untyped hook from the shared package
  const { locale, t: baseT, setLocale } = useSharedTranslation()

  // Wrap the base t function with the known keys from our local JSON
  function t(key: TranslationSchemaKeys): string {
    return baseT(key) as string
  }
  return { locale, t, setLocale }
}
