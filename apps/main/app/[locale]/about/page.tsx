import AboutClient from "./AboutClient"

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }]
}

export default function Page() {
  return <AboutClient />
}
