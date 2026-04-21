import { use } from "react"
import DataClient from "./DataClient"

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }]
}

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  use(params)
  return <DataClient />
}
