import { useTranslation as useSharedTranslation } from "@repo/i18n"
import { TranslationSchemaKeys } from "./types"

export function useUiTranslation() {
  const { locale, t: baseT, setLocale } = useSharedTranslation()

  function t(key: TranslationSchemaKeys): string {
    return baseT(key) as string
  }

  return { locale, t, setLocale }
}
