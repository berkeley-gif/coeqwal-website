export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }]
}

export default function VerificationPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Verification</h1>
      <p>This page is temporarily disabled while being rebuilt.</p>
    </div>
  )
}
