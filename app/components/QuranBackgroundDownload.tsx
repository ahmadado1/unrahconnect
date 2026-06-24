import { downloadFullQuran, isQuranFullyCached } from "@/lib/quranDownload"
import { normalizeReadLanguage, warmReadCacheForLanguage } from "@/lib/quranReadCache"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect } from "react"

const RETRY_DELAY_MS = 30_000

export default function QuranBackgroundDownload() {
  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const warmIfReady = async () => {
      const language = normalizeReadLanguage((await AsyncStorage.getItem("language")) ?? "en")
      await warmReadCacheForLanguage(language)
    }

    const run = async () => {
      while (!cancelled) {
        try {
          if (await isQuranFullyCached()) {
            await warmIfReady()
            return
          }

          const success = await downloadFullQuran()
          if (success) {
            await warmIfReady()
          }
          if (success || cancelled) return
        } catch (e) {
          console.log("[QuranDownload] Error:", e)
        }

        await new Promise<void>(resolve => {
          retryTimer = setTimeout(resolve, RETRY_DELAY_MS)
        })
      }
    }

    run()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [])

  return null
}
