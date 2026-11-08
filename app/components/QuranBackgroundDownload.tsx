// Saves the whole Quran (Mushaf pages + read mode) on the phone in the background,
// so it works offline.
//
// Made gentle for budget phones and mobile data (it used to start at every launch, retry
// every 30 seconds forever and re-check the whole Quran every minute):
//   * waits 1 minute after the app opens, so the first screens stay smooth
//   * only downloads on Wi-Fi (pilgrims' mobile data is expensive)
//   * at most 3 tries per app session
//   * runs again only when the language changes (new translation needed)
// Users can still download right away from the Quran screen.
import { downloadFullQuran, isQuranFullyCached } from "@/lib/quranDownload"
import i18n from "@/i18n"
import * as Network from "expo-network"
import { useEffect } from "react"

const START_DELAY_MS = 60_000
const RETRY_DELAY_MS = 5 * 60_000
const MAX_TRIES = 3

async function onWifi() {
  try {
    const state = await Network.getNetworkStateAsync()
    return state.type === Network.NetworkStateType.WIFI && state.isInternetReachable !== false
  } catch {
    return false
  }
}

export default function QuranBackgroundDownload() {
  useEffect(() => {
    let cancelled = false
    let running = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const run = async () => {
      if (running || cancelled) return
      running = true
      try {
        for (let attempt = 0; attempt < MAX_TRIES && !cancelled; attempt++) {
          if (await isQuranFullyCached()) return
          if (await onWifi()) {
            try {
              if (await downloadFullQuran()) return
            } catch (e) {
              console.log("[QuranDownload] Error:", e)
            }
          }
          await new Promise<void>(resolve => {
            timer = setTimeout(resolve, RETRY_DELAY_MS)
          })
        }
      } finally {
        running = false
      }
    }

    timer = setTimeout(run, START_DELAY_MS)

    // New language = new translation to save.
    const onLanguage = () => {
      setTimeout(run, 5_000)
    }
    i18n.on("languageChanged", onLanguage)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      i18n.off("languageChanged", onLanguage)
    }
  }, [])

  return null
}
