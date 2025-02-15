import { getMessages } from './dist/index.js' // 👈 Import from compiled `dist/`

(async () => {
  const messages = await getMessages('english', '../../apps/main/app')
  console.log("✅ Translations Loaded:", JSON.stringify(messages, null, 2))
})()
