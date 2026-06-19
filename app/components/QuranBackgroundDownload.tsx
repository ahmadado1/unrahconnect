import { downloadFullQuran, isQuranFullyCached } from "@/lib/quranDownload"
import { useEffect } from "react"

const RETRY_DELAY_MS = 30_000

export default function QuranBackgroundDownload() {
  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const run = async () => {
      while (!cancelled) {
        try {
          if (await isQuranFullyCached()) return

          const success = await downloadFullQuran()
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
