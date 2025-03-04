"use client"
import React, { useEffect, useState } from "react"
import Head from "next/head"
import { useUiLocale } from "@repo/ui/context/UiLocaleContext"

export function ClientSideHead() {
  const { locale } = useUiLocale()

  // Default to English
  const [title, setTitle] = useState("COEQWAL – Collaboratory for Equity in Water Allocation")
  const [description, setDescription] = useState("Alternative California water solutions")

  useEffect(() => {
    if (locale === "es") {
      setTitle("COEQWAL – Colaboratorio para la Equidad en la Asignación de Agua")
      setDescription("Soluciones alternativas de agua en California")
    } else {
      setTitle("COEQWAL – Collaboratory for Equity in Water Allocation")
      setDescription("Alternative California water solutions")
    }
  }, [locale])

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Any other meta tags to dynamically update */}
    </Head>
  )
}