import PrayerPopupModal from "./PrayerPopupModal"
import { registerPrayerAlertHandler } from "@/lib/prayerAlert"
import { ADHAN_FILES, PRAYER_NAMES, type PrayerName } from "@/lib/prayerConstants"
import { fetchAndCachePrayerTimes, readCachedPrayerTimes, timeToMinutes, type CachedPrayerTimes } from "@/lib/prayerTimes"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAudioPlayer, setAudioModeAsync } from "expo-audio"
import { useEffect, useRef, useState } from "react"

const SHOWN_POPUPS_KEY = "prayer_popups_shown_date"

function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

export default function PrayerAlertProvider({ children }: { children: React.ReactNode }) {
  const [prayerPopup, setPrayerPopup] = useState<PrayerName | null>(null)
  const [prayerTimes, setPrayerTimes] = useState<CachedPrayerTimes | null>(null)
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set())
  const [adhanId, setAdhanId] = useState("1")
  const snoozeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const player = useAudioPlayer(ADHAN_FILES[adhanId] ?? ADHAN_FILES["1"])
  const adhanIdRef = useRef(adhanId)
  const showPrayerAlertRef = useRef<(prayerName: PrayerName, playSound?: boolean) => void>(() => {})

  adhanIdRef.current = adhanId

  const playAdhan = async () => {
    try {
      const selected = (await AsyncStorage.getItem("selected_adhan")) || "1"
      const file = ADHAN_FILES[selected] ?? ADHAN_FILES["1"]
      if (selected !== adhanIdRef.current) {
        setAdhanId(selected)
        player.replace(file)
      }
      player.seekTo(0)
      player.play()
    } catch (e) {
      console.log("Adhan sound error:", e)
    }
  }

  showPrayerAlertRef.current = (prayerName: PrayerName, playSound = true) => {
    setPrayerPopup(prayerName)
    setShownPopups(prev => new Set([...prev, prayerName]))
    if (playSound) {
      playAdhan()
    }
  }

  const dismissPrayerAlert = () => {
    setPrayerPopup(null)
    try {
      player.pause()
    } catch {}
  }

  useEffect(() => {
    return registerPrayerAlertHandler((name, playSound) => {
      showPrayerAlertRef.current(name, playSound)
    })
  }, [])

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(console.log)

    AsyncStorage.getItem("selected_adhan").then(id => {
      if (id && ADHAN_FILES[id]) {
        setAdhanId(id)
        player.replace(ADHAN_FILES[id])
      }
    })

    AsyncStorage.getItem(SHOWN_POPUPS_KEY).then(saved => {
      const today = getTodayKey()
      if (saved === today) {
        AsyncStorage.getItem("prayer_popups_shown_list").then(list => {
          if (list) setShownPopups(new Set(JSON.parse(list)))
        })
      }
    })
  }, [])

  useEffect(() => {
    const today = getTodayKey()
    AsyncStorage.setItem(SHOWN_POPUPS_KEY, today)
    AsyncStorage.setItem("prayer_popups_shown_list", JSON.stringify([...shownPopups]))
  }, [shownPopups])

  useEffect(() => {
    let cancelled = false

    const loadTimes = async () => {
      const cached = await readCachedPrayerTimes()
      if (cached && !cancelled) setPrayerTimes(cached)

      const fresh = await fetchAndCachePrayerTimes()
      if (fresh && !cancelled) setPrayerTimes(fresh)
    }

    loadTimes()
    const refreshTimer = setInterval(loadTimes, 6 * 60 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(refreshTimer)
    }
  }, [])

  useEffect(() => {
    if (!prayerTimes) return

    const checkPrayer = () => {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      for (const name of PRAYER_NAMES) {
        const prayerMin = timeToMinutes(prayerTimes[name])
        if (nowMinutes >= prayerMin && nowMinutes <= prayerMin + 10 && !shownPopups.has(name)) {
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
    const now = new Date()
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
    const timer = setTimeout(() => setShownPopups(new Set()), msUntilMidnight)
    return () => clearTimeout(timer)
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
        onSnooze={() => {
          const snoozed = prayerPopup
          dismissPrayerAlert()
          if (snoozeTimer.current) clearTimeout(snoozeTimer.current)
          if (snoozed) {
            snoozeTimer.current = setTimeout(() => showPrayerAlertRef.current(snoozed, true), 5 * 60 * 1000)
          }
        }}
      />
    </>
  )
}
