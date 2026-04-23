import { use } from "react"
import TestVplpClient from "./TestVplpClient"

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }]
}

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  use(params)
  return <TestVplpClient />
}
