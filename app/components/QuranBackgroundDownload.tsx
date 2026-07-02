import { downloadFullQuran, isQuranFullyCached } from "@/lib/quranDownload"
import { normalizeReadLanguage, warmReadCacheForLanguage } from "@/lib/quranReadCache"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect } from "react"

const RETRY_DELAY_MS = 30_000
const LANGUAGE_CHECK_MS = 60_000

export default function QuranBackgroundDownload() {
  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let languageTimer: ReturnType<typeof setInterval> | undefined
    let lastLanguage = ""

    const warmIfReady = async () => {
      const language = normalizeReadLanguage((await AsyncStorage.getItem("language")) ?? "en")
      await warmReadCacheForLanguage(language)
    }

    const ensureDownloaded = async (): Promise<boolean> => {
      if (await isQuranFullyCached()) {
        await warmIfReady()
        return true
      }
      return downloadFullQuran()
    }

    const run = async () => {
      while (!cancelled) {
        try {
          const ready = await ensureDownloaded()
          if (ready || cancelled) return
        } catch (e) {
          console.log("[QuranDownload] Error:", e)
        }

        await new Promise<void>(resolve => {
          retryTimer = setTimeout(resolve, RETRY_DELAY_MS)
        })
      }
    }

    run()

    languageTimer = setInterval(async () => {
      if (cancelled) return
      const language = normalizeReadLanguage((await AsyncStorage.getItem("language")) ?? "en")
      if (language === lastLanguage && (await isQuranFullyCached())) return
      lastLanguage = language
      if (!(await isQuranFullyCached())) {
        downloadFullQuran().catch(console.log)
      } else {
        warmReadCacheForLanguage(language).catch(console.log)
      }
    }, LANGUAGE_CHECK_MS)

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      if (languageTimer) clearInterval(languageTimer)
    }
  }, [])

  return null
}
