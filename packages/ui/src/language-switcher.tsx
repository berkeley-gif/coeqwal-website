"use client"

import { useTranslation } from "@repo/i18n"
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material"

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  const handleChange = (event: SelectChangeEvent) => {
    setLocale(event.target.value as "en" | "es")
  }

  return (
    <FormControl variant="outlined" size="small">
      <InputLabel id="language-select-label">Language</InputLabel>
      <Select
        labelId="language-select-label"
        id="language-select"
        label="Language"
        value={locale}
        onChange={handleChange}
      >
        <MenuItem value="en">English</MenuItem>
        <MenuItem value="es">Español</MenuItem>
      </Select>
    </FormControl>
  )
}
