import { Header } from "@repo/ui/header"
import { HomePanel, CaliforniaWaterPanel } from "./components"
import styles from "./page.module.css"

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <HomePanel />
        <CaliforniaWaterPanel />
      </main>
    </div>
  )
}
