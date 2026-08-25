import PrayerPopupModal from "./PrayerPopupModal"
import {
  configureAdhanAudioMode,
  playAdhan,
  stopAdhan,
} from "@/lib/adhanAudio"
import { normalizePrayerAlertOptions, registerPrayerAlertHandler } from "@/lib/prayerAlert"
import { PRAYER_NAMES, type PrayerName } from "@/lib/prayerConstants"
import {
  fetchAndCachePrayerTimes,
  getLocalGregorianDateKey,
  readCachedPrayerTimes,
  timeToMinutes,
  type CachedPrayerTimes,
} from "@/lib/prayerTimes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useRef, useState } from "react"
import { AppState, type AppStateStatus } from "react-native"

const SHOWN_POPUPS_KEY = "prayer_popups_shown_date"
/** How long after prayer time we still auto-trigger in-app Adhan */
const PRAYER_CATCHUP_MINUTES = 20

function getTodayKey() {
  return getLocalGregorianDateKey()
}

async function arePrayerAlertsEnabled() {
  const master = await AsyncStorage.getItem("notifications_enabled")
  if (master === "false") return false
  const prayer = await AsyncStorage.getItem("prayer_alerts_enabled")
  return prayer !== "false"
}

export default function PrayerAlertProvider({ children }: { children: React.ReactNode }) {
  const [prayerPopup, setPrayerPopup] = useState<PrayerName | null>(null)
  const [prayerTimes, setPrayerTimes] = useState<CachedPrayerTimes | null>(null)
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set())
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shownPopupsRef = useRef(shownPopups)
  const shownHydratedRef = useRef(false)
  const showPrayerAlertRef = useRef<
    (prayerName: PrayerName, options?: boolean | import("@/lib/prayerAlert").PrayerAlertOptions) => void
  >(() => {})

  shownPopupsRef.current = shownPopups

  showPrayerAlertRef.current = (prayerName, rawOptions) => {
    const options = normalizePrayerAlertOptions(rawOptions)
    const alreadyShown = shownPopupsRef.current.has(prayerName)

    if (alreadyShown && !options.forceShow) {
      if (options.playSound) {
        void playAdhan(prayerName, {
          forceRestart: false,
          continueIfPlaying: true,
          seekSeconds: options.seekSeconds,
        })
      }
      return
    }

    setPrayerPopup(prayerName)
    if (!alreadyShown) {
      setShownPopups(prev => new Set([...prev, prayerName]))
    }

    if (options.playSound) {
      void playAdhan(prayerName, {
        forceRestart: options.forceRestart,
        continueIfPlaying: options.continueIfPlaying,
        seekSeconds: options.seekSeconds,
      })
    }
  }

  const dismissPrayerAlert = () => {
    setPrayerPopup(null)
  }

  const handlePrayNow = () => {
    void stopAdhan()
    setPrayerPopup(null)
  }

  useEffect(() => {
    return registerPrayerAlertHandler(async (name, rawOptions) => {
      if (!(await arePrayerAlertsEnabled())) return
      // Ensure AV session is ready before any Adhan starts from a notification.
      await configureAdhanAudioMode().catch(() => {})
      const options = normalizePrayerAlertOptions(rawOptions)
      if (shownPopupsRef.current.has(name) && !options.forceShow) {
        if (options.playSound) {
          showPrayerAlertRef.current(name, {
            ...options,
            forceShow: false,
            continueIfPlaying: true,
            forceRestart: false,
          })
        }
        return
      }
      showPrayerAlertRef.current(name, options)
    })
  }, [])

  useEffect(() => {
    configureAdhanAudioMode().catch(console.log)

    let cancelled = false
    ;(async () => {
      try {
        const today = getTodayKey()
        const saved = await AsyncStorage.getItem(SHOWN_POPUPS_KEY)
        if (saved === today) {
          const list = await AsyncStorage.getItem("prayer_popups_shown_list")
          if (!cancelled && list) {
            setShownPopups(new Set(JSON.parse(list)))
          }
        } else {
          await AsyncStorage.setItem(SHOWN_POPUPS_KEY, today)
          await AsyncStorage.setItem("prayer_popups_shown_list", "[]")
        }
      } catch (e) {
        console.log("Prayer popup hydrate error:", e)
      } finally {
        if (!cancelled) shownHydratedRef.current = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!shownHydratedRef.current) return
    const today = getTodayKey()
    AsyncStorage.setItem(SHOWN_POPUPS_KEY, today)
    AsyncStorage.setItem("prayer_popups_shown_list", JSON.stringify([...shownPopups]))
  }, [shownPopups])

  useEffect(() => {
    let cancelled = false

    const loadTimes = async (force = false) => {
      const cached = await readCachedPrayerTimes()
      if (cached && !cancelled) setPrayerTimes(cached)

      // Location-aware cache inside fetchAndCachePrayerTimes; force only for periodic / midnight.
      const fresh = await fetchAndCachePrayerTimes({ force })
      if (fresh && !cancelled) setPrayerTimes(fresh)
    }

    loadTimes()
    const refreshTimer = setInterval(() => loadTimes(true), 6 * 60 * 60 * 1000)

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        void configureAdhanAudioMode().catch(() => {})
        // Re-check GPS so a city change after travel updates times without reinstall.
        void loadTimes(false)
      }
    }
    const sub = AppState.addEventListener("change", onAppState)

    return () => {
      cancelled = true
      clearInterval(refreshTimer)
      sub.remove()
    }
  }, [])

  useEffect(() => {
    if (!prayerTimes) return

    const checkPrayer = async () => {
      if (!shownHydratedRef.current) return
      if (!(await arePrayerAlertsEnabled())) return

      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      for (const name of PRAYER_NAMES) {
        const prayerMin = timeToMinutes(prayerTimes[name])
        if (prayerMin < 0) continue
        if (
          nowMinutes >= prayerMin &&
          nowMinutes <= prayerMin + PRAYER_CATCHUP_MINUTES &&
          !shownPopupsRef.current.has(name)
        ) {
          showPrayerAlertRef.current(name, true)
          break
        }
      }
    }

    checkPrayer()
    const interval = setInterval(checkPrayer, 15000)
    return () => clearInterval(interval)
  }, [prayerTimes, shownPopups])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const scheduleMidnightClear = () => {
      const now = new Date()
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
      timer = setTimeout(() => {
        setShownPopups(new Set())
        AsyncStorage.setItem(SHOWN_POPUPS_KEY, getTodayKey())
        AsyncStorage.setItem("prayer_popups_shown_list", "[]")
        // New day → force fresh timings + notification schedule
        void fetchAndCachePrayerTimes({ force: true }).then(fresh => {
          if (fresh) setPrayerTimes(fresh)
        })
        scheduleMidnightClear()
      }, msUntilMidnight + 500)
    }

    scheduleMidnightClear()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
    }
  }, [])

  return (
    <>
      {children}
      <PrayerPopupModal
        visible={prayerPopup !== null}
        prayerName={prayerPopup}
        onDismiss={dismissPrayerAlert}
        onPrayNow={handlePrayNow}
        onSnooze={() => {
          const snoozed = prayerPopup
          dismissPrayerAlert()
          void stopAdhan()
          if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
          if (snoozed) {
            snoozeTimer.current = setTimeout(
              () =>
                showPrayerAlertRef.current(snoozed, {
                  playSound: true,
                  forceRestart: true,
                  continueIfPlaying: false,
                  forceShow: true,
                }),
              5 * 60 * 1000
            )
          }
        }}
      />
    </>
  )
}
